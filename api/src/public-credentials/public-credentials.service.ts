import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Verifique se este caminho está correto
import * as argon2 from 'argon2';
import { SetPinDto } from './dto/set-pin.dto'; // Importa o DTO modificado para o setPin

@Injectable()
export class PublicCredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Define/atualiza o PIN público e registra consentimento para o usuário autenticado.
   * Pré-requisitos:
   *  - dto.consent === true
   *  - senha de login correta (confirmLoginPassword)
   *  - PIN com exatamente 6 dígitos [0-9]
   */
  async setPin(userId: string, dto: SetPinDto): Promise<any> {
    // 1) Confirmação de consentimento explícito
    if (!dto.consent) {
      throw new BadRequestException('É necessário aceitar o consentimento.');
    }

    // 2) Validação do PIN (6 dígitos)
    if (!/^\d{6}$/.test(dto.pin)) {
      throw new BadRequestException('O PIN deve conter exatamente 6 dígitos.');
    }

    // 2) regra simples: PIN não deve ser igual à senha informada
    // 3) Buscar hash da senha do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Conta sem senha definida.');
    }

    // 4) Validar senha de confirmação (senha de login)
    // Neste ponto, dto.confirmLoginPassword é garantido como string
    // devido à validação do class-validator no SetPinDto.
    const ok = await argon2.verify(user.passwordHash, dto.confirmLoginPassword);
    if (!ok) {
      throw new UnauthorizedException('Senha de confirmação inválida.');
    }

    // 5) Atualizar/definir o PIN e gravar consentimento
    const pinHash = await argon2.hash(dto.pin, { type: argon2.argon2id });
    const updated = await this.prisma.publicCredential.upsert({
      where: { userId },
      update: {
        pinHash,
        consentAt: new Date(),
      },
      create: {
        userId,
        pinHash,
        consentAt: new Date(),
      },
      select: { userId: true, consentAt: true, updatedAt: true },
    });

    return {
      ok: true,
      userId: updated.userId,
      consentAt: updated.consentAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Concede consentimento explicitamente para o acesso público (sem alterar PIN).
   * Útil para fluxos em que o usuário já tem PIN e apenas aceita o termo.
   */
  async grantConsent(userId: string): Promise<any> {
    const updated = await this.prisma.publicCredential.update({
      where: { userId },
      data: { consentAt: new Date() },
      select: { userId: true, consentAt: true },
    });
    return { ok: true, ...updated };
  }

  /**
   * Revoga consentimento para o acesso público (mantém PIN, mas bloqueia exibição).
   */
  async revokeConsent(userId: string): Promise<any> {
    const updated = await this.prisma.publicCredential.update({
      where: { userId },
      data: { consentAt: null },
      select: { userId: true, consentAt: true },
    });
    return { ok: true, ...updated };
  }

  /**
   * Verifica rapidamente se o usuário possui consentimento ativo para acesso público.
   */
  async hasConsent(userId: string): Promise<boolean> {
    const cred = await this.prisma.publicCredential.findUnique({
      where: { userId },
      select: { consentAt: true },
    });
    return !!cred?.consentAt;
  }
}
