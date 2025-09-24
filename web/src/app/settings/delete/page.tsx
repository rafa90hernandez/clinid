'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiDelete } from '@/lib/api';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!password || password.length < 6) {
      setMsg('Informe sua senha (mínimo 6 caracteres).');
      return;
    }

    setMsg(null);
    setLoading(true);

    try {
      // ✅ Endpoint correto do backend: DELETE /accounts
      await apiDelete<unknown>('/accounts', { confirmLoginPassword: password });

      setMsg('Conta excluída com sucesso. Você será redirecionado.');
      // opcional: limpar qualquer token legado do localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setTimeout(() => router.replace('/login'), 1500);
    } catch (e: unknown) {
      // se for 401, provavelmente sessão expirou
      if (typeof e === 'object' && e && 'status' in e && (e as { status?: number }).status === 401) {
        setMsg('Sessão expirada. Faça login novamente.');
        setTimeout(() => router.replace('/login'), 1200);
        return;
      }
      const errMsg = e instanceof Error ? e.message : 'Falha ao excluir conta';
      setMsg(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-3 text-lg font-semibold">Excluir minha conta</h1>
      <p className="mb-3 text-sm text-slate-600">
        Esta ação é irreversível. Seus links públicos serão revogados e o acesso será bloqueado.
      </p>

      <label className="block text-sm">
        <span className="text-slate-600">Confirme sua senha</span>
        <input
          type="password"
          className="mt-1 w-full rounded border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sua senha de login"
          autoComplete="current-password"
        />
      </label>

      <button
        onClick={onDelete}
        disabled={loading || password.length < 6}
        className="mt-4 w-full rounded bg-red-600 py-2 text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Excluindo…' : 'Excluir conta'}
      </button>

      {msg && (
        <p
          className={`mt-3 text-sm ${
            msg.toLowerCase().includes('sucesso') ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {msg}
        </p>
      )}
    </main>
  );
}
