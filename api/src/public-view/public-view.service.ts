// api/src/public-view/public-view.service.ts
import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { ProfileResponse } from '../profiles/dto/profile.response.dto';

// Tipo de resposta que o serviço irá retornar para o controlador.
export type PublicAccessResponse = {
  ok: boolean;
  profile: ProfileResponse; // Inclui os dados do perfil
};

@Injectable()
export class PublicViewService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Verifica o PIN para acesso público ao perfil clínico associado a um slug.
   * @param slug O identificador único do link público.
   * @param pin O PIN de 6 dígitos fornecido para acesso.
   * @returns Um objeto contendo o status de sucesso e os dados do perfil público.
   */
  async view(slug: string, pin: string): Promise<PublicAccessResponse> {
    // 1. Encontrar o link público pelo slug
    const publicLink = await this.prisma.publicLink.findUnique({
      where: { slug },
      select: { userId: true, status: true },
    });
    if (!publicLink || publicLink.status === 'revoked') {
      throw new NotFoundException('Link público não encontrado ou revogado.');
    }

    // 2. Encontrar as credenciais públicas do usuário
    const publicCredential = await this.prisma.publicCredential.findUnique({
      where: { userId: publicLink.userId },
      select: { pinHash: true, consentAt: true },
    });
    if (!publicCredential || !publicCredential.pinHash) {
      throw new UnauthorizedException('PIN público não configurado para este perfil.');
    }

    // 3. Verificar o consentimento
    if (!publicCredential.consentAt) {
      throw new ForbiddenException('Acesso público não autorizado (consentimento pendente).');
    }

    // 4. Verificar o PIN fornecido
    const isPinValid = await argon2.verify(publicCredential.pinHash, pin);
    if (!isPinValid) {
      throw new UnauthorizedException('PIN incorreto.');
    }

    // 5. Se tudo estiver ok, buscar e retornar os dados públicos do ClinicalProfile do usuário
    const clinicalProfile = await this.prisma.clinicalProfile.findUnique({
      where: { userId: publicLink.userId },
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
      },
    });
    if (!clinicalProfile) {
      throw new NotFoundException('Perfil clínico não encontrado para este usuário.');
    }

    // Retorna o perfil, adaptado para ProfileResponse.
    return {
      ok: true,
      profile: {
        firstName: clinicalProfile.firstName,
        lastName: clinicalProfile.lastName,
        // 'name' não é um campo direto de ClinicalProfile, e não é esperado em ProfileResponse após correção.
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
