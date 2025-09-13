'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '@/lib/api';

type ResetResponse = { ok: boolean };

export default function ResetPage() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get('id') ?? '';
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const valid = id && token && password.length >= 8 && /\d/.test(password) && /[A-Za-z]/.test(password) && password === confirm;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiPost<ResetResponse>('/auth/reset-password', {
        id,
        token,
        newPassword: password,
      });
      if (res.ok) {
        setMsg('Senha redefinida com sucesso! Redirecionando…');
        setTimeout(() => router.replace('/login'), 1200);
      } else {
        setMsg('Não foi possível redefinir a senha.');
      }
    } catch (e: any) {
      setMsg(e.message ?? 'Falha ao redefinir');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Definir nova senha</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="Nova senha (mín. 8, letra e número)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="Confirmar nova senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading || !valid}
          className="w-full rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Redefinindo…' : 'Redefinir senha'}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
    </main>
  );
}
