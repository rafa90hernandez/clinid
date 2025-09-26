// C:\Users\rafae\clinid\api\src\public-credentials\public-credentials.service.ts

import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common'; // Adicionado NotFoundException
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { SetPinDto } from './dto/set-pin.dto';
import { PublicLinkInfoResponseDto } from './dto/public-link-info-response.dto'; // Importe o novo DTO

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

    // 3) Buscar hash da senha do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Conta sem senha definida.');
    }

    // 4) Validar senha de confirmação (senha de login)
    const ok = await argon2.verify(user.passwordHash, dto.confirmLoginPassword);
    if (!ok) {
      throw new UnauthorizedException('Senha de confirmação inválida.');
    }

    // 5) Atualizar/definir o PIN e gravar consentimento
    const pinHash = await argon2.hash(dto.pin, { type: argon2.argon2id });

    // Crie ou atualize PublicCredential
    const updatedCredential = await this.prisma.publicCredential.upsert({
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

    // Crie ou atualize PublicLink com status 'active'
    // Se já existe, atualiza status para 'active'. Se não existe, cria um slug único.
    let publicLink = await this.prisma.publicLink.findUnique({ where: { userId } });

    if (!publicLink) {
      // Gera um slug único. Você pode querer uma lógica mais robusta para slugs,
      // como verificar unicidade e regenerar se houver colisão.
      const generateSlug = () => Math.random().toString(36).substring(2, 8); // 6 caracteres alfanuméricos
      let uniqueSlug = generateSlug();
      let slugExists = await this.prisma.publicLink.findUnique({ where: { slug: uniqueSlug } });
      while (slugExists) {
          uniqueSlug = generateSlug();
          slugExists = await this.prisma.publicLink.findUnique({ where: { slug: uniqueSlug } });
      }

      publicLink = await this.prisma.publicLink.create({
        data: {
          userId,
          slug: uniqueSlug,
          status: 'active',
        },
      });
    } else {
      // Se já existe, garante que está ativo (caso tenha sido revogado)
      publicLink = await this.prisma.publicLink.update({
        where: { userId },
        data: { status: 'active', revokedAt: null },
      });
    }

    return {
      ok: true,
      userId: updatedCredential.userId,
      consentAt: updatedCredential.consentAt,
      updatedAt: updatedCredential.updatedAt,
      slug: publicLink.slug, // Retorna o slug também
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
    // Garante que o link também esteja ativo se o consentimento for concedido
    await this.prisma.publicLink.upsert({
      where: { userId },
      update: { status: 'active', revokedAt: null },
      create: { userId, slug: Math.random().toString(36).substring(2, 8), status: 'active' }, // Gera slug se não existir
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
    // Revoga o status do link público também
    await this.prisma.publicLink.update({
      where: { userId },
      data: { status: 'revoked', revokedAt: new Date() },
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

  /**
   * Obtém as informações do link público para o usuário autenticado.
   * Usado pelo frontend para exibir o link e QR Code do próprio usuário.
   */
  async getPublicLinkInfo(userId: string): Promise<PublicLinkInfoResponseDto | null> {
    const publicLink = await this.prisma.publicLink.findUnique({
      where: { userId },
      select: {
        slug: true,
        status: true,
      },
    });

    if (!publicLink) {
      return null;
    }

    // A URL base do frontend para montar o QR Code
    // Certifique-se de definir NEXT_PUBLIC_WEB_URL no seu .env do backend
    const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const qrCodeUrl = `${webBaseUrl}/api/qr-code?data=${encodeURIComponent(`${webBaseUrl}/p/${publicLink.slug}`)}`; // Exemplo de geração, ajuste conforme seu gerador de QR Code
    // Note: No contexto do cliente, o QR code geralmente aponta para a página do perfil público
    // e não para a API. A API pode retornar a URL da imagem do QR code se ela for gerada no backend.
    // Ou o frontend pode gerar a URL completa com base no slug.

    return {
      slug: publicLink.slug,
      status: publicLink.status,
      isActive: publicLink.status === 'active',
      qrCodeUrl: qrCodeUrl,
    };
  }
}