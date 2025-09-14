'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';

type ResetBody = {
  id: string;
  token: string;
  newPassword: string;
};

function ResetForm() {
  const params = useSearchParams();
  const id = params?.get('id') ?? '';
  const token = params?.get('token') ?? '';

  const [newPassword, setNewPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const missingParams = !id || !token;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (missingParams) return;

    setLoading(true);
    setOk(null);
    setErr(null);

    try {
      const body: ResetBody = { id, token, newPassword };
      await apiPost('/auth/reset-password', body);
      setOk('Senha redefinida com sucesso! Você já pode fazer login.');
      setNewPassword('');
    } catch {
      setErr('Falha ao redefinir senha. Verifique o link e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-2 text-2xl font-semibold">Redefinir senha</h1>
      <p className="mb-6 text-sm text-slate-600">
        Informe sua nova senha. Se o link tiver expirado, solicite um novo.
      </p>

      {missingParams && (
        <div className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Link incompleto. Abra o link de redefinição enviado por e-mail.
        </div>
      )}

      {ok && (
        <div className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {ok}{' '}
          <Link className="underline" href="/login">
            Ir para login
          </Link>
        </div>
      )}

      {err && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-700">Nova senha</span>
          <input
            type="password"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
            disabled={missingParams || loading}
          />
        </label>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={missingParams || loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Redefinir'}
          </button>

          <Link
            href="/login"
            className="rounded-md border px-4 py-2 text-slate-800"
          >
            Voltar ao login
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function ResetPage() {
  // Colocar o hook de busca de querystring atrás de Suspense evita
  // o erro: "useSearchParams() should be wrapped in a suspense boundary".
  return (
    <Suspense fallback={<main className="p-6">Carregando…</main>}>
      <ResetForm />
    </Suspense>
  );
}
