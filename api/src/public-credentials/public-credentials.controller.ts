import { Body, Controller, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { SetPinDto } from './dto/set-pin.dto';
import { PublicCredentialsService } from './public-credentials.service';

type JwtUser = { sub: string; email: string };

@UseGuards(JwtAuthGuard)
@Controller('me/pin')
export class PublicCredentialsController {
  constructor(private readonly service: PublicCredentialsService) {}

  @Put()
  async setPin(
    @Req() req: Request & { user: JwtUser },
    @Body() dto: SetPinDto,
  ) {
    return this.service.setPin(req.user.sub, dto);
  }
}
