import { Injectable } from '@nestjs/common';

export interface MailEnvConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  fromDefault: string;
}

@Injectable()
export class MailConfigService {
  private readonly cfg: MailEnvConfig;

  constructor() {
    const host = process.env.SMTP_HOST ?? 'localhost';
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = String(process.env.SMTP_SECURE ?? 'false') === 'true';

    const user = process.env.SMTP_USER || undefined;
    const pass = process.env.SMTP_PASS || undefined;
    const fromDefault = process.env.SMTP_FROM || 'ClinID <no-reply@localhost>';

    // Pequena validação “fail fast” (sem lançar exceção bloqueante em dev)
    if (!host || Number.isNaN(port)) {
      console.warn('[MailConfig] Config de SMTP incompleta. Usando defaults.');
    }

    this.cfg = { host, port, secure, user, pass, fromDefault };
  }

  get(): MailEnvConfig {
    return this.cfg;
  }
}
