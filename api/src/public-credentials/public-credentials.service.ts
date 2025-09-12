// api/src/public-credentials/public-credentials.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetPinDto } from './dto/set-pin.dto';
import { randomUUID } from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class PublicCredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Define/atualiza o PIN público (6 dígitos).
   * Requer confirmação da senha de login.
   * Retorna o userId e o updatedAt do registro.
   */
  async setPin(userId: string, dto: SetPinDto): Promise<{ userId: string; updatedAt: Date }> {
    // 1) valida usuário e senha de login
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário inválido');

    const ok = await argon2.verify(user.passwordHash, dto.confirmLoginPassword);
    if (!ok) throw new BadRequestException('Senha de login incorreta');

    // 2) regra simples: PIN não deve ser igual à senha informada
    if (dto.pin === dto.confirmLoginPassword) {
      throw new BadRequestException('PIN não pode ser igual à senha de login');
    }

    // 3) hash do PIN (argon2id)
    const pinHash = await argon2.hash(dto.pin, { type: argon2.argon2id });

    // 4) upsert credencial pública
    const result = await this.prisma.publicCredential.upsert({
      where: { userId },
      update: { pinHash },
      create: { userId, pinHash },
      select: { userId: true, updatedAt: true },
    });

    // 5) audit
    await this.prisma.auditLog
      .create({
        data: {
          id: randomUUID(),
          actorId: userId,
          action: 'SET_PUBLIC_PIN',
          target: `user:${userId}`,
          details: {},
        },
      })
      .catch(() => void 0);

    return result;
  }

  /**
   * Remove o PIN público (idempotente). Requer confirmação da senha de login.
   * Útil para desativar o acesso público sem apagar o perfil.
   */
  async removePin(userId: string, confirmLoginPassword: string): Promise<{ ok: true }> {
    // 1) valida usuário e senha de login
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuário inválido');

    const ok = await argon2.verify(user.passwordHash, confirmLoginPassword);
    if (!ok) throw new BadRequestException('Senha de login incorreta');

    // 2) apaga credencial pública, ignorando caso não exista
    await this.prisma.publicCredential.delete({ where: { userId } }).catch(() => void 0);

    // 3) audit
    await this.prisma.auditLog
      .create({
        data: {
          id: randomUUID(),
          actorId: userId,
          action: 'REMOVE_PUBLIC_PIN',
          target: `user:${userId}`,
          details: {},
        },
      })
      .catch(() => void 0);

    return { ok: true };
  }
}
