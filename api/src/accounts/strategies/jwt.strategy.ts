import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { AccountsService, type LocalUser } from '../accounts.service';

type JwtPayload = { sub: string; email: string };

/** Extrai token do header Cookie (sem depender de req.cookies) */
function tokenFromCookieHeader(req: Request): string | null {
  const cookieHeader = req.headers?.cookie;
  if (typeof cookieHeader !== 'string' || cookieHeader.length === 0) return null;

  const parts = cookieHeader.split(';');
  for (const p of parts) {
    const [rawK, ...rest] = p.split('=');
    const k = rawK?.trim();
    if (k === 'auth_token') {
      const v = rest.join('=');
      try {
        const decoded = decodeURIComponent(v);
        return decoded || null;
      } catch {
        return v || null;
      }
    }
  }
  return null;
}

/** Extrai token do Authorization: Bearer ... */
function tokenFromBearer(req: Request): string | null {
  const auth = req.headers?.authorization;
  if (typeof auth !== 'string') return null;
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

/** Extractor final: Cookie → Bearer */
function jwtExtractor(req: Request): string | null {
  return tokenFromCookieHeader(req) ?? tokenFromBearer(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly accounts: AccountsService) {
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me',
    });
  }

  // ✅ Retorna LocalUser para casar com AccountsService.me
  async validate(payload: JwtPayload): Promise<LocalUser> {
    // garante que o usuário existe (auditoria/segurança)
    const exists = await this.accounts.findPublicById(payload.sub);
    if (!exists) throw new UnauthorizedException('User not found');

    // o objeto abaixo vira req.user
    return { sub: payload.sub, email: payload.email };
  }
}
