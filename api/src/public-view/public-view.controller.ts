import { Body, Controller, Post } from '@nestjs/common';
import { PublicViewService, PublicAccessResponse } from './public-view.service';
import { PublicViewDto } from './dto/public-view.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('public/view')
export class PublicViewController {
  constructor(private readonly svc: PublicViewService) {}

  // Protege contra brute-force: 10 req/min por IP no "perfil" público
  @Throttle({ public: { limit: 10, ttl: 60_000 } })
  @Post() // Esta rota recebe o slug e o pin no corpo da requisição
  async view(@Body() dto: PublicViewDto): Promise<PublicAccessResponse> {
    // Chama o método 'view' do serviço, passando o slug e o pin do DTO
    const result = await this.svc.view(dto.slug, dto.pin);
    return result;
  }
}
