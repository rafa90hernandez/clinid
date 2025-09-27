import { PublicLinkStatus } from '@prisma/client';

export class PublicLinkInfoResponseDto {
  slug!: string;
  status!: PublicLinkStatus;
  isActive!: boolean;
  qrCodeUrl?: string | null; // ⬅️ ADICIONADO para suportar o uso nas services

  constructor(init?: Partial<PublicLinkInfoResponseDto>) {
    Object.assign(this, init);
  }
}
