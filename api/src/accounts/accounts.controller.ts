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
  // CORRIGIDO: NODE_ENV deve ser comparado com 'production' para verificar se é ambiente de produção.
  const isProd = process.env.NODE_ENV === 'production';

  // Se front e API estiverem em origens diferentes em produção, use SameSite=None + Secure
  const crossSite = process.env.CROSS_SITE_COOKIES === 'true';

  // NOVO: Lê o domínio do cookie da variável de ambiente COOKIE_DOMAIN
  // Isso permite que o cookie seja compartilhado entre subdomínios (ex: .onrender.com)
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

  return {
    httpOnly: true,
    path: '/',
    maxAge: 1000 * 60 * 60 * 8, // 8h
    sameSite: crossSite ? ('none' as const) : ('lax' as const),
    secure: crossSite ? true : isProd, // SameSite=None exige secure:true
    domain: cookieDomain, // <<<< Esta linha CRÍTICA adiciona o atributo Domain ao cookie
  };
}

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

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

    // Retorna o objeto 'token' completo, que contém 'access_token'.
    // O frontend pode usar este valor para localStorage ou outras necessidades específicas de cliente.
    return token;
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
    // O atributo 'domain' também deve ser incluído na clearCookie para garantir que o cookie correto seja apagado.
    res.clearCookie('auth_token', {
      path: opts.path,
      sameSite: opts.sameSite,
      secure: opts.secure,
      domain: opts.domain, // <<<< Importante adicionar aqui também
    });
    return { ok: true };
  }
}
