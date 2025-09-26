// api/src/accounts/accounts.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface LocalUser {
  sub: string; // user.id
  email: string; // user.email
}

export type PublicUser = {
  id: string;
  email: string;
  role: string | null;
  createdAt: Date;
};

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Registro (email único, hash argon2id). */
  async register(email: string, password: string) {
    const exists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.register',
        target: `user:${user.id}`,
        details: { email },
      },
    });

    return user; // { id, email, createdAt }
  }

  /** Login com email/senha → retorna payload mínimo para req.user. */
  async validateUser(email: string, password: string): Promise<LocalUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'auth.login.failure',
          target: `user:${user.id}`,
          details: { email },
        },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.login.success',
        target: `user:${user.id}`,
        details: { email },
      },
    });

    return { sub: user.id, email: user.email };
  }

  /** Emite JWT (expiração via JwtModule). */
  issueAccessToken(user: LocalUser) {
    const payload = { sub: user.sub, email: user.email };
    const access_token = this.jwt.sign(payload);
    return { access_token };
  }

  /**
   * Esqueci minha senha:
   * - sempre retorna { ok: true } (não vaza existência)
   * - gera token curto, salva hash e loga URL em dev
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { ok: true };

    const rawToken = randomBytes(24).toString('base64url');
    const tokenHash = await argon2.hash(rawToken, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    const rec = await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
      select: { id: true, userId: true, expiresAt: true, createdAt: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.password.forgot.request',
        target: `user:${user.id}`,
        details: { email },
      },
    });

    const base = process.env.WEB_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${base}/reset?id=${encodeURIComponent(
      rec.id,
    )}&token=${encodeURIComponent(rawToken)}`;

    // Loga em dev
    Logger.log(`[DEV] Reset URL: ${resetUrl}`, 'PasswordReset');

    return { ok: true };
  }

  async resetPassword(tokenId: string, rawToken: string, newPassword: string) {
    const token = await this.prisma.passwordResetToken.findUnique({
      where: { id: tokenId },
    });

    const invalid = () => new BadRequestException('Token inválido ou expirado');

    if (!token || token.usedAt) throw invalid();
    if (token.expiresAt.getTime() < Date.now()) throw invalid();

    const ok = await argon2.verify(token.tokenHash, rawToken);
    if (!ok) throw invalid();

    const user = await this.prisma.user.findUnique({ where: { id: token.userId } });
    if (!user) throw invalid();

    const same = await argon2.verify(user.passwordHash, newPassword);
    if (same) throw new BadRequestException('A nova senha deve ser diferente da atual');

    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'auth.password.reset',
          target: `user:${user.id}`,
          details: { tokenId: token.id },
        },
      }),
    ]);

    return { ok: true };
  }

  /** Usado pela JwtStrategy.validate(payload.sub) */
  async findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /** Helper para endpoints autenticados */
  async me(local: LocalUser): Promise<PublicUser | null> {
    return this.findPublicById(local.sub);
  }

  async deleteAccount(userId: string, confirmLoginPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const ok = await argon2.verify(user.passwordHash, confirmLoginPassword);
    if (!ok) throw new UnauthorizedException('Senha de confirmação inválida');

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'account.delete.request', // Ação para indicar que a exclusão foi solicitada
        target: `user:${userId}`,
        details: { reason: 'user_request_hard_delete' },
      },
    });

    await this.prisma.$transaction([
      this.prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    return { ok: true };
  }
}
