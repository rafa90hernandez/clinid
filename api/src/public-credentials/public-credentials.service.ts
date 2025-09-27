import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { SetPinDto } from './dto/set-pin.dto';
import { PublicLinkInfoResponseDto } from './dto/public-link-info-response.dto';
import { PublicLinkStatus as LinkStatus, Prisma } from '@prisma/client';
import { randomUUID, randomBytes } from 'crypto';

type SetPinResult = {
  ok: true;
  userId: string;
  consentAt: Date | null;
  updatedAt: Date;
  slug: string;
};

type GrantOrRevokeConsentResult = {
  ok: true;
  userId: string;
  consentAt: Date | null;
};

/** Selects tipados (evitam `any` no retorno do Prisma) */
const selectPublicCredential = {
  userId: true,
  consentAt: true,
  updatedAt: true,
} as const;
type PublicCredentialSelected = Prisma.PublicCredentialGetPayload<{
  select: typeof selectPublicCredential;
}>;

const selectPublicLinkMinimal = {
  id: true,
  slug: true,
  status: true,
} as const;
type PublicLinkMinimal = Prisma.PublicLinkGetPayload<{
  select: typeof selectPublicLinkMinimal;
}>;

const selectPublicLinkInfo = {
  slug: true,
  status: true,
} as const;
type PublicLinkInfo = Prisma.PublicLinkGetPayload<{
  select: typeof selectPublicLinkInfo;
}>;

@Injectable()
export class PublicCredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Slug aleatório (curto) e URL-safe */
  private makeSlug(len = 10): string {
    return randomBytes(Math.ceil(len / 1.33))
      .toString('base64url')
      .slice(0, len);
  }

  /** Gera um slug único (evita colisão) */
  private async generateUniqueSlug(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const candidate = this.makeSlug(10);
      const collision = await this.prisma.publicLink.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!collision) return candidate;
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  /**
   * Define/atualiza o PIN público e registra consentimento.
   * - exige consent === true
   * - senha de login correta
   * - PIN 6 dígitos
   */
  async setPin(userId: string, dto: SetPinDto): Promise<SetPinResult> {
    if (!dto.consent) throw new BadRequestException('É necessário aceitar o consentimento.');
    if (!/^\d{6}$/.test(dto.pin))
      throw new BadRequestException('O PIN deve conter exatamente 6 dígitos.');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash) throw new UnauthorizedException('Conta sem senha definida.');

    const passwordOk = await argon2.verify(user.passwordHash, dto.confirmLoginPassword);
    if (!passwordOk) throw new UnauthorizedException('Senha de confirmação inválida.');

    const pinHash = await argon2.hash(dto.pin, { type: argon2.argon2id });

    // credencial pública (retorno 100% tipado)
    const updatedCredential: PublicCredentialSelected =
      await this.prisma.publicCredential.upsert({
        where: { userId }, // normalmente único em PublicCredential
        update: { pinHash, consentAt: new Date() },
        create: { userId, pinHash, consentAt: new Date() },
        select: selectPublicCredential,
      });

    // link público: cria se não existir; caso exista, ativa por id (único)
    const existing: PublicLinkMinimal | null = await this.prisma.publicLink.findFirst({
      where: { userId },
      select: selectPublicLinkMinimal,
    });

    let publicLinkSlug: string;

    if (!existing) {
      const uniqueSlug = await this.generateUniqueSlug();
      const created = await this.prisma.publicLink.create({
        data: {
          id: randomUUID(),
          userId,
          slug: uniqueSlug,
          status: LinkStatus.ACTIVE,
          revokedAt: null,
        },
        select: { slug: true },
      });
      publicLinkSlug = created.slug;
    } else {
      await this.prisma.publicLink.update({
        where: { id: existing.id },
        data: { status: LinkStatus.ACTIVE, revokedAt: null },
      });
      publicLinkSlug = existing.slug;
    }

    return {
      ok: true,
      userId: updatedCredential.userId,
      consentAt: updatedCredential.consentAt,
      updatedAt: updatedCredential.updatedAt,
      slug: publicLinkSlug,
    };
  }

  /** Concede consentimento explícito (sem alterar PIN) e garante link ativo. */
  async grantConsent(userId: string): Promise<GrantOrRevokeConsentResult> {
    const updated: PublicCredentialSelected = await this.prisma.publicCredential.update({
      where: { userId },
      data: { consentAt: new Date() },
      select: selectPublicCredential,
    });

    const link: { id: string } | null = await this.prisma.publicLink.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!link) {
      const uniqueSlug = await this.generateUniqueSlug();
      await this.prisma.publicLink.create({
        data: {
          id: randomUUID(),
          userId,
          slug: uniqueSlug,
          status: LinkStatus.ACTIVE,
          revokedAt: null,
        },
      });
    } else {
      await this.prisma.publicLink.update({
        where: { id: link.id },
        data: { status: LinkStatus.ACTIVE, revokedAt: null },
      });
    }

    return { ok: true, ...updated };
  }

  /** Revoga consentimento (mantém PIN) e marca link como REVOKED. */
  async revokeConsent(userId: string): Promise<GrantOrRevokeConsentResult> {
    const updated: PublicCredentialSelected = await this.prisma.publicCredential.update({
      where: { userId },
      data: { consentAt: null },
      select: selectPublicCredential,
    });

    const link: { id: string } | null = await this.prisma.publicLink.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (link) {
      await this.prisma.publicLink.update({
        where: { id: link.id },
        data: { status: LinkStatus.REVOKED, revokedAt: new Date() },
      });
    }

    return { ok: true, ...updated };
  }

  /** Info do link público do usuário autenticado (para QR no front). */
  async getPublicLinkInfo(userId: string): Promise<PublicLinkInfoResponseDto | null> {
    const publicLink: PublicLinkInfo | null = await this.prisma.publicLink.findFirst({
      where: { userId },
      select: selectPublicLinkInfo,
    });

    if (!publicLink) return null;

    const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    const profileUrl = `${webBaseUrl}/p/${publicLink.slug}`;
    const qrCodeUrl = `${webBaseUrl}/api/qr-code?data=${encodeURIComponent(profileUrl)}`;

    return {
      slug: publicLink.slug,
      status: publicLink.status,
      isActive: publicLink.status === LinkStatus.ACTIVE,
      qrCodeUrl,
    };
  }
}
