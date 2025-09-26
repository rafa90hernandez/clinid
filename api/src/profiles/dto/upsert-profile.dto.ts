// api/src/profiles/dto/upsert-profile.dto.ts
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpsertProfileDto {
  // Identidade (opcional; quando vier, deve ser string com limites)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  last_name?: string;

  // Clínicos
  @IsOptional()
  @IsIn(['M', 'F', 'O'])
  sex?: 'M' | 'F' | 'O';

  @IsOptional()
  @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  blood_type?: string;

  // Contato de emergência
  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergency_contact_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  emergency_contact_phone?: string;

  // Listas (opcionais; se vierem, valem como array de string)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diseases?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  surgeries?: string[];

  // Consentimento (opcional; valida quando enviado)
  @IsOptional()
  @IsBoolean()
  consent?: boolean;
}
