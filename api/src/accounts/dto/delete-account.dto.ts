import { IsString, MinLength } from 'class-validator';
export class DeleteAccountDto {
  @IsString()
  @MinLength(6)
  confirmLoginPassword!: string;
}
