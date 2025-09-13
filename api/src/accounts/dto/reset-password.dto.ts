import { IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString() id!: string; // id do token (UUID)
  @IsString() token!: string; // token em texto claro (enviado por “e-mail”)
  @IsString()
  @Length(8, 64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Senha deve ter ao menos uma letra e um número',
  })
  newPassword!: string;
}
