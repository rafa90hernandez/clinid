'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

export default function ResetForm() {
  const search = useSearchParams();
  const id    = search.get('id') ?? '';
  const token = search.get('token') ?? '';

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);

  // Regras de senha (mínimas) para feedback visual
  const rules = useMemo(() => {
    const len   = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const digit = /\d/.test(password);
    const match = confirm.length > 0 && confirm === password;
    return { len, upper, lower, digit, match, all: len && upper && lower && digit && match };
  }, [password, confirm]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !token) {
      setErrorMsg('Link inválido ou expirado. Solicite um novo e-mail.');
      return;
    }
    if (!rules.all || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // ❗ endpoint e corpo corretos para o seu backend Nest:
      // POST /accounts/reset  { id, token, newPassword }
      await apiPost<unknown>('/accounts/reset', { id, token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível redefinir a senha. Tente novamente.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-dvh bg-[#eaf2ff] text-slate-900">
      {/* logo de fundo 30% */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        {/* padronizei para /logo.png (minúsculo), igual ao resto do projeto */}
        <Image src="/logo.png" alt="ClinID" width={360} height={150} priority />
      </div>

      <main className="relative mx-auto max-w-md px-6 pt-10 pb-24">
        <h1 className="text-center text-lg font-semibold">Redefinir senha</h1>

        <form onSubmit={onSubmit} className="mx-auto mt-8 max-w-sm space-y-6">
          {(!id || !token) && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              Link inválido ou ausente. Solicite um novo e-mail de recuperação.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              autoComplete="new-password"
              required
            />
            <ul className="mt-2 space-y-1 text-xs">
              <li className={rules.len ? 'text-green-600' : 'text-slate-600'}>• Mínimo de 8 caracteres</li>
              <li className={rules.upper ? 'text-green-600' : 'text-slate-600'}>• Ao menos uma letra maiúscula</li>
              <li className={rules.lower ? 'text-green-600' : 'text-slate-600'}>• Ao menos uma letra minúscula</li>
              <li className={rules.digit ? 'text-green-600' : 'text-slate-600'}>• Ao menos um número</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium">Confirmar nova senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              autoComplete="new-password"
              required
            />
            <p className={`mt-2 text-xs ${rules.match ? 'text-green-600' : 'text-slate-600'}`}>
              {rules.match ? '• Senhas coincidem' : '• Deve ser igual à senha acima'}
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          {success ? (
            <div className="space-y-3">
              <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
                Senha redefinida com sucesso. Você já pode entrar com a nova senha.
              </div>
              <Link href="/login" className="block w-full rounded-md bg-slate-900 px-4 py-2 text-center text-white">
                Ir para o login
              </Link>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!id || !token || !rules.all || submitting}
              className="mx-auto block w-56 rounded-md bg-[#cfe2ff] px-4 py-2 text-slate-900 ring-1 ring-slate-300 disabled:opacity-60"
            >
              {submitting ? 'Salvando…' : 'Redefinir senha'}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}