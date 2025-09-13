import { IsString, Length, Matches } from 'class-validator';

export class SetPinDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/)
  pin!: string;

  // senha de login para confirmar operação
  @IsString()
  confirmLoginPassword!: string;
}
