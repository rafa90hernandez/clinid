// api/src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const transporter = this.createTransporter();

    if (!transporter) {
      this.logger.warn(`SMTP not configured. Reset URL: ${resetUrl}`);
      return;
    }

    const from = process.env.MAIL_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to,
      subject: 'ClinID Password Reset',
      text: `We received a request to reset your ClinID password.

Open this link to reset your password:
${resetUrl}

This link expires in 15 minutes.

If you did not request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <h1 style="color: #2563eb; margin-bottom: 8px;">ClinID</h1>
          <h2 style="margin-top: 0;">Password Reset Request</h2>
          <p>We received a request to reset your ClinID password.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 10px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p>This link expires in <strong>15 minutes</strong>.</p>
          <p style="color: #64748b; font-size: 14px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }
}
