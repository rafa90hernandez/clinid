import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) { }

  getMine(userId: string) {
    return this.prisma.clinicalProfile.findUnique({ where: { userId } });
  }

  async upsertMine(userId: string, dto: UpsertProfileDto) {
    if (!dto.consent) {
      throw new ForbiddenException('É necessário consentimento LGPD');
    }

    const now = new Date();

    // UPDATE: só muda consentAt quando houver novo consentimento explícito
    const updateData: Prisma.ClinicalProfileUncheckedUpdateInput = {
      sex: dto.sex ?? null,
      emergencyContactName: dto.emergency_contact_name ?? null,
      emergencyContactPhone: dto.emergency_contact_phone ?? null,
      bloodType: dto.blood_type ?? null,
      allergies: dto.allergies ?? [],
      medications: dto.medications ?? [],
      diseases: dto.diseases ?? [],
      surgeries: dto.surgeries ?? [],
      updatedAt: now,
      ...(dto.consent ? { consentAt: now } : {}), // opcional no update
    };

    // CREATE: consentAt é obrigatório (schema exige string | Date)
    const createData: Prisma.ClinicalProfileUncheckedCreateInput = {
      id: crypto.randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
      consentAt: now, // <-- sempre presente no create
      sex: dto.sex ?? null,
      emergencyContactName: dto.emergency_contact_name ?? null,
      emergencyContactPhone: dto.emergency_contact_phone ?? null,
      bloodType: dto.blood_type ?? null,
      allergies: dto.allergies ?? [],
      medications: dto.medications ?? [],
      diseases: dto.diseases ?? [],
      surgeries: dto.surgeries ?? [],
    };

    const profile = await this.prisma.clinicalProfile.upsert({
      where: { userId },
      update: updateData,
      create: createData,
    });

    // snapshot do perfil no histórico
    await this.prisma.clinicalHistory.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        snapshot: {
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
        changedAt: now,
        changedBy: userId,
      },
    });

    return profile;
  }
}
