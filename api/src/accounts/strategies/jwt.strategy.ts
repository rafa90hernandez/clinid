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

/**
 * JWT extractor.
 * Prioriza o cookie HttpOnly (fluxo principal da aplicação).
 * Mantém suporte ao Bearer Token para compatibilidade com clientes externos
 * e testes da API.
 */
function jwtExtractor(req: Request): string | null {
  return tokenFromCookieHeader(req) ?? tokenFromBearer(req);
}

function getJwtSecret(): string {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error('JWT_SECRET is required');
  }

  return value;
}

const jwtSecret = getJwtSecret();
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly accounts: AccountsService) {
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<LocalUser> {
    const exists = await this.accounts.findPublicById(payload.sub);
    if (!exists) throw new UnauthorizedException('User not found');

    return { sub: payload.sub, email: payload.email };
  }
}
