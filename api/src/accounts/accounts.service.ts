// api/src/accounts/accounts.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';

export interface LocalUser {
  sub: string;
  email: string;
}

export type PublicUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  idType: string | null;
  idNumber: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  cityCounty: string | null;
  postalCode: string | null;
  phoneNumber: string | null;
  role: string | null;
  createdAt: Date;
};

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const exists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        idType: dto.idType,
        idNumber: dto.idNumber.trim(),
        addressLine1: dto.addressLine1.trim(),
        addressLine2: dto.addressLine2?.trim() || null,
        country: dto.country.trim(),
        cityCounty: dto.cityCounty.trim(),
        postalCode: dto.postalCode.trim(),
        phoneNumber: dto.phoneNumber.trim(),
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        idType: true,
        idNumber: true,
        addressLine1: true,
        addressLine2: true,
        country: true,
        cityCounty: true,
        postalCode: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.register',
        target: `user:${user.id}`,
        details: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          idType: user.idType,
        },
      },
    });

    return user;
  }

  async validateUser(email: string, password: string): Promise<LocalUser> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await argon2.verify(user.passwordHash, password);

    if (!ok) {
      await this.prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'auth.login.failure',
          target: `user:${user.id}`,
          details: { email: normalizedEmail },
        },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.login.success',
        target: `user:${user.id}`,
        details: { email: normalizedEmail },
      },
    });

    return { sub: user.id, email: user.email };
  }

  issueAccessToken(user: LocalUser) {
    const payload = { sub: user.sub, email: user.email };
    const access_token = this.jwt.sign(payload);

    return { access_token };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) return { ok: true };

    const rawToken = randomBytes(24).toString('base64url');
    const tokenHash = await argon2.hash(rawToken, { type: argon2.argon2id });
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    const rec = await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
      select: { id: true, userId: true, expiresAt: true, createdAt: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'auth.password.forgot.request',
        target: `user:${user.id}`,
        details: { email: normalizedEmail },
      },
    });

    const base = process.env.WEB_BASE_URL || 'http://localhost:3000';

    const resetUrl = `${base}/reset?id=${encodeURIComponent(
      rec.id,
    )}&token=${encodeURIComponent(rawToken)}`;

    await this.mail.sendPasswordResetEmail(normalizedEmail, resetUrl);

    Logger.log(`Password reset email requested for ${normalizedEmail}`, 'PasswordReset');

    return { ok: true };
  }

  async resetPassword(tokenId: string, rawToken: string, newPassword: string) {
    const token = await this.prisma.passwordResetToken.findUnique({
      where: { id: tokenId },
    });

    const invalid = () => new BadRequestException('Invalid or expired token');

    if (!token || token.usedAt) throw invalid();
    if (token.expiresAt.getTime() < Date.now()) throw invalid();

    const ok = await argon2.verify(token.tokenHash, rawToken);
    if (!ok) throw invalid();

    const user = await this.prisma.user.findUnique({
      where: { id: token.userId },
    });

    if (!user) throw invalid();

    const same = await argon2.verify(user.passwordHash, newPassword);

    if (same) {
      throw new BadRequestException('The new password must be different from the current one');
    }

    const newHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    });

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

  async findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        idType: true,
        idNumber: true,
        addressLine1: true,
        addressLine2: true,
        country: true,
        cityCounty: true,
        postalCode: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async me(local: LocalUser): Promise<PublicUser | null> {
    return this.findPublicById(local.sub);
  }

  async deleteAccount(userId: string, confirmLoginPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const ok = await argon2.verify(user.passwordHash, confirmLoginPassword);

    if (!ok) {
      throw new UnauthorizedException('Invalid confirmation password');
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'account.delete.request',
        target: `user:${userId}`,
        details: { reason: 'user_request_hard_delete' },
      },
    });

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { ok: true };
  }
}
