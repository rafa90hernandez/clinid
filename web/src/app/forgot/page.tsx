'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

type ForgotResponseLoose =
  | { ok: boolean; resetUrl?: string }
  | { ok: boolean }
  | Record<string, unknown>;

function isWrapped<T>(x: unknown): x is {
  ok: boolean;
  status: number;
  data: T | null;
  response: Response;
} {
  return (
    typeof x === 'object' &&
    x !== null &&
    'ok' in x &&
    'status' in x &&
    'data' in x &&
    'response' in x
  );
}

function pickResetUrl(x: unknown): string | null {
  if (typeof x === 'object' && x !== null && 'resetUrl' in x) {
    const val = (x as { resetUrl?: unknown }).resetUrl;
    if (typeof val === 'string' && val.length > 0) return val;
  }

  return null;
}

export default function ForgotPage() {
  const t = useTranslations('forgotPassword');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      const res = await apiPost<ForgotResponseLoose>('/accounts/forgot', {
        email: email.trim(),
      });

      const data = isWrapped<ForgotResponseLoose>(res) ? res : res;
      const resetUrl = pickResetUrl(data);

      setMsg(resetUrl ? `${t('sent')} (DEV: ${resetUrl})` : t('sent'));
    } catch {
      setErr(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#E8ECFF] text-slate-900">
      <div className="mx-auto max-w-sm px-6 py-10">
        <h1 className="mb-2 text-center text-xl font-semibold">{t('title')}</h1>

        <p className="mb-6 text-center text-sm text-slate-600">{t('subtitle')}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">{t('email')}</label>

            <input
              type="email"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {msg && <p className="text-sm text-green-700">{msg}</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? t('sending') : t('send')}
          </button>

          <p className="pt-2 text-center text-xs text-slate-600">
            <Link href="/login" className="underline">
              {t('backToLogin')}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}