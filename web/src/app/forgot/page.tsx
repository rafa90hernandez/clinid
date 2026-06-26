'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/logo';
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
  const data = isWrapped<ForgotResponseLoose>(x) ? x.data : x;

  if (typeof data === 'object' && data !== null && 'resetUrl' in data) {
    const val = (data as { resetUrl?: unknown }).resetUrl;
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

      const resetUrl = pickResetUrl(res);

      setMsg(resetUrl ? `${t('sent')} (DEV: ${resetUrl})` : t('sent'));
    } catch {
      setErr(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#eef6ff] via-white to-[#e7f1ff] text-slate-900">
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl" />

      <section className="relative mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_440px]">
          <div className="hidden lg:block">
            <Logo />

            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-slate-950">
              {t('title')}
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              {t('subtitle')}
            </p>

            <div className="mt-8 rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-slate-800">
                Secure account recovery
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter your registered email and we’ll send instructions to create a new password.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-blue-950/10 backdrop-blur md:p-8">
            <div className="mb-8 text-center lg:hidden">
              <Logo />
            </div>

            <div className="mb-7 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                {t('title')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t('subtitle')}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t('email')}
                </label>

                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {msg && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {msg}
                </div>
              )}

              {err && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {loading ? t('sending') : t('send')}
              </button>

              <p className="pt-2 text-center text-sm text-slate-600">
                <Link
                  href="/login"
                  className="font-semibold text-slate-900 underline-offset-4 hover:underline"
                >
                  {t('backToLogin')}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}