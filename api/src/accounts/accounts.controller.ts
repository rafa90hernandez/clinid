// api/src/accounts/accounts.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

/** Payload mínimo que o LocalAuthGuard coloca em req.user */
type LocalUser = { sub: string; email: string };

@Controller('auth')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  /** Ping simples para ver se o módulo está no ar */
  @Get('health')
  health() {
    return { status: 'ok', now: new Date().toISOString() };
  }

  /** Cria usuário (somente email/senha) */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // service retorna { id, email, createdAt }
    return this.accounts.register(dto.email, dto.password);
  }

  /**
   * Login com LocalAuthGuard:
   * - retorna JSON { access_token }
   * - seta cookie httpOnly 'auth_token' (para navegação web)
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() _dto: LoginDto,
    @Req() req: Request & { user: LocalUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = await this.accounts.issueAccessToken(req.user);

    // Define o cookie httpOnly para o navegador
    res.cookie('auth_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      // Em HTTPS/produção, ative secure
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/',
      // Se precisar, ajuste domain com base no seu host (ex. '.seu-dominio.com')
      // domain: new URL(process.env.WEB_BASE_URL ?? 'http://localhost').hostname,
    });

    // Também devolvemos no corpo (útil para apps móveis, etc.)
    return { access_token: accessToken };
  }

  /** Retorna os dados do usuário autenticado (sub/email) */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user: LocalUser }) {
    return { sub: req.user.sub, email: req.user.email };
  }

  /** Envia e-mail de recuperação (se habilitado no serviço) */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.accounts.forgotPassword(dto.email);
  }

  /** Troca de senha via token de reset */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.accounts.resetPassword(dto.id, dto.token, dto.newPassword);
  }

  /**
   * Exclui conta autenticada (soft-delete) mediante confirmação de senha
   */
  @UseGuards(JwtAuthGuard)
  @Delete('me/account')
  async deleteMyAccount(
    @Body() dto: DeleteAccountDto,
    @Req() req: Request & { user: LocalUser },
  ) {
    return this.accounts.deleteAccount(req.user.sub, dto.confirmLoginPassword);
  }
}
