import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Segurança
  app.use(helmet());

  app.use(cookieParser());

  // CORS
  const origin = process.env.WEB_BASE_URL || 'http://localhost:3000';
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validação
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('ClinID API')
    .setDescription('API de autenticação, perfis clínicos e acesso público com PIN.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Ouvir em 0.0.0.0 para acesso via NGINX/containers
  const port = Number(process.env.PORT || 3001);
  const host = '0.0.0.0';
  await app.listen(port, host);

  const url = await app.getUrl();
  Logger.log(`API listening on ${url}`, 'Bootstrap');
  Logger.log(`Swagger: ${url}/docs`, 'Bootstrap');
}

bootstrap().catch((err: unknown) => {
  let details: string;
  if (err instanceof Error) {
    details = err.stack ?? err.message;
  } else {
    try {
      details = JSON.stringify(err);
    } catch {
      details = String(err);
    }
  }
  Logger.error('Fatal bootstrap error', details, 'Bootstrap');
  process.exit(1);
});
