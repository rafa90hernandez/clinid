import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { PublicLinksService } from './public-links.service';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { Request } from 'express';

type JwtUser = { sub: string; email: string };

@UseGuards(JwtAuthGuard)
@Controller('me/public-link')
export class PublicLinksController {
  constructor(private readonly svc: PublicLinksService) {}

  @Post()
  async generate(@Req() req: Request & { user: JwtUser }) {
    return this.svc.generate(req.user.sub);
  }

  @Get()
  async getActive(@Req() req: Request & { user: JwtUser }) {
    return this.svc.getActiveByUser(req.user.sub);
  }

  @Patch(':id/revoke')
  async revoke(@Param('id') id: string, @Req() req: Request & { user: JwtUser }) {
    return this.svc.revoke(req.user.sub, id);
  }
}
