'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

type ForgotResponseLoose =
  | { ok: boolean; resetUrl?: string }               // caso a API retorne resetUrl em dev
  | { ok: boolean }                                  // caso padrão
  | Record<string, unknown>;                         // fallback

// type guard: wrapper { ok, status, data, response }
function isWrapped<T>(x: unknown): x is {
  ok: boolean;
  status: number;
  data: T | null;
  response: Response;
} {
  return (
    typeof x === 'object' &&
    x !== null &&
    'ok' in x &&
    'status' in x &&
    'data' in x &&
    'response' in x
  );
}

// extrai resetUrl se existir de forma segura
function pickResetUrl(x: unknown): string | null {
  if (typeof x === 'object' && x !== null && 'resetUrl' in x) {
    const val = (x as { resetUrl?: unknown }).resetUrl;
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return null;
}

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      // Chama a API correta
      const res = await apiPost<ForgotResponseLoose>('/accounts/forgot', { email: email.trim() });

      // Suporta retorno embrulhado { ok, status, data, response } ou direto
      const data = isWrapped<ForgotResponseLoose>(res) ? res.data : res;
      const resetUrl = pickResetUrl(data);

      setMsg(
        resetUrl
          ? `Se o e-mail existir, enviaremos as instruções. (DEV: ${resetUrl})`
          : 'Se o e-mail existir, enviaremos as instruções.'
      );
    } catch {
      // mensagem genérica sem vazar se o e-mail existe
      setErr('Não foi possível enviar as instruções agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#E8ECFF] text-slate-900">
      <div className="mx-auto max-w-sm px-6 py-10">
        <h1 className="mb-6 text-center text-xl font-semibold">Esqueci minha senha</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">E-mail cadastrado</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          {msg && <p className="text-sm text-green-700">{msg}</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar instruções'}
          </button>

          <p className="pt-2 text-center text-xs text-slate-600">
            <Link href="/login" className="underline">Voltar ao login</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
