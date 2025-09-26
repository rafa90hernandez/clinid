'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { apiPost } from '@/lib/api'; 
import { ProfileResponse } from '@/types/profile'; 

// Erro padronizado lançado pelas helpers api*
type ApiErrorShape = { status: number; body?: unknown; message?: string };
function isApiError(e: unknown): e is ApiErrorShape {
  return typeof e === 'object' && e !== null && 'status' in e && typeof (e as { status: unknown }).status === 'number';
}

type PublicAccessResponse = {
  ok: boolean;
  profile: ProfileResponse;
};

export default function PublicAccessPage() {
  const { slug } = useParams<{ slug: string }>() || { slug: '' };
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      const cachedPin = sessionStorage.getItem(`public_pin_for_${slug}`);
      if (cachedPin) {
        setPin(cachedPin);
      }
    }
  }, [slug]);

  const onlyDigits = (s: string) => s.replace(/\D/g, '').slice(0, 6);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!pin || pin.length !== 6) {
      setError('Por favor, insira um PIN de 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<PublicAccessResponse>(`/public/view`, {
        slug,
        pin,
      });

      // CORREÇÃO 1: Verificar se res.data existe antes de acessar suas propriedades
      if (res.data && res.data.ok && res.data.profile) {
        setProfileData(res.data.profile);
      } else {
        // Se res.data for null/undefined ou não tiver ok/profile
        setError('Falha ao carregar dados do perfil. PIN incorreto ou link inválido.');
      }
    } catch (err) {
      // CORREÇÃO 2: Garantir que 'msg' seja sempre string antes de passar para setError
      let msg: string;
      if (isApiError(err) && err.message) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = 'Erro desconhecido ao acessar o perfil.';
      }
      setError(msg); // Agora 'msg' é garantidamente 'string'
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  }

  // Se os dados do perfil já foram carregados com sucesso, exibe o perfil
  if (profileData) {
    const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();

    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-md">
          <h1 className="mb-6 text-center text-lg font-semibold">Histórico Clínico (Público)</h1>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">{fullName || 'Paciente'}</h2>

            {profileData.sex && (
              <p className="mb-2 text-sm">
                <span className="font-semibold">Sexo:</span> {profileData.sex}
              </p>
            )}
            {profileData.bloodType && (
              <p className="mb-2 text-sm">
                <span className="font-semibold">Tipo Sanguíneo:</span> {profileData.bloodType}
              </p>
            )}

            {profileData.allergies && profileData.allergies.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-sm block mb-1">Alergias:</span>
                <ul className="list-disc list-inside text-sm">
                  {profileData.allergies.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {profileData.medications && profileData.medications.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-sm block mb-1">Medicamentos:</span>
                <ul className="list-disc list-inside text-sm">
                  {profileData.medications.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {profileData.diseases && profileData.diseases.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-sm block mb-1">Doenças Crônicas:</span>
                <ul className="list-disc list-inside text-sm">
                  {profileData.diseases.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {profileData.surgeries && profileData.surgeries.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-sm block mb-1">Cirurgias:</span>
                <ul className="list-disc list-inside text-sm">
                  {profileData.surgeries.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {(profileData.emergencyContactName || profileData.emergencyContactPhone) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="mb-2 text-base font-semibold">Contato de Emergência:</h3>
                {profileData.emergencyContactName && (
                  <p className="mb-1 text-sm">
                    <span className="font-semibold">Nome:</span> {profileData.emergencyContactName}
                  </p>
                )}
                {profileData.emergencyContactPhone && (
                  <p className="text-sm">
                    <span className="font-semibold">Telefone:</span> {profileData.emergencyContactPhone}
                  </p>
                )}
              </div>
            )}

            <p className="mt-6 text-xs text-center text-slate-500">
              Dados atualizados em {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Se os dados do perfil ainda não foram carregados, exibe o formulário de PIN
  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Acesso Público (protegido por PIN)</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm">Digite o PIN para acessar</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(onlyDigits(e.target.value))}
              className="w-full rounded-md border bg-white px-3 py-2"
              placeholder="6 dígitos numéricos"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="mx-auto block w-56 rounded-md bg-[#cfe2ff] px-4 py-2 text-slate-900 ring-1 ring-slate-300 disabled:opacity-60"
          >
            {loading ? 'Acessando...' : 'Acessar Histórico'}
          </button>
        </form>
      </div>
    </main>
  );
}