// web/src/app/page.tsx

'use client'; // Indica que este é um componente do lado do cliente no Next.js

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ApiError, apiGet } from '@/lib/api';
import { Logo } from '@/components/logo';
import BottomNav from '@/components/BottomNav';
import type { ProfileResponse } from '@/types/profile.d.ts'; // Importando ProfileResponse validada

// --- DEFINIÇÕES DE TIPOS PARA O FRONTEND ---

// MeResponse - Confirmado pelo accounts.service.ts no backend
interface MeResponse {
  id: string;
  email: string;
  role: string | null;
  createdAt: string; // ISO 8601
  // firstName?: string;
  // lastName?: string;
}

// PublicLinkResponse - baseado no DTO do backend
interface PublicLinkResponse {
  slug: string;
  status: 'active' | 'revoked';
  isActive: boolean;
  qrCodeUrl?: string;
}
// --- FIM DAS DEFINIÇÕES DE TIPOS ---

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [publicLink, setPublicLink] = useState<PublicLinkResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Carrega /me e /me/profile primeiro
        const meData = await apiGet<MeResponse>('/accounts/me');
        const profileData = await apiGet<ProfileResponse>('/me/profile');

        if (cancelled) return;
        setMe(meData);
        setProfile(profileData);

        // 2) Tenta carregar /me/public-link com tratamento específico de 404
        try {
          const publicLinkData = await apiGet<PublicLinkResponse>('/me/public-link');
          if (cancelled) return;
          setPublicLink(publicLinkData);
        } catch (err) {
          if (cancelled) return;

          if (err instanceof ApiError) {
            if (err.status === 404) {
              // Link público ainda não criado — não é erro para UI
              setPublicLink(null);
            } else if (err.status !== 401) {
              console.error(`Erro da API (${err.status}) em /me/public-link:`, err.message);
              setError(`Erro ao carregar link público: ${err.message}`);
            }
          } else {
            console.error('Erro desconhecido ao carregar /me/public-link:', err);
            setError('Erro de rede ou desconhecido ao carregar link público.');
          }
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError) {
          // O apiGet já redireciona para /login em 401 (conforme sua implementação).
          if (err.status !== 401) {
            console.error(`Erro da API (${err.status}):`, err.message);
            setError(`Erro ao carregar dados: ${err.message}`);
          }
        } else {
          console.error('Erro desconhecido ou de rede ao carregar dados:', err);
          setError('Erro de rede ou desconhecido. Verifique sua conexão.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Renderização condicional para estados de carregamento e erro ---
  if (loading) {
    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo className="opacity-30" />
        </div>
        <div className="relative z-10 text-center">Carregando dados iniciais...</div>
        <BottomNav />
      </main>
    );
  }

  if (error) {
    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24 text-center text-red-600">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo className="opacity-30" />
        </div>
        <div className="relative z-10">Erro: {error}</div>
        <BottomNav />
      </main>
    );
  }

  // --- Renderização do conteúdo principal ---
  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Dashboard</h1>

        {me && (
          <div className="mb-4 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-2 text-xl font-bold">Bem-vindo(a), {me.email}!</h2>
            <p>Seu ID: {me.id}</p>
            <p>Seu Papel: {me.role || 'Não definido'}</p>
            <p>Membro desde: {new Date(me.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        {profile && (
          <div className="mb-4 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-2 text-xl font-bold">Seu Perfil Clínico</h2>
            <p>
              Nome completo:{' '}
              {`${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Não informado'}
            </p>
            {profile.sex && <p>Sexo: {profile.sex}</p>}
            {profile.bloodType && <p>Tipo Sanguíneo: {profile.bloodType}</p>}
          </div>
        )}

        {publicLink ? (
          <div className="mb-4 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-2 text-xl font-bold">Link Público de Acesso</h2>
            <p>
              Slug:{' '}
              <span className="rounded bg-gray-100 p-1 font-mono">{publicLink.slug}</span>
            </p>
            <p>Status: {publicLink.isActive ? 'Ativo' : 'Revogado'}</p>
            {publicLink.qrCodeUrl && (
              <>
                <p className="mt-2">QR Code:</p>
                <Image
                  src={publicLink.qrCodeUrl}
                  alt="QR Code do Link Público"
                  width={128}
                  height={128}
                  className="mt-2 h-32 w-32 rounded border border-gray-300"
                />
              </>
            )}
            <p className="mt-3 text-sm text-blue-600 hover:underline">
              <Link href="/qr">Gerenciar link público</Link>
            </p>
          </div>
        ) : (
          <div className="mb-4 rounded-lg bg-white p-6 text-center text-gray-500 shadow-md">
            <p>Você ainda não configurou seu link público.</p>
            <p className="mt-2 text-sm text-blue-600 hover:underline">
              <Link href="/qr">Configurar agora</Link>
            </p>
          </div>
        )}

        {!me && !profile && !publicLink && (
          <div className="text-center text-slate-600">Nenhum dado disponível.</div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
