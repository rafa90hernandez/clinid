// web/src/app/page.tsx

'use client'; // Indica que este é um componente do lado do cliente no Next.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  createdAt: string; // Data de criação do usuário (como string ISO 8601)
  // Se o seu backend retornar `firstName` e `lastName` no endpoint `/me`,
  // adicione-os aqui:
  // firstName?: string;
  // lastName?: string;
}

// PublicLinkResponse - Baseado no PublicLinkInfoResponseDto do backend (que criamos juntos)
// Este tipo representa o que esperamos receber do endpoint /me/public-link
interface PublicLinkResponse {
  slug: string; // O segmento único do link público
  status: 'active' | 'revoked'; // O status do link no backend
  isActive: boolean; // Um booleano para facilitar o frontend (baseado no status)
  qrCodeUrl?: string; // A URL para a imagem do QR Code (opcional, gerada no backend ou frontend)
}
// --- FIM DAS DEFINIÇÕES DE TIPOS ---


export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [publicLink, setPublicLink] = useState<PublicLinkResponse | null>(null);

  useEffect(() => {
    let cancelled = false; // Flag para evitar atualizações de estado em componente desmontado

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null); // Limpa erros anteriores

        // Chamadas à API para os três endpoints
        // NOTA: apiGet retorna o tipo diretamente, sem .data
        const meData = await apiGet<MeResponse>('/me');
        const profileData = await apiGet<ProfileResponse>('/me/profile');
        const publicLinkData = await apiGet<PublicLinkResponse>('/me/public-link');

        if (cancelled) return; // Se o componente foi desmontado, sai

        setMe(meData); // ATENÇÃO AQUI: meData é o objeto direto
        setProfile(profileData); // ATENÇÃO AQUI: profileData é o objeto direto
        setPublicLink(publicLinkData); // ATENÇÃO AQUI: publicLinkData é o objeto direto

      } catch (err) {
        if (cancelled) return; // Se o componente foi desmontado, sai

        if (err instanceof ApiError) {
          // O apiGet já trata o redirecionamento para /login em caso de 401.
          // Aqui, tratamos outros erros da API, mas ignoramos 404 para links públicos
          // já que o link pode não ter sido criado ainda no backend.
          if (err.status === 404 && err.url?.includes('/me/public-link')) {
            console.log('Nenhum link público encontrado para o usuário.');
            setPublicLink(null); // Define como null se o link não existir
          } else if (err.status !== 401) {
            console.error(`Erro da API (${err.status}):`, err.message);
            setError(`Erro ao carregar dados: ${err.message}`);
          }
        } else {
          console.error('Erro desconhecido ou de rede ao carregar dados:', err);
          setError('Erro de rede ou desconhecido. Verifique sua conexão.');
        }
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      cancelled = true; // Cleanup: define a flag para evitar updates de estado
    };
  }, []); // Array de dependências vazio: executa apenas uma vez na montagem do componente

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
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-bold mb-2">Bem-vindo(a), {me.email}!</h2> {/* Usando email aqui */}
            <p>Seu ID: {me.id}</p>
            <p>Seu Papel: {me.role || 'Não definido'}</p>
            <p>Membro desde: {new Date(me.createdAt).toLocaleDateString()}</p>
            {/* Exiba outras informações de 'me' aqui */}
          </div>
        )}

        {profile && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-bold mb-2">Seu Perfil Clínico</h2>
            {/* Compondo o nome completo do profileData */}
            <p>Nome completo: {`${profile.firstName} ${profile.lastName}`.trim() || 'Não informado'}</p>
            {profile.sex && <p>Sexo: {profile.sex}</p>}
            {profile.bloodType && <p>Tipo Sanguíneo: {profile.bloodType}</p>}
            {/* Exiba outras informações de 'profile' aqui */}
          </div>
        )}

        {publicLink ? ( // Renderiza apenas se publicLink não for null
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <h2 className="text-xl font-bold mb-2">Link Público de Acesso</h2>
            <p>Slug: <span className="font-mono bg-gray-100 p-1 rounded">{publicLink.slug}</span></p>
            <p>Status: {publicLink.isActive ? 'Ativo' : 'Revogado'}</p>
            {publicLink.qrCodeUrl && (
              <>
                <p className="mt-2">QR Code:</p>
                <img
                  src={publicLink.qrCodeUrl}
                  alt="QR Code do Link Público"
                  className="mt-2 w-32 h-32 border border-gray-300 rounded"
                />
              </>
            )}
            {/* Adicione um link para a página de gerenciamento do link público, se tiver */}
            <p className="mt-3 text-sm text-blue-600 hover:underline">
              <Link href="/settings/public-link">Gerenciar link público</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md mb-4 text-center text-gray-500">
            <p>Você ainda não configurou seu link público.</p>
            <p className="mt-2 text-sm text-blue-600 hover:underline">
              <Link href="/settings/public-link">Configurar agora</Link>
            </p>
          </div>
        )}

        {(!me && !profile && !publicLink) && ( // Caso excepcional onde nenhum dado é carregado
          <div className="text-center text-slate-600">Nenhum dado disponível.</div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}