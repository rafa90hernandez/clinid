import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

// Tipo que também será usado no controller
export type PublicViewResponse = {
  first_name: string;
  last_name: string;
  sex: string | null;
  blood_type: string | null;
  allergies: string[];
  medications: string[];
  diseases: string[];
  surgeries: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  updated_at: string; // ISO
};

@Injectable()
export class PublicViewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida PIN + slug ativo e retorna os dados clínicos em modo somente-leitura.
   */
  async view(slug: string, pin: string): Promise<PublicViewResponse> {
    // 1) Link público ativo
    const link = await this.prisma.publicLink.findUnique({
      where: { slug },
      select: { id: true, status: true, userId: true },
    });
    if (!link || link.status !== 'active') {
      throw new BadRequestException('Link inválido ou revogado');
    }

    // 2) PIN do usuário
    const cred = await this.prisma.publicCredential.findUnique({
      where: { userId: link.userId },
      select: { pinHash: true },
    });
    if (!cred) {
      throw new BadRequestException('PIN não configurado');
    }

    const ok = await argon2.verify(cred.pinHash, pin);
    if (!ok) {
      throw new BadRequestException('PIN inválido');
    }

    // 3) Perfil clínico
    const profile = await this.prisma.clinicalProfile.findUnique({
      where: { userId: link.userId },
      select: {
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
        updatedAt: true,
      },
    });
    if (!profile) {
      throw new BadRequestException('Perfil clínico não encontrado');
    }

    // (opcional) Audit
    await this.prisma.auditLog
      .create({
        data: {
          actorId: null, // público
          action: 'PUBLIC_VIEW',
          target: `link:${slug}`,
          details: { slug },
        },
      })
      .catch(() => void 0);

    // 4) Mapeia para snake_case conforme contrato público
    return {
      first_name: profile.firstName,
      last_name: profile.lastName,
      sex: profile.sex,
      blood_type: profile.bloodType,
      allergies: profile.allergies ?? [],
      medications: profile.medications ?? [],
      diseases: profile.diseases ?? [],
      surgeries: profile.surgeries ?? [],
      emergency_contact_name: profile.emergencyContactName,
      emergency_contact_phone: profile.emergencyContactPhone,
      updated_at: profile.updatedAt.toISOString(),
    };
  }
}
