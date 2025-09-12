import { Module } from '@nestjs/common';
import { PublicLinksController } from './public-links.controller';
import { PublicLinksService } from './public-links.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PublicLinksController],
  providers: [PublicLinksService, PrismaService],
})
export class PublicLinksModule {}
