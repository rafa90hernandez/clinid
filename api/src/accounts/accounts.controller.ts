import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AccountsService, type LocalUser } from './accounts.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/** Helper: opções de cookie de acordo com o ambiente */
function cookieOptsForEnv() {
  const isProd = process.env.NODE_ENV === 'production';
  // Se front e API estiverem em origens diferentes em produção, use SameSite=None + Secure
  const crossSite = process.env.CROSS_SITE_COOKIES === 'true';

  console.log('Backend Env: NODE_ENV =', process.env.NODE_ENV);
  console.log('Backend Env: CROSS_SITE_COOKIES =', process.env.CROSS_SITE_COOKIES);
  console.log('Computed crossSite variable =', crossSite);
  console.log('Computed sameSite option =', crossSite ? 'none' : 'lax');
  console.log('Computed secure option =', crossSite ? true : isProd);
  
  return {
    httpOnly: true,
    path: '/',
    maxAge: 1000 * 60 * 60 * 8, // 8h
    sameSite: crossSite ? ('none' as const) : ('lax' as const),
    secure: crossSite ? true : isProd, // SameSite=None exige secure:true
  };
}

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) { }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { email, password } = dto;
    return this.accounts.register(email, password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Req() req: Request & { user: LocalUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.accounts.issueAccessToken(req.user);
    const opts = cookieOptsForEnv();

    // Podemos manter a linha abaixo para compatibilidade ou se a API for usada por clientes
    // que não sejam navegador, mas o frontend NÃO DEVERÁ MAIS depender dela para a autenticação principal.
    res.cookie('auth_token', token.access_token, opts);

    // ALTERAÇÃO CRUCIAL AQUI: Retorna o objeto 'token' completo, que contém 'access_token'
    // O frontend agora deve ler este valor do corpo da resposta.
    return token; // Isso fará com que a resposta JSON seja { "access_token": "..." }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: LocalUser }) {
    return this.accounts.me(req.user);
  }

  @Post('forgot')
  async forgot(@Body() dto: ForgotPasswordDto) {
    return this.accounts.forgotPassword(dto.email);
  }

  @Post('reset')
  async reset(@Body() dto: ResetPasswordDto) {
    return this.accounts.resetPassword(dto.id, dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async deleteAccount(
    @Req() req: Request & { user: LocalUser },
    @Body('confirmLoginPassword') confirmLoginPassword: string,
  ) {
    return this.accounts.deleteAccount(req.user.sub, confirmLoginPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    const opts = cookieOptsForEnv();
    // usar as mesmas flags ajuda alguns browsers a remover o cookie
    res.clearCookie('auth_token', {
      path: opts.path,
      sameSite: opts.sameSite,
      secure: opts.secure,
    });
    return { ok: true };
  }
}