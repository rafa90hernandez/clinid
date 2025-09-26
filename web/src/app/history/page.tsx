'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiGet } from '@/lib/api'; // Importe ApiError
import { Logo } from '@/components/logo';
import BottomNav from '@/components/BottomNav';

// Ajuste o tipo ProfileResponse conforme a sua definição real
type ProfileResponse = {
  name?: string | null;
  cpf?: string | null;
  // Adicione outras propriedades do perfil que history/page.tsx possa precisar
  // Por exemplo: se você buscar um histórico de consultas, os dados virão aqui
};

// Se 'history/page.tsx' busca dados clínicos ou de histórico,
// você precisará definir o tipo para esses dados,
// por exemplo, ClinicalDataResponse ou HistoryEntry.
// Por enquanto, vamos assumir que ele busca o perfil do usuário para exibir nome/CPF.

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        // apiGet<ProfileResponse> agora retorna o ProfileResponse diretamente ou lança ApiError
        const data = await apiGet<ProfileResponse>('/me/profile'); // Ajuste o endpoint se for outro

        if (!mounted) return;

        setProfileData(data); // `data` já é o ProfileResponse
        // Aqui você pode fazer algo com `data` se ele contiver históricos
        // Por exemplo: setHistoryEntries(data.history || []);

      } catch (err) {
        if (!mounted) return;

        if (err instanceof ApiError) {
          if (err.status === 404) {
            setError('Histórico não encontrado.');
          } else if (err.status !== 401) { // 401 já redireciona em apiGet
            setError(`Erro ao carregar histórico: ${err.message} (HTTP ${err.status})`);
          }
        } else {
          setError('Erro de rede ou desconhecido ao carregar histórico.');
          console.error('Erro ao carregar histórico:', err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHistoryData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo className="opacity-30" />
        </div>
        <div className="relative z-10">Carregando histórico...</div>
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

  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Histórico Clínico</h1>

        {profileData ? (
          <div className="text-sm mb-4">
            <div>Olá, {profileData.name || 'Usuário'}!</div>
            <div className="text-slate-600">CPF: {profileData.cpf || 'Não informado'}</div>
          </div>
        ) : (
          <div className="text-sm mb-4 text-slate-600">Dados do perfil não disponíveis.</div>
        )}

        {/* Renderize aqui o conteúdo real do histórico */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p>Seu histórico aparecerá aqui. Por exemplo:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Consulta em 2024-09-20: Dor de cabeça.</li>
            <li>Exame de sangue em 2024-09-15: Normal.</li>
          </ul>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}