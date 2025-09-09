import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

type LocalUser = { id: string; email: string }; // vem do LocalStrategy (login)
type JwtUser = { sub: string; email: string }; // vem do JwtStrategy (/me)

@Controller('auth')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.accounts.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(
    @Body() _dto: LoginDto,
    @Req() req: Request & { user: LocalUser },
  ) {
    return this.accounts.issueAccessToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: JwtUser }) {
    return req.user;
  }
}
