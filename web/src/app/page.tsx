// web/src/app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import { Logo } from '@/components/logo';
import BottomNav from '@/components/BottomNav';
import type { ProfileResponse } from '@/types/profile.d.ts';

interface MeResponse {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string | null;
  createdAt: string;
}

interface PublicLinkResponse {
  slug: string;
  status: 'active' | 'revoked';
  isActive: boolean;
  qrCodeUrl?: string;
}

export default function HomePage() {
  const t = useTranslations('dashboard');
  const common = useTranslations('common');

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [publicLink, setPublicLink] = useState<PublicLinkResponse | null>(null);

  const fullName = useMemo(() => {
    const userName = `${me?.firstName ?? ''} ${me?.lastName ?? ''}`.trim();

    if (userName) return userName;

    const emailName = me?.email?.split('@')[0];

    return emailName || 'User';
  }, [me?.firstName, me?.lastName, me?.email]);

  async function handleLogout() {
    try {
      await apiPost('/accounts/logout', {}, { withAuth: true });
    } catch {
      // Ignore logout API errors and clear local session anyway.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('logged_in');

      router.replace('/login');
      router.refresh();
    }
  }

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const meData = await apiGet<MeResponse>('/accounts/me');
        const profileData = await apiGet<ProfileResponse>('/me/profile');

        if (cancelled) return;

        setMe(meData);
        setProfile(profileData);

        try {
          const publicLinkData = await apiGet<PublicLinkResponse>('/me/public-link');

          if (cancelled) return;

          setPublicLink(publicLinkData);
        } catch (err) {
          if (cancelled) return;

          if (err instanceof ApiError) {
            if (err.status === 404) {
              setPublicLink(null);
            } else if (err.status !== 401) {
              console.error(`API error (${err.status}) on /me/public-link:`, err.message);
              setError(`${t('publicAccess')}: ${err.message}`);
            }
          } else {
            console.error('Unknown error loading /me/public-link:', err);
            setError(t('unableToLoad'));
          }
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError) {
          if (err.status !== 401) {
            console.error(`API error (${err.status}):`, err.message);
            setError(err.message);
          }
        } else {
          console.error('Unknown or network error loading dashboard data:', err);
          setError(t('unableToLoad'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-[#E6EBFF] px-5 py-8 pb-24">
        <BackgroundDecor />

        <section className="relative z-10 mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center text-center">
          <Logo className="mb-6 opacity-80" />

          <div className="rounded-3xl border border-white/70 bg-white/75 px-6 py-5 shadow-xl backdrop-blur">
            <p className="text-sm font-medium text-slate-700">{t('loadingPanel')}</p>

            <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#7CA7FF]" />
            </div>
          </div>
        </section>

        <BottomNav />
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-[#E6EBFF] px-5 py-8 pb-24">
        <BackgroundDecor />

        <section className="relative z-10 mx-auto max-w-md">
          <Logo className="mx-auto mb-6 opacity-80" />

          <div className="rounded-3xl border border-red-100 bg-white/90 p-6 text-center shadow-xl backdrop-blur">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl">
              !
            </div>

            <h1 className="text-lg font-bold text-slate-900">{t('unableToLoad')}</h1>

            <p className="mt-2 text-sm leading-6 text-red-600">{error}</p>

            <Link
              href="/login"
              className="mt-5 inline-flex rounded-2xl bg-[#7CA7FF] px-5 py-3 text-sm font-semibold text-white shadow-md"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </section>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#E6EBFF] px-5 py-6 pb-28">
      <BackgroundDecor />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5277C8]">
              ClinID
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {t('title')}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-900"
          >
            {common('logout')}
          </button>
        </header>

        <div className="mb-5 rounded-[2rem] bg-gradient-to-br from-[#7CA7FF] to-[#A9C4FF] p-5 text-white shadow-xl">
          <p className="text-sm text-white/85">{t('welcome')}</p>
          <h2 className="mt-1 text-xl font-bold leading-tight">{fullName}</h2>
          <p className="mt-1 break-all text-xs text-white/75">{me?.email}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <InfoPill
              label={t('profile')}
              value={profile ? common('created') : common('pending')}
            />

            <InfoPill
              label={t('publicQr')}
              value={publicLink?.isActive ? common('active') : common('pending')}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t('account')}
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">{t('userData')}</h3>
              </div>

              <span className="rounded-full bg-[#E6EBFF] px-3 py-1 text-xs font-semibold text-[#5277C8]">
                {me?.role || 'USER'}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p className="break-all">
                <span className="font-semibold text-slate-800">{t('id')}:</span> {me?.id}
              </p>

              <p>
                <span className="font-semibold text-slate-800">
                  {common('memberSince')}:
                </span>{' '}
                {me?.createdAt
                  ? new Date(me.createdAt).toLocaleDateString()
                  : common('notInformed')}
              </p>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t('medicalProfile')}
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">{fullName}</h3>
              </div>

              <Link
                href="/profile"
                className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white"
              >
                {common('edit')}
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniInfo label={t('sex')} value={profile?.sex || common('notInformed')} />
              <MiniInfo
                label={t('bloodType')}
                value={profile?.bloodType || common('notInformed')}
              />
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {t('emergency')}
                </p>

                <h3 className="mt-1 text-lg font-bold text-slate-950">
                  {t('publicAccess')}
                </h3>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  publicLink?.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {publicLink?.isActive ? common('active') : common('notConfigured')}
              </span>
            </div>

            {publicLink ? (
              <div className="mt-4">
                <p className="text-sm text-slate-600">
                  {t('slug')}:{' '}
                  <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-slate-900">
                    {publicLink.slug}
                  </span>
                </p>

                {publicLink.qrCodeUrl && (
                  <div className="mt-4 inline-flex rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                    <Image
                      src={publicLink.qrCodeUrl}
                      alt="Public Link QR Code"
                      width={128}
                      height={128}
                      className="h-32 w-32 rounded-xl"
                    />
                  </div>
                )}

                <Link
                  href="/qr"
                  className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#7CA7FF] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-95"
                >
                  {t('managePublicLink')}
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-[#F7F9FF] p-4 text-center">
                <p className="text-sm text-slate-600">{t('noQrConfigured')}</p>

                <Link
                  href="/qr"
                  className="mt-4 inline-flex rounded-2xl bg-[#7CA7FF] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-95"
                >
                  {t('configureNow')}
                </Link>
              </div>
            )}
          </Card>

          {!me && !profile && !publicLink && (
            <div className="rounded-3xl bg-white/80 p-6 text-center text-sm text-slate-600 shadow-lg">
              {t('noData')}
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#A9C4FF]/50 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
        <Logo className="scale-[3]" />
      </div>
    </>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-lg shadow-slate-300/30 backdrop-blur">
      {children}
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur">
      <p className="text-xs text-white/75">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
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