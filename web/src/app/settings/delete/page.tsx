'use client';

import { useState } from 'react';

import { apiDelete } from '@/lib/api';

export default function DeleteAccountPage() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    setMsg(null);
    setLoading(true);
    try {
      await apiDelete(
        '/auth/me/account',
        undefined,
        { json: { confirmLoginPassword: password } },
      );
      setMsg('Conta excluída com sucesso. Você será redirecionado.');
      localStorage.removeItem('token');
      setTimeout(() => (window.location.href = '/login'), 1500);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Falha ao excluir conta';
      setMsg(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-lg font-semibold mb-3">Excluir minha conta</h1>
      <p className="text-sm text-slate-600 mb-3">
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
        />
      </label>
      <button
        onClick={onDelete}
        disabled={loading || password.length < 6}
        className="mt-4 w-full rounded bg-red-600 hover:bg-red-700 text-white py-2 disabled:opacity-50"
      >
        {loading ? 'Excluindo…' : 'Excluir conta'}
      </button>
      {msg && (
        <p
          className={`mt-3 text-sm ${
            msg.includes('sucesso') ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {msg}
        </p>
      )}
    </main>
  );
}
