import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  getMine(userId: string) {
    return this.prisma.clinicalProfile.findUnique({ where: { userId } });
  }

  async upsertMine(userId: string, dto: UpsertProfileDto) {
    if (!dto.consent) {
      throw new ForbiddenException('É necessário consentimento LGPD');
    }

    const common = {
      userId,
      firstName: dto.first_name,
      lastName: dto.last_name,
      sex: dto.sex,
      emergencyContactName: dto.emergency_contact_name,
      emergencyContactPhone: dto.emergency_contact_phone,
      bloodType: dto.blood_type,
      allergies: dto.allergies ?? [],
      medications: dto.medications ?? [],
      diseases: dto.diseases ?? [],
      surgeries: dto.surgeries ?? [],
      consentAt: new Date(),
    };

    const profile = await this.prisma.clinicalProfile.upsert({
      where: { userId },
      update: common,
      create: { id: crypto.randomUUID(), createdAt: new Date(), ...common },
    });

    // snapshot do perfil no histórico
    await this.prisma.clinicalHistory.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        snapshot: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          sex: profile.sex,
          bloodType: profile.bloodType,
          allergies: profile.allergies,
          medications: profile.medications,
          diseases: profile.diseases,
          surgeries: profile.surgeries,
          emergencyContactName: profile.emergencyContactName,
          emergencyContactPhone: profile.emergencyContactPhone,
          updatedAt: profile.updatedAt,
        },
        changedAt: new Date(),
        changedBy: userId,
      },
    });

    return profile;
  }
}
