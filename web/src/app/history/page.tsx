'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError, apiGet } from '@/lib/api';
import { Logo } from '@/components/logo';
import BottomNav from '@/components/BottomNav';

type HistoryEntry = {
  id: string;
  changedAt: string;
  note?: string | null;
  snapshot?: {
    sex?: string | null;
    bloodType?: string | null;
    allergies?: string[] | null;
    medications?: string[] | null;
    diseases?: string[] | null;
    surgeries?: string[] | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
  };
};

export default function HistoryPage() {
  const t = useTranslations('history');
  const common = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiGet<HistoryEntry[]>('/me/history');

        if (!mounted) return;

        setEntries(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;

        if (err instanceof ApiError) {
          if (err.status === 404) {
            setEntries([]);
          } else if (err.status !== 401) {
            setError(err.message);
          }
        } else {
          setError('Unable to load history.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-[#E6EBFF] px-5 py-8 pb-24">
        <BackgroundDecor />

        <section className="relative z-10 mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center text-center">
          <Logo className="mb-6 opacity-80" />

          <div className="rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-xl backdrop-blur">
            <p className="text-sm font-semibold text-slate-700">{common('loading')}</p>

            <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#7CA7FF]" />
            </div>
          </div>
        </section>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#E6EBFF] via-[#EEF4FF] to-[#DCE8FF] px-5 py-6 pb-32 text-slate-900">
      <BackgroundDecor />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5277C8]">
            ClinID
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {t('title')}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t('subtitle')}
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {entries.length === 0 ? (
          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-6 text-center shadow-xl shadow-slate-300/30 backdrop-blur">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-[#E6EBFF] text-2xl">
              ♡
            </div>

            <h2 className="text-lg font-black text-slate-950">{t('empty')}</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {t('emptyDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-lg shadow-slate-300/30 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {new Date(entry.changedAt).toLocaleString()}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {entry.note || t('profileUpdate')}
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniInfo
                    label={t('sex')}
                    value={entry.snapshot?.sex || common('notInformed')}
                  />

                  <MiniInfo
                    label={t('bloodType')}
                    value={entry.snapshot?.bloodType || common('notInformed')}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#A9C4FF]/45 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <Logo className="scale-[3]" />
      </div>
    </>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F7F9FF] p-3">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}