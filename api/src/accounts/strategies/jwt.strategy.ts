import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AccountsService } from '../accounts.service';

type JwtPayload = { sub: string; email: string };

function cookieExtractor(req: Request): string | null {
  // lê o cookie 'auth_token' se existir
  return (req?.cookies && typeof req.cookies.auth_token === 'string')
    ? req.cookies.auth_token
    : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly accounts: AccountsService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor, // 1º tenta cookie
        ExtractJwt.fromAuthHeaderAsBearerToken(), // 2º tenta "Authorization: Bearer ..."
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me',
    });
  }

  async validate(payload: JwtPayload) {
    // Confirma que o usuário ainda existe
    const user = await this.accounts.findPublicById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    // objeto colocado em req.user
    return { sub: user.id, email: user.email };
  }
}
