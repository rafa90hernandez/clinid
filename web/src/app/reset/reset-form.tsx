'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

export default function ResetForm() {
  const t = useTranslations('resetPassword');
  const register = useTranslations('register');

  const search = useSearchParams();
  const id = search.get('id') ?? '';
  const token = search.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rules = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const digit = /\d/.test(password);
    const match = confirm.length > 0 && confirm === password;

    return { len, upper, lower, digit, match, all: len && upper && lower && digit && match };
  }, [password, confirm]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !token) {
      setErrorMsg(t('invalidLink'));
      return;
    }

    if (!rules.all || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await apiPost<unknown>('/accounts/reset', { id, token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('error');
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

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
              Create a strong new password to keep your ClinID account protected.
            </p>

            <div className="mt-8 rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-slate-800">Password requirements</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>• {register('rules.minLength')}</li>
                <li>• {register('rules.uppercase')}</li>
                <li>• {register('rules.lowercase')}</li>
                <li>• {register('rules.number')}</li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-blue-950/10 backdrop-blur md:p-8">
            <div className="mb-8 text-center lg:hidden">
              <Logo />
            </div>

            <div className="mb-7 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">{t('title')}</h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter and confirm your new password.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              {(!id || !token) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {t('invalidLink')}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t('newPassword')}
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  autoComplete="new-password"
                  required
                />

                <ul className="mt-3 space-y-1.5 text-xs">
                  <li className={rules.len ? 'text-emerald-600' : 'text-slate-500'}>
                    • {register('rules.minLength')}
                  </li>
                  <li className={rules.upper ? 'text-emerald-600' : 'text-slate-500'}>
                    • {register('rules.uppercase')}
                  </li>
                  <li className={rules.lower ? 'text-emerald-600' : 'text-slate-500'}>
                    • {register('rules.lowercase')}
                  </li>
                  <li className={rules.digit ? 'text-emerald-600' : 'text-slate-500'}>
                    • {register('rules.number')}
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700">
                  {t('confirmPassword')}
                </label>

                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  autoComplete="new-password"
                  required
                />

                <p className={`mt-3 text-xs ${rules.match ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {rules.match ? t('passwordsMatch') : t('passwordsDoNotMatch')}
                </p>
              </div>

              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}

              {success ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {t('success')}
                  </div>

                  <Link
                    href="/login"
                    className="block w-full rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {t('goToLogin')}
                  </Link>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!id || !token || !rules.all || submitting}
                  className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                >
                  {submitting ? t('saving') : t('save')}
                </button>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}