import { PublicLinkStatus } from '@prisma/client';

export class PublicLinkInfoDto {
  slug!: string;
  status!: PublicLinkStatus;
  isActive!: boolean;

  constructor(init?: Partial<PublicLinkInfoDto>) {
    Object.assign(this, init);
  }
}
