// web/src/app/public-access/[slug]/page.tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApiError, apiPost } from '@/lib/api';
import { Logo } from '@/components/logo';

interface ProfilePublicView {
  firstName?: string;
  lastName?: string;
  sex?: string;
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  diseases?: string[];
  surgeries?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

interface PublicAccessResponse {
  ok?: boolean;
  profile?: ProfilePublicView;
  message?: string;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

export default function PublicAccessPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfilePublicView | null>(null);

  const pinComplete = pin.length === 6;

  useEffect(() => {
    if (!slug || typeof window === 'undefined') return;

    const cached = sessionStorage.getItem(`public_pin_for_${slug}`);
    if (cached && /^\d{6}$/.test(cached)) {
      setPin(cached);
    }
  }, [slug]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!slug || !pinComplete) return;

    setLoading(true);
    setErrorMsg(null);
    setProfileData(null);

    try {
      const res = await apiPost<PublicAccessResponse>(
        '/public/view',
        {
          slug,
          pin,
        },
        {
          withAuth: false,
        },
      );

      if (res?.profile) {
        setProfileData(res.profile);
        return;
      }

      setErrorMsg(res?.message ?? 'Não foi possível carregar o acesso público.');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setErrorMsg('Este link público não existe ou foi revogado.');
        } else if (err.status === 401 || err.status === 403) {
          setErrorMsg('PIN inválido. Verifique a senha pública e tente novamente.');
        } else {
          setErrorMsg(err.message || `Erro ${err.status}`);
        }
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Erro desconhecido ao carregar o acesso público.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#E6EBFF] via-[#EEF4FF] to-[#DCE8FF] px-5 py-6 pb-10 text-slate-900">
      <BackgroundDecor />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5277C8]">
            ClinID
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            Acesso público
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Área protegida por PIN para consulta emergencial das informações clínicas.
          </p>
        </header>

        {!profileData ? (
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-300/30 backdrop-blur"
          >
            <div className="rounded-[1.75rem] bg-gradient-to-br from-[#7CA7FF] to-[#A9C4FF] p-5 text-white shadow-lg">
              <p className="text-sm text-white/85">Validação necessária</p>
              <h2 className="mt-1 text-2xl font-black">Digite o PIN</h2>
              <p className="mt-2 text-sm leading-5 text-white/80">
                Informe a senha pública de 6 dígitos para visualizar os dados permitidos.
              </p>
            </div>

            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                Senha pública
              </label>

              <input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(onlyDigits(e.target.value))}
                className="w-full rounded-2xl border border-[#A9C4FF]/40 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.35em] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#7CA7FF] focus:ring-4 focus:ring-[#7CA7FF]/15"
                placeholder="••••••"
                required
              />

              <div className="mt-3 grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 rounded-full transition ${
                      index < pin.length ? 'bg-[#7CA7FF]' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={!pinComplete || loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#7CA7FF] to-[#38BDF8] px-4 py-3 text-base font-extrabold text-white shadow-lg shadow-blue-300/30 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Validando…' : 'Acessar informações'}
            </button>
          </form>
        ) : (
          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-300/30 backdrop-blur">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-500 to-[#38BDF8] p-5 text-white shadow-lg">
              <p className="text-sm text-white/85">Acesso autorizado</p>
              <h2 className="mt-1 text-2xl font-black">Perfil clínico</h2>
              <p className="mt-2 text-sm leading-5 text-white/80">
                Informações disponíveis para atendimento de emergência.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <InfoCard
                title="Identificação"
                items={[
                  ['Nome', `${profileData.firstName ?? ''} ${profileData.lastName ?? ''}`.trim() || 'Não informado'],
                  ['Sexo', profileData.sex || 'Não informado'],
                  ['Tipo sanguíneo', profileData.bloodType || 'Não informado'],
                ]}
              />

              <ListCard title="Alergias" items={profileData.allergies} />
              <ListCard title="Medicamentos utilizados" items={profileData.medications} />
              <ListCard title="Doenças" items={profileData.diseases} />
              <ListCard title="Cirurgias realizadas" items={profileData.surgeries} />

              <InfoCard
                title="Contato de emergência"
                items={[
                  ['Nome', profileData.emergencyContactName || 'Não informado'],
                  ['Celular', profileData.emergencyContactPhone || 'Não informado'],
                ]}
              />
            </div>
          </div>
        )}
      </section>
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

function InfoCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <section className="rounded-3xl bg-[#F7F9FF] p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h3>

      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs font-semibold text-slate-400">{label}</p>
            <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ListCard({ title, items }: { title: string; items?: string[] | null }) {
  return (
    <section className="rounded-3xl bg-[#F7F9FF] p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h3>

      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100">
          Não informado
        </p>
      )}
    </section>
  );
}