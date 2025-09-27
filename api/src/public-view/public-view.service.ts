import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
  import * as argon2 from 'argon2';
import { ProfileResponse } from '../profiles/dto/profile.response.dto';
import { Prisma, PublicLinkStatus as LinkStatus } from '@prisma/client';

// Tipo de resposta retornado ao controller
export type PublicAccessResponse = {
  ok: boolean;
  profile: ProfileResponse;
};

/** Selects tipados para evitar `any` no retorno do Prisma */
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

const selectClinicalProfilePublic = {
  firstName: true,
  lastName: true,
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

  /**
   * Verifica o PIN para acesso público ao perfil clínico associado a um slug.
   * @param slug O identificador único do link público.
   * @param pin  O PIN de 6 dígitos fornecido para acesso.
   */
  async view(slug: string, pin: string): Promise<PublicAccessResponse> {
    // 1) Link público pelo slug
    const publicLink: PublicLinkForAccess | null = await this.prisma.publicLink.findUnique({
      where: { slug },
      select: selectPublicLinkForAccess,
    });

    if (!publicLink || publicLink.status === LinkStatus.REVOKED) {
      throw new NotFoundException('Link público não encontrado ou revogado.');
    }

    // 2) Credencial pública (PIN + consentimento)
    const publicCredential: PublicCredentialForAccess | null =
      await this.prisma.publicCredential.findUnique({
        where: { userId: publicLink.userId },
        select: selectPublicCredentialForAccess,
      });

    if (!publicCredential || !publicCredential.pinHash) {
      throw new UnauthorizedException('PIN público não configurado para este perfil.');
    }

    // 3) Verifica consentimento
    if (!publicCredential.consentAt) {
      throw new ForbiddenException('Acesso público não autorizado (consentimento pendente).');
    }

    // 4) Valida PIN
    const isPinValid = await argon2.verify(publicCredential.pinHash, pin);
    if (!isPinValid) {
      throw new UnauthorizedException('PIN incorreto.');
    }

    // 5) Busca perfil clínico público
    const clinicalProfile: ClinicalProfilePublic | null =
      await this.prisma.clinicalProfile.findUnique({
        where: { userId: publicLink.userId },
        select: selectClinicalProfilePublic,
      });

    if (!clinicalProfile) {
      throw new NotFoundException('Perfil clínico não encontrado para este usuário.');
    }

    // 6) Monta resposta no formato esperado pelo front
    const profile: ProfileResponse = {
      firstName: clinicalProfile.firstName,
      lastName: clinicalProfile.lastName,
      sex: clinicalProfile.sex,
      bloodType: clinicalProfile.bloodType,
      allergies: clinicalProfile.allergies,
      medications: clinicalProfile.medications,
      diseases: clinicalProfile.diseases,
      surgeries: clinicalProfile.surgeries,
      emergencyContactName: clinicalProfile.emergencyContactName,
      emergencyContactPhone: clinicalProfile.emergencyContactPhone,
    };

    return { ok: true, profile };
  }
}
