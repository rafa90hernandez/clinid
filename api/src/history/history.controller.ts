import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../accounts/guards/jwt-auth.guard';
import { HistoryService } from './history.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class HistoryController {
  constructor(private readonly svc: HistoryService) {}

  @Get('/me/history')
  list(
    @Req() req: Request & { user: { sub: string } },
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Math.max(1, Math.min(50, Number(limit))) : 10;
    return this.svc.list(req.user.sub, take);
  }

  @Get('/me/history/latest')
  latest(@Req() req: Request & { user: { sub: string } }) {
    return this.svc.latest(req.user.sub);
  }
}
