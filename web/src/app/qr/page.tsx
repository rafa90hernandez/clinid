// web/src/app/qr/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { apiPost, apiPut } from '@/lib/api';
import BottomNav from '@/components/BottomNav';

type PublicLink = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt: string | null;
};

type ApiErrorShape = {
  status: number;
  body?: unknown;
  message?: string;
};

function isApiError(e: unknown): e is ApiErrorShape {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    typeof (e as { status: unknown }).status === 'number'
  );
}

export default function QrPage() {
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onlyDigits = (s: string) => s.replace(/\D/g, '').slice(0, 6);

  const pinComplete = pin.length === 6;
  const confirmComplete = confirmPin.length === 6;
  const pinsMatch = pinComplete && confirmComplete && pin === confirmPin;
  const loginPasswordValid = loginPassword.length >= 6;

  const canSubmit = useMemo(
    () => !loading && consent && pinComplete && confirmComplete && pinsMatch && loginPasswordValid,
    [loading, consent, pinComplete, confirmComplete, pinsMatch, loginPasswordValid],
  );

  useEffect(() => {
    setErr(null);
    setOk(null);
  }, [pin, confirmPin, loginPassword, consent]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) return;

    setLoading(true);
    setErr(null);
    setOk(null);

    try {
      const payload = {
        pin,
        confirmLoginPassword: loginPassword,
        consent,
      };

      await apiPut<unknown>('/me/pin', payload, { withAuth: true });

      const link = await apiPost<PublicLink>('/me/public-link', {}, { withAuth: true });

      if (!link?.slug) {
        throw new Error('Não foi possível gerar o link público.');
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`public_pin_for_${link.slug}`, pin);
      }

      setOk('QR Code gerado com sucesso.');
      router.replace(`/p/${link.slug}`);
    } catch (e) {
      const msg =
        isApiError(e) && e.message
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Falha ao gerar QR Code. Tente novamente.';

      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#E6EBFF] via-[#EEF4FF] to-[#DCE8FF] px-5 py-6 pb-32 text-slate-900">
      <BackgroundDecor />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5277C8]">
            ClinID
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            QR Code
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Crie um PIN público e gere seu link de emergência para acesso rápido às informações clínicas.
          </p>
        </header>

        <div className="mb-5 rounded-[2rem] bg-gradient-to-br from-[#7CA7FF] to-[#A9C4FF] p-5 text-white shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-white/85">Acesso público</p>
              <h2 className="mt-1 text-2xl font-black leading-tight">Protegido por PIN</h2>
              <p className="mt-2 text-sm leading-5 text-white/80">
                O QR Code só libera os dados após a validação da senha pública.
              </p>
            </div>

            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/20 text-3xl backdrop-blur">
              ▣
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatusPill label="PIN" value={pinComplete ? '6 dígitos' : 'Pendente'} active={pinComplete} />
            <StatusPill label="Consentimento" value={consent ? 'Autorizado' : 'Pendente'} active={consent} />
          </div>
        </div>

        <form
          onSubmit={handleGenerate}
          className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-300/30 backdrop-blur"
        >
          <div className="space-y-5">
            <InputField label="Senha pública (PIN)">
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(onlyDigits(e.target.value))}
                className={inputClass}
                placeholder="6 dígitos numéricos"
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

              <div className="mt-3 rounded-2xl bg-[#F7F9FF] p-3 text-xs text-slate-600">
                <Rule ok={pinComplete}>Senha deve conter 6 dígitos</Rule>
                <Rule ok={/^\d*$/.test(pin)}>Use apenas números</Rule>
              </div>
            </InputField>

            <InputField label="Confirmar senha pública (PIN)">
              <input
                type="password"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(onlyDigits(e.target.value))}
                className={inputClass}
                placeholder="Repita os 6 dígitos"
                required
              />

              {confirmPin.length > 0 && (
                <p
                  className={`mt-2 rounded-2xl px-3 py-2 text-xs font-semibold ${
                    pinsMatch ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {pinsMatch ? '✓ PIN confirmado' : '• Os PINs ainda não conferem'}
                </p>
              )}
            </InputField>

            <InputField label="Sua senha de login">
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={inputClass}
                placeholder="Digite sua senha de login"
                minLength={6}
                required
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Usamos sua senha de login para confirmar que é você criando este acesso.
              </p>
            </InputField>

            <label className="flex gap-3 rounded-3xl border border-[#D7E3FF] bg-[#F7F9FF] p-4 text-xs leading-5 text-slate-700">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-[#5277C8]"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                required
              />

              <span>
                Autorizo a criação do QR Code e do link público para acesso às minhas informações
                clínicas, exclusivamente para emergências, nos termos da Lei Geral de Proteção de
                Dados Pessoais – LGPD (Lei nº 13.709/2018).
              </span>
            </label>

            {err && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {err}
              </div>
            )}

            {ok && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {ok}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-gradient-to-r from-[#7CA7FF] to-[#38BDF8] px-4 py-3 text-base font-extrabold text-white shadow-lg shadow-blue-300/30 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Gerando…' : 'Gerar QR Code'}
            </button>

            {!canSubmit && (
              <p className="text-center text-xs text-slate-500">
                Preencha o PIN, confirme a senha pública, informe sua senha de login e aceite o consentimento.
              </p>
            )}
          </div>
        </form>
      </section>

      <BottomNav />
    </main>
  );
}

const inputClass =
  'w-full rounded-2xl border border-[#A9C4FF]/40 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#7CA7FF] focus:ring-4 focus:ring-[#7CA7FF]/15';

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

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p className={ok ? 'font-semibold text-emerald-600' : 'text-slate-500'}>
      {ok ? '✓' : '•'} {children}
    </p>
  );
}

function StatusPill({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur">
      <p className="text-xs text-white/75">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
        <div
          className={`h-full rounded-full transition-all ${active ? 'w-full bg-white' : 'w-1/3 bg-white/40'}`}
        />
      </div>
    </div>
  );
}