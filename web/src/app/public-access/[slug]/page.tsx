// web/src/app/public-access/[slug]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, ApiError } from '@/lib/api';
import { Logo } from '@/components/logo';
import BottomNav from '@/components/BottomNav';

// Ajuste o tipo conforme seu DTO público real
interface ProfilePublicView {
  firstName?: string;
  lastName?: string;
  sex?: string;
  bloodType?: string;
  // ...outros campos que seu backend expõe publicamente
}

interface PublicAccessResponse {
  ok: boolean;
  profile?: ProfilePublicView;
  message?: string;
}

export default function PublicAccessPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfilePublicView | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        if (!slug) {
          throw new Error('Slug inválido.');
        }

        // apiGet já retorna o JSON tipado, sem .data
        const res = await apiGet<PublicAccessResponse>(`/public-access/${encodeURIComponent(slug)}`);

        if (!mounted) return;

        if (res && res.ok && res.profile) {
          setProfileData(res.profile);
        } else {
          // Caso o backend retorne ok=false ou não traga profile
          setProfileData(null);
          setErrorMsg(res?.message ?? 'Não foi possível carregar o acesso público.');
        }
      } catch (err) {
        if (!mounted) return;

        if (err instanceof ApiError) {
          // 404: link/slug não encontrado ou revogado
          if (err.status === 404) {
            setProfileData(null);
            setErrorMsg('Este link público não existe ou foi revogado.');
          } else {
            setErrorMsg(`Erro ${err.status}: ${err.message}`);
          }
        } else if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Erro desconhecido ao carregar o acesso público.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo className="opacity-30" />
        </div>
        <div className="relative z-10 text-center">Carregando acesso público…</div>
        <BottomNav />
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo className="opacity-30" />
        </div>
        <div className="relative z-10">
          <h1 className="mb-2 text-lg font-semibold">Acesso público</h1>
          <p className="text-red-600">{errorMsg}</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Acesso público</h1>

        {profileData ? (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-2 text-xl font-bold">Perfil Clínico</h2>
            <p>
              Nome:{' '}
              {`${profileData.firstName ?? ''} ${profileData.lastName ?? ''}`.trim() || 'Não informado'}
            </p>
            {profileData.sex && <p>Sexo: {profileData.sex}</p>}
            {profileData.bloodType && <p>Tipo Sanguíneo: {profileData.bloodType}</p>}
            {/* Adicione aqui outros campos públicos permitidos */}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-md">
            Nenhuma informação pública disponível para este link.
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
