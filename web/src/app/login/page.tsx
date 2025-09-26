'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiPost, ApiError } from '@/lib/api';
import { Logo } from '@/components/logo';

type LoginResponse = {
  ok: boolean;
  // acrescente outros campos se o backend retornar mais coisas
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo className="opacity-30" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-2 text-center text-xl font-semibold">Entrar</h1>
        <p className="text-center text-sm text-slate-600">Carregando…</p>
      </div>
    </main>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams(); // 👈 agora está dentro de Suspense
  const nextPath = search.get('next') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || submitting) return;

    setSubmitting(true);
    setErrMsg(null);

    try {
      const res = await apiPost<LoginResponse, { email: string; password: string }>(
        '/auth/login',
        { email, password }
      );

      if (!res?.ok) {
        setErrMsg('Credenciais inválidas.');
        setSubmitting(false);
        return;
      }

      router.replace(nextPath);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrMsg(err.message || (err.status === 401 ? 'Credenciais inválidas.' : 'Falha no login.'));
      } else if (err instanceof Error) {
        setErrMsg(err.message);
      } else {
        setErrMsg('Erro desconhecido ao efetuar login.');
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo className="opacity-30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-4 text-center text-xl font-semibold">Entrar</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border px-3 py-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            disabled={submitting || !email || !password}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="flex justify-between text-sm">
            <Link href="/forgot" className="text-blue-700 hover:underline">
              Esqueci minha senha
            </Link>
            <Link href="/register" className="text-blue-700 hover:underline">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
