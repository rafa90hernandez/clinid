import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const origin = process.env.WEB_BASE_URL || 'http://localhost:3000';
  app.enableCors({
    origin,
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // --- Swagger ---
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
  // ---------------

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`API listening on ${await app.getUrl()}`);
  console.log(`Swagger: ${await app.getUrl()}/docs`);
}
bootstrap();
