'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiDelete } from '@/lib/api';

export default function DeleteAccountPage() {
  const t = useTranslations('deleteAccount');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!password.trim()) {
      setError(t('passwordRequired'));
      return;
    }

    try {
      setSubmitting(true);

      await apiDelete<unknown>(
        '/accounts',
        { confirmLoginPassword: password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withAuth: true,
        },
      );

      setMsg(t('success'));
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message || t('error') : t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-xl font-semibold">{t('title')}</h1>

      <p className="mb-4 text-sm text-gray-600">{t('warning')}</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            {t('confirmPassword')}
          </label>

          <input
            id="password"
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {msg && (
          <div className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-red-600 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? t('deleting') : t('delete')}
        </button>
      </form>
    </main>
  );
}