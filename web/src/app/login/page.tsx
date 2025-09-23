'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const base =
        process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim().length > 0
          ? process.env.NEXT_PUBLIC_API_URL
          : 'http://localhost:3001';

      const res = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANTE: para receber/gravar o cookie httpOnly
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.ok) {
        // opcional: a API também retorna { access_token } no body
        const data = (await res.json().catch(() => null)) as { access_token?: string } | null;
        if (data?.access_token && typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access_token);
        }
        router.replace('/'); // vai para o dashboard
        return;
      }

      if (res.status === 401) {
        setErrorMsg('Credenciais inválidas');
        return;
      }

      const { message } = (await res.json().catch(() => ({ message: 'Falha no login' }))) as {
        message?: string;
      };
      setErrorMsg(message ?? 'Falha no login');
    } catch {
      setErrorMsg('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#E8ECFF] text-slate-900">
      <div className="mx-auto max-w-sm px-6 py-10">
        <h1 className="mb-6 text-center text-xl font-semibold">Entrar</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">E-mail</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Senha</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="pt-2 text-center text-xs text-slate-600">
            Não tem conta? <Link href="/register" className="underline">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
