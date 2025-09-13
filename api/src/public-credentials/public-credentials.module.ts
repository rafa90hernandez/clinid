import { Module } from '@nestjs/common';
import { PublicCredentialsController } from './public-credentials.controller';
import { PublicCredentialsService } from './public-credentials.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PublicCredentialsController],
  providers: [PublicCredentialsService, PrismaService],
})
export class PublicCredentialsModule {}
