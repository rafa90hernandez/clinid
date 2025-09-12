import { Module } from '@nestjs/common';
import { PublicViewController } from './public-view.controller';
import { PublicViewService } from './public-view.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublicViewController],
  providers: [PublicViewService],
})
export class PublicViewModule {}
