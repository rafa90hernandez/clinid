import { Strategy as LocalBase } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsService, type LocalUser } from '../accounts.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(LocalBase) {
  constructor(private readonly accounts: AccountsService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string): Promise<LocalUser> {
    try {
      return await this.accounts.validateUser(email, password);
    } catch {
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }
}
