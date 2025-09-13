// web/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { setToken } from '@/lib/auth';

type LoginResponse = { access_token: string };

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
      const res = await apiPost<LoginResponse>('/auth/login', { email, password });
      setToken(res.access_token);
      router.replace('/qr');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha no login';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Entrar</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full rounded border px-3 py-2"
          placeholder="senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>

        {err && <p className="text-sm text-red-600">{err}</p>}
      </form>

      <div className="mt-3 flex items-center justify-between text-sm">
        <Link href="/forgot" className="text-sky-700 hover:underline">
          Esqueci minha senha
        </Link>
        <Link href="/register" className="text-slate-700 hover:underline">
          Criar conta
        </Link>
      </div>
    </main>
  );
}
