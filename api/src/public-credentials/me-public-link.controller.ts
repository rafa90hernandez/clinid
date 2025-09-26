// C:\Users\rafae\clinid\api\src\public-credentials\me-public-link.controller.ts

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { PublicCredentialsService } from './public-credentials.service';
import { PublicLinkInfoResponseDto } from './dto/public-link-info-response.dto'; // Importe o DTO

type JwtUser = { sub: string; email: string };

@UseGuards(JwtAuthGuard)
@Controller('me/public-link') // Define a rota base para este controlador
export class MePublicLinkController {
  constructor(private readonly service: PublicCredentialsService) {}

  @Get() // GET /me/public-link
  async getPublicLink(
    @Req() req: Request & { user: JwtUser },
  ): Promise<PublicLinkInfoResponseDto | null> {
    return this.service.getPublicLinkInfo(req.user.sub);
  }
}