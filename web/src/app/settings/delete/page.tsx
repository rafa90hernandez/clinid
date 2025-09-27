// web/src/app/settings/delete/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiDelete, ApiError } from '@/lib/api';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setLoading(true);

    try {
      await apiDelete<unknown>('/accounts', {
        // basta usar json; o helper define Content-Type e inclui credenciais
        json: { confirmLoginPassword: password },
        withAuth: true,
      });

      setMsg('Conta excluída com sucesso. Você será redirecionado.');
      // pequeno delay só para o usuário ler a mensagem
      setTimeout(() => router.replace('/'), 1200);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setErr('Sessão expirada. Faça login novamente.');
          router.replace('/login');
          return;
        }
        setErr(e.message || 'Falha ao excluir a conta.');
      } else {
        setErr('Falha ao excluir a conta.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Excluir Conta</h1>
      <p className="text-sm text-gray-600 mb-4">
        Esta ação é irreversível. Confirme sua senha para prosseguir.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Senha de login</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded px-4 py-2"
        >
          {loading ? 'Excluindo...' : 'Excluir minha conta'}
        </button>
      </form>

      {msg && <p className="mt-4 text-green-700">{msg}</p>}
      {err && <p className="mt-4 text-red-700">{err}</p>}
    </main>
  );
}
