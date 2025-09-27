// api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet'; // default import
import cookieParser from 'cookie-parser'; // default import
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  // Usaremos enableCors abaixo com opções explícitas
  const app = await NestFactory.create(AppModule, { cors: false });

  // Middlewares antes das rotas
  app.use(cookieParser());
  app.use(helmet());

  // CORS (cookies httpOnly exigem credentials: true e origin explícito)
  const origin = process.env.WEB_BASE_URL || 'http://localhost:3000';
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
  });

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

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

  // Habilita shutdown do Nest (SIGINT/SIGTERM) e integra com PrismaService
  app.enableShutdownHooks();
  const prisma = app.get(PrismaService);
  prisma.enableShutdownHooks(app); // implementado no PrismaService usando process.on(...)

  // Escutar em 0.0.0.0 (containers/nginx)
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
