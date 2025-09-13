'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { Logo } from '@/components/logo';
import { apiGet, ApiError } from '@/lib/api';

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
  revokedAt?: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    const fetchSafe = async <T,>(path: string): Promise<T | null> => {
      try {
        return await apiGet<T>(path);
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.status === 404) return null; // ausência de dados é OK
          if (e.status === 401) throw e; // vamos tratar acima
        }
        // outras falhas: mantém null e deixa banner genérico
        throw e;
      }
    };

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // 1) valida sessão
        const meRes = await apiGet<Me>('/auth/me');
        setMe(meRes);

        // 2) carrega dados opcionais sem quebrar na ausência
        const [profileRes, linkRes] = await Promise.all([
          fetchSafe<Profile>('/me/profile'),
          fetchSafe<PublicLink>('/me/public-link'),
        ]);
        setProfile(profileRes);
        setLink(linkRes);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          // token inválido/expirado → limpar e ir pro login
          if (typeof window !== 'undefined') localStorage.removeItem('token');
          router.replace('/login');
          return;
        }
        setErr('Falha ao carregar dados. Faça login novamente.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Carregando…</h1>
      </main>
    );
  }

  if (err) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-red-600">{err}</p>
        <button
          onClick={() => router.replace('/login')}
          className="rounded-md bg-slate-900 px-4 py-2 text-white"
        >
          Ir para login
        </button>
      </main>
    );
  }

  return (
    <main className="pb-24">
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <h1 className="text-xl font-semibold">ClinID</h1>
        </div>
        <Link href="/settings/delete" className="text-sm underline text-slate-700">
          Encerrar conta
        </Link>
      </header>

      <section className="px-6 space-y-2">
        <h2 className="text-lg font-medium">Bem-vindo{me?.email ? `, ${me.email}` : ''}</h2>
        <p className="text-slate-600">
          Aqui você gerencia seu perfil clínico e o QR de emergência.
        </p>
      </section>

      <section className="mt-6 grid gap-4 px-6">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 font-medium">Perfil clínico</h3>
          {profile ? (
            <ul className="text-sm text-slate-700 space-y-1">
              <li><strong>Nome:</strong> {profile.firstName ?? '-'} {profile.lastName ?? ''}</li>
              <li><strong>Sangue:</strong> {profile.bloodType ?? '-'}</li>
              <li><strong>Contato de emergência:</strong> {profile.emergencyContactName ?? '-'}</li>
              <li><strong>Telefone:</strong> {profile.emergencyContactPhone ?? '-'}</li>
            </ul>
          ) : (
            <p className="text-sm text-slate-600">Sem perfil cadastrado ainda.</p>
          )}
          <div className="mt-3">
            <Link href="/qr" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
              Abrir QR de emergência
            </Link>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="mb-2 font-medium">Link público</h3>
          {link && link.status === 'active' ? (
            <p className="text-sm">
              Slug ativo:{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5">{link.slug}</code>
            </p>
          ) : (
            <p className="text-sm text-slate-600">Nenhum link público ativo.</p>
          )}
          <div className="mt-3 flex gap-2">
            <Link href="/qr/print" className="rounded-md border px-3 py-2 text-sm">
              Imprimir cartão
            </Link>
            {link?.slug ? (
              <Link href={`/p/${link.slug}`} className="rounded-md border px-3 py-2 text-sm">
                Ver página pública
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
