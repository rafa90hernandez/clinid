import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PublicLinkStatus as LinkStatus } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';

/** Select comum para “view” (evita any no retorno do Prisma) */
const selectPublicLinkView = {
  id: true,
  slug: true,
  status: true,
  createdAt: true,
  revokedAt: true,
} as const;

type PublicLinkView = Prisma.PublicLinkGetPayload<{
  select: typeof selectPublicLinkView;
}>;

@Injectable()
export class PublicLinksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Slug curto, aleatório e URL-safe */
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
    // fallback extremamente improvável de colidir
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  /**
   * Cria um novo link “ativo”.
   * - Revoga quaisquer antigos “ativos” do usuário (regra 1-ativo-por-usuário).
   * - Garante slug único.
   */
  async generate(userId: string): Promise<PublicLinkView> {
    // revoga todos os ativos anteriores
    await this.prisma.publicLink.updateMany({
      where: { userId, status: LinkStatus.ACTIVE },
      data: { status: LinkStatus.REVOKED, revokedAt: new Date() },
    });

    // cria novo ativo
    const slug = await this.generateUniqueSlug();
    const created: PublicLinkView = await this.prisma.publicLink.create({
      data: {
        id: randomUUID(),
        userId,
        slug,
        status: LinkStatus.ACTIVE,
        revokedAt: null,
      },
      select: selectPublicLinkView,
    });

    if (!created) {
      // teórico; create lança erro em caso de falha
      throw new BadRequestException('Não foi possível criar o link público.');
    }

    return created;
  }

  /** Retorna o link ativo mais recente do usuário (ou null). */
  async getActiveByUser(userId: string): Promise<PublicLinkView | null> {
    const row: PublicLinkView | null = await this.prisma.publicLink.findFirst({
      where: { userId, status: LinkStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      select: selectPublicLinkView,
    });
    return row ?? null;
  }

  /** Revoga um link específico do usuário. */
  async revoke(userId: string, linkId: string): Promise<PublicLinkView> {
    const link = await this.prisma.publicLink.findFirst({
      where: { id: linkId, userId },
      select: { id: true },
    });

    if (!link) {
      throw new NotFoundException('Link não encontrado.');
    }

    const updated: PublicLinkView = await this.prisma.publicLink.update({
      where: { id: linkId },
      data: { status: LinkStatus.REVOKED, revokedAt: new Date() },
      select: selectPublicLinkView,
    });

    return updated;
  }

  /** Lista todos os links do usuário, ordenados por criação (desc). */
  async listByUser(userId: string): Promise<PublicLinkView[]> {
    const rows: PublicLinkView[] = await this.prisma.publicLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: selectPublicLinkView,
    });
    return rows;
  }
}
