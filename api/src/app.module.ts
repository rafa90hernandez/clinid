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
      { name: 'default', ttl: 60_000, limit: 60 },
      { name: 'public', ttl: 60_000, limit: 10 },
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
