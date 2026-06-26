// api/src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MailConfigService } from './mail.config';
import { MailService } from './mail.service';

@Module({
  controllers: [MailController],
  providers: [MailService, MailConfigService],
  exports: [MailService],
})
export class MailModule {}
