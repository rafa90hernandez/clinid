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

// Erro padronizado lançado pelas helpers api*
type ApiErrorShape = { status: number; body?: unknown; message?: string };
function isApiError(e: unknown): e is ApiErrorShape {
  return typeof e === 'object' && e !== null && 'status' in e && typeof (e as { status: unknown }).status === 'number';
}

export default function QrPage() { // Componente funcional para a página /qr
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null); // Estado para mensagens de erro
  const [loading, setLoading] = useState(false); // Estado para controle de carregamento

  const onlyDigits = (s: string) => s.replace(/\D/g, '').slice(0, 6);

  const canSubmit = useMemo(
    () =>
      !loading && // Adicionado para desabilitar o botão enquanto está carregando
      consent &&
      pin.length === 6 &&
      confirmPin.length === 6 &&
      pin === confirmPin &&
      loginPassword.length >= 6,
    [loading, consent, pin, confirmPin, loginPassword],
  );

  useEffect(() => {
    setErr(null); // Limpa mensagens de erro ao mudar os campos
    setOk(null);  // Limpa mensagens de sucesso ao mudar os campos
  }, [pin, confirmPin, loginPassword, consent]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      // 1) Define/atualiza o PIN, enviando TODOS os campos obrigatórios para a API
      const payload = {
        pin: pin,
        confirmLoginPassword: loginPassword,
        consent: consent,
      };

      // API call para PUT /me/pin (para configurar o PIN do usuário)
      await apiPut<unknown>('/me/pin', payload, { withAuth: true });

      // 2) Gera (ou regera) o link público
      const res = await apiPost<PublicLink>('/me/public-link', {}, { withAuth: true });
      const link = res;
      if (!link?.slug) throw new Error('Não foi possível gerar o link público.');

      // 3) Guarda o PIN no sessionStorage para que a página de acesso público possa pré-preencher
      // (usando uma chave específica para o slug)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`public_pin_for_${link.slug}`, pin);
      }

      setOk('QR Code gerado com sucesso.');
      // Aponta para a página de exibição do QR Code
      router.replace(`/p/${link.slug}`);
    } catch (e) {
      const msg =
        (isApiError(e) && e.message) ? e.message :
          e instanceof Error ? e.message :
            'Falha ao gerar QR Code. Tente novamente.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      {/* marca d’água */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo className="opacity-30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Gerar Acesso Público</h1>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* PIN */}
          <div>
            <label className="mb-1 block text-sm">Senha pública (PIN)</label>
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
            />
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li>• Senha deve conter 6 dígitos</li>
              <li>• Use apenas números</li>
            </ul>
          </div>

          {/* Confirmar PIN */}
          <div>
            <label className="mb-1 block text-sm">Confirmar senha pública (PIN)</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(onlyDigits(e.target.value))}
              className="w-full rounded-md border bg-white px-3 py-2"
              placeholder="repita os 6 dígitos"
              required
            />
            {confirmPin.length > 0 && confirmPin !== pin && (
              <p className="mt-1 text-xs text-red-600">As senhas não conferem.</p>
            )}
          </div>

          {/* Campo para a Senha de Login do Usuário */}
          <div>
            <label className="mb-1 block text-sm">Sua senha de login</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full rounded-md border bg-white px-3 py-2"
              placeholder="Digite sua senha de login"
              minLength={6}
              required
            />
          </div>

          {/* Consentimento LGPD */}
          <label className="flex items-start gap-2 text-xs leading-snug text-slate-700">
            <input
              type="checkbox"
              className="mt-0.5"
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

          {/* Mensagens */}
          {err && (
            <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {err}
            </div>
          )}
          {ok && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {ok}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mx-auto block w-56 rounded-md bg-[#cfe2ff] px-4 py-2 text-slate-900 ring-1 ring-slate-300 disabled:opacity-60"
          >
            {loading ? 'Gerando…' : 'Gerar QR Code'}
          </button>
          <pre className="mt-4 rounded bg-white p-2 text-xs">
            {JSON.stringify(
              {
                loading,
                consent,
                pinLength: pin.length,
                confirmPinLength: confirmPin.length,
                pinsMatch: pin === confirmPin,
                loginPasswordLength: loginPassword.length,
                canSubmit,
              },
              null,
              2,
            )}
          </pre>
        </form>
      </div>
      <BottomNav />
    </main>
  );
}