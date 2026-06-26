// api/src/mail/mail.controller.ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mail: MailService) {}

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async sendReset(@Body() body: { to: string; link: string }) {
    const { to, link } = body;
    await this.mail.sendPasswordResetEmail(to, link);
    return { ok: true };
  }
}
