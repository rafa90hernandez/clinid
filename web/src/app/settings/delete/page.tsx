'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiDelete, ApiError } from '@/lib/api';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!password || submitting) return;

    setSubmitting(true);
    setErr(null);
    setMsg(null);

    try {
      await apiDelete<unknown>('/accounts', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmLoginPassword: password }),
      });

      setMsg('Conta excluída com sucesso. Você será redirecionado.');
      setTimeout(() => {
        router.replace('/login');
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErr(error.message ?? `Falha ao excluir a conta (HTTP ${error.status}).`);
      } else if (error instanceof Error) {
        setErr(error.message);
      } else {
        setErr('Falha ao excluir a conta.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Excluir conta</h1>
      <p className="mt-2 text-sm text-slate-600">
        Esta ação é <strong>irreversível</strong>. Confirme sua senha para prosseguir.
      </p>

      <form onSubmit={onDelete} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Senha de login
          </label>
          <input
            id="password"
            type="password"
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!password || submitting}
            className="rounded-md bg-red-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {submitting ? 'Excluindo…' : 'Excluir conta'}
          </button>
          <Link href="/settings" className="rounded-md border px-4 py-2">
            Cancelar
          </Link>
        </div>
      </form>

      <hr className="my-6" />
      <p className="text-xs text-slate-500">
        Dica: se preferir, você pode desativar sua conta ao invés de excluir permanentemente.
      </p>
    </main>
  );
}
