import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AccountsService, LocalUser } from '../accounts.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly accounts: AccountsService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: false,
    });
  }

  async validate(email: string, password: string): Promise<LocalUser> {
    try {
      return await this.accounts.validateUser(email, password);
    } catch {
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }
}
