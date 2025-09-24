'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setErrorMsg(null);
    setLoading(true);

    try {
      // Faz login (cookie httpOnly vem da API)
      await apiPost<unknown>('/accounts/login', {
        email: email.trim(),
        password,
      });
      router.replace('/'); // dashboard
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível conectar ao servidor.';
      setErrorMsg(msg || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#E6EBFF] text-slate-900">
      <div className="mx-auto w-full max-w-xs px-6 py-8">
        {/* Logo grande */}
        <div className="mt-2 mb-10 flex w-full justify-center">
          <div className="rounded-2xl bg-white/80 px-6 py-4 shadow-md">
            <Logo />
          </div>
        </div>

        {/* Acesso via QR Code */}
        <div className="mb-8 flex w-full justify-center">
          <Link
            href="/qr"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm hover:bg-slate-50"
            title="Acesso via QR Code"
          >
            <span aria-hidden className="text-[16px]">▣▣</span>
            <div className="leading-4 text-left">
              <div className="font-medium">Acesso via</div>
              <div>QR Code</div>
            </div>
          </Link>
        </div>

        {/* divisor fino */}
        <div className="mx-auto mb-6 h-[2px] w-24 bg-slate-700/80" />

        {/* Formulário */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">E-Mail</label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Senha</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          {/* Links auxiliares */}
          <div className="mt-1 text-center text-[11px] leading-5 text-slate-600">
            Ainda não possui cadastro?{' '}
            <Link href="/register" className="underline">
              Cadastre-se aqui
            </Link>
            <br />
            <Link href="/forgot" className="underline">
              Recuperar Senha
            </Link>
          </div>

          {/* Erro */}
          {errorMsg && (
            <p className="text-center text-sm text-red-600">{errorMsg}</p>
          )}

          {/* Botão Entrar */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 w-full rounded-lg bg-[#CFE2FF] px-4 py-2 text-slate-900 ring-1 ring-slate-300 transition disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
