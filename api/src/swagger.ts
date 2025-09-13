import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  // habilite em dev por padrão; em prod só se SWAGGER_ENABLED=true
  const enable =
    process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true';

  if (!enable) return;

  const config = new DocumentBuilder()
    .setTitle('ClinID API')
    .setDescription('Documentação da API ClinID')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc, {
    jsonDocumentUrl: 'docs/json',
  });
}
