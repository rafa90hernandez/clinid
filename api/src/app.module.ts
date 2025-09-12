import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PublicCredentialsModule } from './public-credentials/public-credentials.module';
import { PublicLinksModule } from './public-links/public-links.module';
import { PublicViewModule } from './public-view/public-view.module';

@Module({
  imports: [
    // Banco/ORM
    PrismaModule,

    // Módulos de features
    AccountsModule,
    ProfilesModule,
    PublicCredentialsModule,
    PublicLinksModule,
    PublicViewModule,

    // Rate limit (v5+) — perfis nomeados e um default
    ThrottlerModule.forRoot([
      { name: 'auth', ttl: 60_000, limit: 20 }, // endpoints de auth
      { name: 'public', ttl: 60_000, limit: 10 }, // /public/view etc.
      { ttl: 60_000, limit: 60 }, // default (sem nome)
    ]),
  ],
  providers: [
    // Aplica o Throttler globalmente
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
