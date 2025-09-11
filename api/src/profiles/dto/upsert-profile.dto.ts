// api/src/profiles/dto/upsert-profile.dto.ts
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertProfileDto {
  @IsString() @MaxLength(80) first_name!: string;
  @IsString() @MaxLength(120) last_name!: string;
  @IsIn(['M', 'F', 'O']) sex!: 'M' | 'F' | 'O';

  @IsString() @MaxLength(120) emergency_contact_name!: string;
  @IsString() @MaxLength(32) emergency_contact_phone!: string;

  @IsIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
  blood_type!: string;

  @IsArray() @IsOptional() allergies?: string[];
  @IsArray() @IsOptional() medications?: string[];
  @IsArray() @IsOptional() diseases?: string[];
  @IsArray() @IsOptional() surgeries?: string[];

  @IsBoolean() consent!: boolean;
}
