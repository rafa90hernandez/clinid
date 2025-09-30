'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiDelete } from '@/lib/api';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);

    if (!password.trim()) {
      setError('Digite sua senha para confirmar.');
      return;
    }

    try {
      setSubmitting(true);

      // CORREÇÃO AQUI: Passando o body como segundo argumento e o extra como terceiro
      await apiDelete<unknown>(
        '/accounts', // Primeiro argumento: path
        { confirmLoginPassword: password }, // Segundo argumento: body (será stringificado automaticamente pelo apiRequest)
        {
          // Terceiro argumento: extra (ExtraInit)
          // O Content-Type será adicionado automaticamente pelo apiRequest,
          // mas você pode deixá-lo aqui para ser explícito ou para sobrescrever
          headers: {
            'Content-Type': 'application/json',
          },
          withAuth: true,
        },
      );
      setMsg('Conta excluída com sucesso. Você será redirecionado.');
      setTimeout(() => router.replace('/login'), 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Falha ao excluir a conta.');
      } else {
        setError('Falha ao excluir a conta.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold mb-4">Excluir conta</h1>

      <p className="text-sm text-gray-600 mb-4">
        Esta ação é irreversível. Confirme sua senha para prosseguir.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded bg-red-50 text-red-700 px-3 py-2 text-sm">
            {error}
          </div>
        )}
        {msg && (
          <div className="rounded bg-green-50 text-green-700 px-3 py-2 text-sm">
            {msg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-red-600 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? 'Excluindo…' : 'Excluir conta'}
        </button>
      </form>
    </main>
  );
}