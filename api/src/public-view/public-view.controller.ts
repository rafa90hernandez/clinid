import { Body, Controller, Post } from '@nestjs/common';
import { PublicViewService, PublicViewResponse } from './public-view.service';
import { IsString, Length, Matches } from 'class-validator';
import { Throttle } from '@nestjs/throttler';

class PublicViewDto {
  @IsString()
  slug!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/)
  pin!: string;
}

@Controller('public/view')
export class PublicViewController {
  constructor(private readonly svc: PublicViewService) {}

  // Protege contra brute-force: 10 req/min por IP no "perfil" público
  @Throttle({ public: { limit: 10, ttl: 60_000 } })
  @Post()
  async view(@Body() dto: PublicViewDto): Promise<PublicViewResponse> {
    const result = await this.svc.view(dto.slug, dto.pin);
    return result;
  }
}
