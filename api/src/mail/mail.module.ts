import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailConfigService } from './mail.config';
import { MailController } from './mail.controller';

@Module({
  controllers: [MailController],
  providers: [MailConfigService, MailService],
  exports: [MailService],
})
export class MailModule {}
