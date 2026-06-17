import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IdType } from '@prisma/client';

export class RegisterDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(120)
  lastName!: string;

  @IsEnum(IdType)
  idType!: IdType;

  @IsString()
  @MaxLength(50)
  idNumber!: string;

  @IsString()
  @MaxLength(150)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  addressLine2?: string;

  @IsString()
  @MaxLength(100)
  country!: string;

  @IsString()
  @MaxLength(100)
  cityCounty!: string;

  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @Matches(/^[+0-9()\-\s]+$/)
  @MaxLength(25)
  phoneNumber!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}