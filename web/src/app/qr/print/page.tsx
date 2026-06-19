'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { apiGet } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

type PublicLink = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt: string | null;
};

export default function PrintEmergencyCardPage() {
  const t = useTranslations('qrPrint');
  const common = useTranslations('common');
  const { ready } = useRequireAuth();

  const [link, setLink] = useState<PublicLink | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const webOrigin = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
    return (process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
  }, []);

  useEffect(() => {
    if (!ready) return;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const publicLink = await apiGet<PublicLink | null>('/me/public-link');
        setLink(publicLink);
      } catch {
        setErr(t('loadError'));
        setLink(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, t]);

  function handlePrint() {
    if (typeof window !== 'undefined') window.print();
  }

  if (!ready || loading) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{common('loading')}</p>
      </main>
    );
  }

  if (err) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="mt-3 text-sm text-red-600">{err}</p>

        <div className="mt-6">
          <Link href="/qr" className="rounded-md border px-4 py-2 text-slate-800">
            {t('backToQr')}
          </Link>
        </div>
      </main>
    );
  }

  if (!link) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">{t('title')}</h1>

        <p className="mt-3 text-sm">
          {t('noPublicLink')}{' '}
          <Link className="underline" href="/qr">
            /qr
          </Link>
          .
        </p>
      </main>
    );
  }

  const publicUrl = `${webOrigin}/p/${link.slug}`;

  return (
    <main className="p-6">
      <div className="no-print mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('accessQrTitle')}</h1>

        <div className="flex gap-3">
          <Link href="/qr" className="rounded-md border px-4 py-2 text-slate-800">
            {common('back')}
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-slate-900 px-4 py-2 text-white"
          >
            {t('print')}
          </button>
        </div>
      </div>

      <section
        className="card mx-auto w-[360px] max-w-full rounded-2xl bg-white p-5 shadow-md print:w-[320px]"
        aria-label={t('cardAriaLabel')}
      >
        <div className="mb-3 flex items-center gap-3">
          <Logo />

          <div>
            <p className="text-xs leading-tight text-slate-500">+ClinID</p>
            <p className="text-[11px] leading-tight text-slate-500">{t('brandSubtitle')}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="rounded-xl border p-3">
            <QRCode value={publicUrl} size={168} />
          </div>

          <div className="mt-4 w-full text-center">
            <p className="text-xs text-slate-600">{t('publicAccessProtected')}</p>
            <p className="mt-1 break-all text-sm font-medium">{publicUrl}</p>
          </div>

          <p className="mt-3 text-xs text-slate-500">{t('pinInstruction')}</p>
        </div>
      </section>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #00000020;
          }
        }
      `}</style>
    </main>
  );
}