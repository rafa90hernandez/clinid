import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccountsService, LocalUser } from './accounts.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Controller('auth')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.accounts.register(dto.email, dto.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() _dto: LoginDto,
    @Req() req: Request & { user: LocalUser },
  ) {
    return this.accounts.issueAccessToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: Request & { user: LocalUser }) {
    return { sub: req.user.sub, email: req.user.email };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.accounts.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.accounts.resetPassword(dto.id, dto.token, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/account')
  async deleteMyAccount(
    @Body() dto: DeleteAccountDto,
    @Req() req: Request & { user: LocalUser },
  ) {
    return this.accounts.deleteAccount(req.user.sub, dto.confirmLoginPassword);
  }
}
/*************  ✨ Windsurf Command ⭐  *************/
/*******  c670bac2-a928-4822-b8c1-10166bf46696  *******/  /**

   * Exclui conta do usuário autenticado com confirmação de senha:

   * - revoga todos os links públicos ativos

   * - remove PIN público

   * - invalida tokens de reset pendentes

   * - marca user como isDeleted (soft delete)

   */
