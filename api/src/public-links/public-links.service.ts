import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';

export type PublicLinkView = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: Date;
  revokedAt: Date | null;
};

@Injectable()
export class PublicLinksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Gera um slug curto, seguro e URL-safe */
  private makeSlug(len = 10): string {
    // base64url gera ~1,33 chars por byte => ceil(len/1.33)
    return randomBytes(Math.ceil(len / 1.33))
      .toString('base64url')
      .slice(0, len);
  }

  /**
   * Gera um novo link público "ativo".
   * - Antes, revoga qualquer link ativo anterior (1-ativo-por-usuário).
   * - Tenta múltiplos slugs em caso de colisão (P2002).
   */
  async generate(userId: string): Promise<PublicLinkView> {
    // revoga possíveis ativos antigos
    await this.prisma.publicLink.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'revoked', revokedAt: new Date() },
    });

    let created: PublicLinkView | null = null;

    for (let i = 0; i < 5; i++) {
      const slug = this.makeSlug(10);
      try {
        const row = await this.prisma.publicLink.create({
          data: {
            id: randomUUID(),
            userId,
            slug,
            status: 'active',
          },
          select: {
            id: true,
            slug: true,
            status: true,
            createdAt: true,
            revokedAt: true,
          },
        });

        created = row;

        // audit
        await this.prisma.auditLog
          .create({
            data: {
              id: randomUUID(),
              actorId: userId,
              action: 'GENERATE_PUBLIC_LINK',
              target: `link:${row.id}`,
              details: { slug: row.slug },
            },
          })
          .catch(() => void 0);

        break;
      } catch (e: unknown) {
        // colisão de slug (unique constraint)
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue;
        }
        throw e;
      }
    }

    if (!created) {
      throw new BadRequestException('Não foi possível gerar um link único.');
    }

    return created;
  }

  /** Retorna o link público "ativo" mais recente do usuário (ou null). */
  async getActiveByUser(userId: string): Promise<PublicLinkView | null> {
    const row = await this.prisma.publicLink.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        status: true,
        createdAt: true,
        revokedAt: true,
      },
    });
    return row ?? null;
  }

  /** Revoga um link específico do usuário. */
  async revoke(userId: string, linkId: string): Promise<PublicLinkView> {
    const link = await this.prisma.publicLink.findFirst({
      where: { id: linkId, userId },
      select: {
        id: true,
        slug: true,
        status: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    if (!link) {
      throw new NotFoundException('Link não encontrado');
    }

    const updated = await this.prisma.publicLink.update({
      where: { id: linkId },
      data: { status: 'revoked', revokedAt: new Date() },
      select: {
        id: true,
        slug: true,
        status: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    await this.prisma.auditLog
      .create({
        data: {
          id: randomUUID(),
          actorId: userId,
          action: 'REVOKE_PUBLIC_LINK',
          target: `link:${linkId}`,
          details: { slug: updated.slug },
        },
      })
      .catch(() => void 0);

    return updated;
  }

  /** (Opcional) Lista todos os links do usuário, ordenados por criação. */
  async listByUser(userId: string): Promise<
    Array<Pick<PublicLinkView, 'id' | 'slug' | 'status' | 'createdAt' | 'revokedAt'>>
  > {
    return this.prisma.publicLink.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        status: true,
        createdAt: true,
        revokedAt: true,
      },
    });
  }
}
