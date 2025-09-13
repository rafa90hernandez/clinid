import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import { PublicCredentialsService } from './public-credentials.service';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { SetPinDto } from './dto/set-pin.dto';
import type { Request } from 'express';

type JwtUser = { sub: string; email: string };

@UseGuards(JwtAuthGuard)
@Controller('me/pin')
export class PublicCredentialsController {
  constructor(private readonly svc: PublicCredentialsService) {}

  @Put()
  setPin(@Req() req: Request & { user: JwtUser }, @Body() dto: SetPinDto) {
    return this.svc.setPin(req.user.sub, dto);
  }
}
