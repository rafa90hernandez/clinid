'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

type RegisterResponse = {
  id: string;
  email: string;
  createdAt: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');

  const canSubmit =
    email.length > 3 &&
    password.length >= 8 &&
    confirm === password &&
    !loading;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setErr('As senhas não conferem.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      // ✅ APENAS 1 genérico (tipo da resposta)
      await apiPost<RegisterResponse>('/auth/register', { email, password });
      router.push('/login?registered=1');
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Falha ao registrar.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-2">Criar conta</h1>
      <p className="text-sm text-slate-600 mb-6">
        Use seu e-mail corporativo.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">E-mail</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            placeholder="voce@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Senha</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-500 mt-1">
            Use letras e números para aumentar a segurança.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirmar senha
          </label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            placeholder="Repita a nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
          {confirm.length > 0 && confirm !== password && (
            <p className="text-xs text-red-700 mt-1">As senhas não conferem.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded bg-emerald-600 text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Cadastrar'}
        </button>

        {err && <p className="text-sm text-red-700 break-all">{err}</p>}
      </form>

      <p className="text-sm text-slate-600 mt-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-emerald-700 underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
