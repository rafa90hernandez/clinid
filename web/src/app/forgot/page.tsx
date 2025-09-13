// web/src/app/forgot/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

type ForgotResponse = { ok: boolean; resetUrl?: string };

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiPost<ForgotResponse>('/auth/forgot-password', { email });
      // Em DEV a API retorna resetUrl para facilitar testes
      setMsg(
        res.resetUrl
          ? `Enviamos as instruções. (DEV: ${res.resetUrl})`
          : 'Se o e-mail existir, enviaremos as instruções.'
      );
    } catch {
      // Evita vazar se o email existe
      setMsg('Se o e-mail existir, enviaremos as instruções.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Recuperar senha</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Seu e-mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-sky-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Enviando…' : 'Enviar link de redefinição'}
        </button>
      </form>

      {msg && <p className="mt-3 text-sm text-slate-700 break-words">{msg}</p>}

      <p className="mt-4 text-sm">
        <Link href="/login" className="text-slate-700 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}
