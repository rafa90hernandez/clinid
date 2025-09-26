import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PublicCredentialsModule } from './public-credentials/public-credentials.module';
import { PublicLinksModule } from './public-links/public-links.module';
import { PublicViewModule } from './public-view/public-view.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    PrismaModule,
    AccountsModule,
    ProfilesModule,
    PublicCredentialsModule,
    PublicLinksModule,
    PublicViewModule,
    HistoryModule,
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 1000 }, // De 60 para 1000 requisições/min
      { name: 'public', ttl: 60_000, limit: 100 }, // De 10 para 100 requisições/min
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
