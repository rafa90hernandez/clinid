'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { apiPost, ApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // impede POST nativo para /login
    setErr(null);
    setLoading(true);
    try {
      // Chama a API via rewrite: /api/accounts/login -> BACKEND/accounts/login
      await apiPost('/accounts/login', { email, password });
      // sucesso: redireciona
      router.replace('/');
    } catch (error) {
      if (error instanceof ApiError) {
        setErr(error.message || 'Falha ao autenticar.');
      } else if (error instanceof Error) {
        setErr(error.message);
      } else {
        setErr('Erro desconhecido ao autenticar.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Entrar</h1>

        {err && (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </p>
        )}

        <form onSubmit={onSubmit} className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4">
            <label className="mb-1 block text-sm">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm">Senha</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/forgot" className="text-blue-600 hover:underline">
              Esqueci minha senha
            </Link>
            <Link href="/register" className="text-blue-600 hover:underline">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
