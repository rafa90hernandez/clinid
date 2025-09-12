import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import type { Request } from 'express';

type JwtUser = { sub: string; email: string };

@UseGuards(JwtAuthGuard)
@Controller('me/profile')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  getMine(@Req() req: Request & { user: JwtUser }) {
    return this.profiles.getMine(req.user.sub);
  }

  @Put()
  upsertMine(@Req() req: Request & { user: JwtUser }, @Body() dto: UpsertProfileDto) {
    return this.profiles.upsertMine(req.user.sub, dto);
  }
}
