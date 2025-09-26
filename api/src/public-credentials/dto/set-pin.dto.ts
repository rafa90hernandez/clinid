// api/src/public-credentials/dto/set-pin.dto.ts
import { IsBoolean, IsString, Matches, MinLength } from 'class-validator';

export class SetPinDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN deve ter exatamente 6 dígitos numéricos' })
  pin!: string;

  // senha de login para confirmar operação
  @IsString()
  @MinLength(6, { message: 'Senha de login deve ter ao menos 6 caracteres' })
  confirmLoginPassword!: string;

  @IsBoolean()
  consent!: boolean;
}
