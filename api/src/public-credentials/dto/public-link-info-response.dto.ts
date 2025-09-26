// api/src/public-credentials/dto/public-link-info-response.dto.ts

import { PublicLinkStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger'; // Adicione se estiver usando Swagger

export class PublicLinkInfoResponseDto {
  @ApiProperty({ description: 'O segmento único do link público.' })
  slug: string;

  @ApiProperty({
    enum: PublicLinkStatus,
    description: 'O status atual do link público (ativo ou revogado).',
  })
  status: PublicLinkStatus;

  @ApiProperty({
    description: 'Um booleano indicando se o link público está ativo.',
  })
  isActive: boolean;

  @ApiProperty({
    description: 'URL para o QR Code que representa o link público. Pode ser gerada dinamicamente.',
    required: false,
  })
  qrCodeUrl?: string;
}