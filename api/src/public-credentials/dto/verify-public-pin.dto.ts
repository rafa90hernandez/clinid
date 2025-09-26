import { IsString, Matches } from 'class-validator';

export class VerifyPublicPinDto {
  @IsString({ message: 'PIN deve ser uma string.' })
  @Matches(/^\d{6}$/, { message: 'PIN deve ter exatamente 6 dígitos numéricos.' })
  pin!: string;
}
