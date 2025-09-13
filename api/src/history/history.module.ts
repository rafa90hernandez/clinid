import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
