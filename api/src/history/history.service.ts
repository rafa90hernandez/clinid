import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, limit = 10) {
    const rows = await this.prisma.clinicalHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        changedAt: true,
        changedBy: true,
        note: true,
        snapshot: true,
      },
    });
    return rows;
  }

  async latest(userId: string) {
    const row = await this.prisma.clinicalHistory.findFirst({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      select: {
        id: true,
        changedAt: true,
        changedBy: true,
        note: true,
        snapshot: true,
      },
    });
    return row ?? null;
  }
}
