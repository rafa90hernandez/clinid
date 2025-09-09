import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from '../accounts.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private accounts: AccountsService) { super({ usernameField: 'email' }); }
  async validate(email: string, password: string) {
    const user = await this.accounts.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    return user;
  }
}
