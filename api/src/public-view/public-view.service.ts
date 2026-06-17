import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, PublicLinkStatus as LinkStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

export type PublicAccessResponse = {
  ok: boolean;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
  profile: {
    sex: string | null;
    bloodType: string | null;
    allergies: string[];
    medications: string[];
    diseases: string[];
    surgeries: string[];
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  };
};

const selectPublicLinkForAccess = {
  userId: true,
  status: true,
} as const;

type PublicLinkForAccess = Prisma.PublicLinkGetPayload<{
  select: typeof selectPublicLinkForAccess;
}>;

const selectPublicCredentialForAccess = {
  pinHash: true,
  consentAt: true,
} as const;

type PublicCredentialForAccess = Prisma.PublicCredentialGetPayload<{
  select: typeof selectPublicCredentialForAccess;
}>;

const selectUserPublic = {
  firstName: true,
  lastName: true,
} as const;

type UserPublic = Prisma.UserGetPayload<{
  select: typeof selectUserPublic;
}>;

const selectClinicalProfilePublic = {
  sex: true,
  bloodType: true,
  allergies: true,
  medications: true,
  diseases: true,
  surgeries: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
} as const;

type ClinicalProfilePublic = Prisma.ClinicalProfileGetPayload<{
  select: typeof selectClinicalProfilePublic;
}>;

@Injectable()
export class PublicViewService {
  constructor(private readonly prisma: PrismaService) {}

  async view(slug: string, pin: string): Promise<PublicAccessResponse> {
    const publicLink: PublicLinkForAccess | null = await this.prisma.publicLink.findUnique({
      where: { slug },
      select: selectPublicLinkForAccess,
    });

    if (!publicLink || publicLink.status === LinkStatus.REVOKED) {
      throw new NotFoundException('Public link not found or revoked.');
    }

    const publicCredential: PublicCredentialForAccess | null =
      await this.prisma.publicCredential.findUnique({
        where: { userId: publicLink.userId },
        select: selectPublicCredentialForAccess,
      });

    if (!publicCredential || !publicCredential.pinHash) {
      throw new UnauthorizedException('Public PIN is not configured for this profile.');
    }

    if (!publicCredential.consentAt) {
      throw new ForbiddenException('Public access is not authorized. Consent is pending.');
    }

    const isPinValid = await argon2.verify(publicCredential.pinHash, pin);

    if (!isPinValid) {
      throw new UnauthorizedException('Invalid PIN.');
    }

    const user: UserPublic | null = await this.prisma.user.findUnique({
      where: { id: publicLink.userId },
      select: selectUserPublic,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const clinicalProfile: ClinicalProfilePublic | null =
      await this.prisma.clinicalProfile.findUnique({
        where: { userId: publicLink.userId },
        select: selectClinicalProfilePublic,
      });

    if (!clinicalProfile) {
      throw new NotFoundException('Medical profile not found for this user.');
    }

    return {
      ok: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      profile: {
        sex: clinicalProfile.sex,
        bloodType: clinicalProfile.bloodType,
        allergies: clinicalProfile.allergies,
        medications: clinicalProfile.medications,
        diseases: clinicalProfile.diseases,
        surgeries: clinicalProfile.surgeries,
        emergencyContactName: clinicalProfile.emergencyContactName,
        emergencyContactPhone: clinicalProfile.emergencyContactPhone,
      },
    };
  }
}
