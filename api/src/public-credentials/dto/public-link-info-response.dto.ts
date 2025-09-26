import { PublicLinkStatus } from '@prisma/client';

export class PublicLinkInfoResponseDto {
  slug!: string;
  status!: PublicLinkStatus;
  isActive!: boolean;

  constructor(init?: Partial<PublicLinkInfoResponseDto>) {
    Object.assign(this, init);
  }
}
