import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

function getJwtSecret(): string {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error('JWT_SECRET is required');
  }

  return value;
}

const jwtSecret = getJwtSecret();

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, LocalStrategy, JwtStrategy],
  exports: [AccountsService],
})
export class AccountsModule {}
