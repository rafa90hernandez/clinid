import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, LocalStrategy, JwtStrategy],
})
export class AccountsModule {}
