'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { Logo } from '@/components/logo';
import { apiGet } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

type Me = { sub: string; email: string };

type Profile = {
  firstName?: string;
  lastName?: string;
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

type PublicLink = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [link, setLink] = useState<PublicLink | null>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [meRes, profileRes, linkRes] = await Promise.all([
          apiGet<Me>('/auth/me'),
          apiGet<Profile>('/me/profile'),
          apiGet<PublicLink>('/me/public-link'),
        ]);

        if (cancelled) return;
        setMe(meRes);
        setProfile(profileRes);
        setLink(linkRes);
      } catch {
        if (!cancelled) setError('Falha ao carregar dados. Faça login novamente.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) return <main className="p-6">Carregando…</main>;

  return (
    <main className="p-6 pb-24">
      <header className="mb-6 flex items-center justify-between">
        <Logo />
        <button
          className="rounded-md border px-3 py-1 text-sm"
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/login');
          }}
        >
          Sair
        </button>
      </header>

      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>

      {loading && <p>Carregando dados…</p>}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
          {error} <Link className="underline" href="/login">Ir para login</Link>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          <section className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-1 font-medium">Sua conta</h2>
            <p className="text-sm text-slate-600">{me?.email}</p>
          </section>

          <section className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-2 font-medium">Perfil</h2>
            <p className="text-sm text-slate-600">
              {profile?.firstName
                ? `${profile.firstName} ${profile.lastName ?? ''}`
                : 'Sem dados.'}
            </p>
            <Link className="text-sm text-blue-600 underline" href="/profile">
              Editar perfil
            </Link>
          </section>

          <section className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-2 font-medium">Acesso público</h2>
            {link ? (
              <div className="text-sm">
                <p>Status: {link.status}</p>
                <p>Slug: {link.slug}</p>
                <p className="truncate">
                  URL:{' '}
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/q/${link.slug}`
                    : `/q/${link.slug}`}
                </p>
                <div className="mt-2 flex gap-3">
                  <Link className="text-blue-600 underline" href={`/q/${link.slug}`}>
                    Ver página pública
                  </Link>
                  <Link className="text-blue-600 underline" href="/qr/print">
                    Imprimir cartão
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Nenhum link público gerado ainda.</p>
            )}
          </section>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
