'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

type LoginResponse = { access_token?: string; token?: string };

function isErrorWithMessage(e: unknown): e is { message: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    typeof (e as { message: unknown }).message === 'string'
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('rafaelhernandez2006@hotmail.com');
  const [password, setPassword] = useState('Rafaisa_123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Normalização para evitar "Credenciais inválidas" por detalhe de formatação
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      };

      // Importante: withAuth:false para NÃO enviar Authorization no login
      const resp = await apiPost<LoginResponse>('/auth/login', payload, { withAuth: false });

      const token = resp.access_token ?? resp.token;
      if (!token) throw new Error('Resposta sem token.');

      // Persistir sessão
      localStorage.setItem('token', token);

      // Redirecionar
      router.replace('/');
    } catch (err: unknown) {
      let message = 'Falha ao autenticar.';
      if (isErrorWithMessage(err)) {
        message = err.message;
      } else {
        try {
          message = JSON.stringify(err);
        } catch {
          message = String(err);
        }
      }

      if (/credenciais inválidas/i.test(message)) {
        message = 'Credenciais inválidas. Verifique e tente novamente.';
      }

      setError(message);

      // Log de depuração no console do navegador (útil para ver status/body)
      console.debug('[login] erro:', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <p className="mt-2 text-slate-600">Acesse sua conta ClinID</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(ev) => setEmail(ev.currentTarget.value)}
            required
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Senha</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={password}
            onChange={(ev) => setPassword(ev.currentTarget.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
