// api/src/prisma/prisma.service.ts
import { Injectable, INestApplication, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  // Sem usar $on('beforeExit'). Se quiser fechar o app nos sinais do SO:
  enableShutdownHooks(app: INestApplication): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    for (const sig of signals) {
      process.on(sig, () => {
        void app.close(); // evita no-misused-promises
      });
    }
  }
}
