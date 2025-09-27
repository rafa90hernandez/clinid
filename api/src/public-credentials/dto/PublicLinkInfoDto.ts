import { PublicLinkStatus } from '@prisma/client';

export class PublicLinkInfoDto {
  slug!: string;
  status!: PublicLinkStatus;
  isActive!: boolean;
  qrCodeUrl?: string | null; // opcional, se você usar no response

  constructor(init?: Partial<PublicLinkInfoDto>) {
    Object.assign(this, init);
  }
}
