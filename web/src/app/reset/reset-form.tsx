'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
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
    <div className="relative min-h-dvh bg-[#eaf2ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <Image src="/logo.png" alt="ClinID" width={360} height={150} priority />
      </div>

      <main className="relative mx-auto max-w-md px-6 pt-10 pb-24">
        <h1 className="text-center text-lg font-semibold">{t('title')}</h1>

        <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-sm space-y-6">
          {(!id || !token) && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {t('invalidLink')}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">{t('newPassword')}</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              autoComplete="new-password"
              required
            />

            <ul className="mt-2 space-y-1 text-xs">
              <li className={rules.len ? 'text-green-600' : 'text-slate-600'}>
                • {register('rules.minLength')}
              </li>
              <li className={rules.upper ? 'text-green-600' : 'text-slate-600'}>
                • {register('rules.uppercase')}
              </li>
              <li className={rules.lower ? 'text-green-600' : 'text-slate-600'}>
                • {register('rules.lowercase')}
              </li>
              <li className={rules.digit ? 'text-green-600' : 'text-slate-600'}>
                • {register('rules.number')}
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium">{t('confirmPassword')}</label>

            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              autoComplete="new-password"
              required
            />

            <p className={`mt-2 text-xs ${rules.match ? 'text-green-600' : 'text-slate-600'}`}>
              {rules.match ? t('passwordsMatch') : t('passwordsDoNotMatch')}
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {success ? (
            <div className="space-y-3">
              <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
                {t('success')}
              </div>

              <Link
                href="/login"
                className="block w-full rounded-md bg-slate-900 px-4 py-2 text-center text-white"
              >
                {t('goToLogin')}
              </Link>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!id || !token || !rules.all || submitting}
              className="mx-auto block w-56 rounded-md bg-[#cfe2ff] px-4 py-2 text-slate-900 ring-1 ring-slate-300 disabled:opacity-60"
            >
              {submitting ? t('saving') : t('save')}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}