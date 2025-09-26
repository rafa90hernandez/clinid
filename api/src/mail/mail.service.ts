import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter, type SendMailOptions } from 'nodemailer';

type MailEnv = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

function getMailEnv(): MailEnv {
  const host = process.env.MAIL_HOST ?? '';
  const port = Number(process.env.MAIL_PORT ?? '587');
  const user = process.env.MAIL_USER ?? '';
  const pass = process.env.MAIL_PASS ?? '';
  const from = process.env.MAIL_FROM ?? user;

  if (!host || !user || !pass) {
    throw new Error('MAIL_HOST/MAIL_USER/MAIL_PASS não configurados');
  }
  return { host, port, user, pass, from };
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  private ensureTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const env = getMailEnv();
    this.transporter = nodemailer.createTransport({
      host: env.host,
      port: env.port,
      secure: env.port === 465,
      auth: { user: env.user, pass: env.pass },
    });

    return this.transporter;
  }

  async send(opts: SendMailOptions): Promise<{ messageId: string }> {
    const transport = this.ensureTransporter();
    const env = getMailEnv();

    const finalOpts: SendMailOptions = {
      from: env.from,
      ...opts,
    };

    const info = await transport.sendMail(finalOpts); // Promise<SentMessageInfo>
    const messageId = typeof (info as { messageId?: unknown }).messageId === 'string'
      ? (info as { messageId: string }).messageId
      : '';
    this.logger.log(`Email enviado: ${messageId}`);
    return { messageId };
  }

  async sendResetPassword(to: string, resetUrl: string) {
    return this.send({
      to,
      subject: 'Redefinição de senha - ClinID',
      html: `
        <p>Você solicitou redefinição de senha.</p>
        <p>Clique no link abaixo (válido por 15 minutos):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
      `,
    });
  }
}
