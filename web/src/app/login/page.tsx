// web/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, ApiError, TOKEN_STORAGE_KEY } from '@/lib/api';

type LoginResponse = {
  access_token?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const data = await apiPost<LoginResponse>(
        '/auth/login',
        { email: email.trim(), password },
        { withAuth: false },
      );

      // Se a API também coloca cookie httpOnly, ok; mas seguimos salvando o token
      if (data?.access_token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      }

      router.replace('/');
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          setErr(e.message || 'Credenciais inválidas');
        } else {
          setErr(e.message || 'Falha ao entrar. Tente novamente.');
        }
      } else {
        setErr('Falha ao entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {err && <p className="mt-3 text-red-700">{err}</p>}
      </form>
    </main>
  );
}
