'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

function ResetFormInner() {
  const router = useRouter();
  const search = useSearchParams();

  // lê id e token da query string
  const id = search.get('id') ?? '';
  const token = search.get('token') ?? '';

  const [newPassword, setNewPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const [okMsg, setOkMsg] = useState<string>('');

  const canSubmit =
    !!id && !!token && newPassword.length >= 8 && newPassword === confirm && !loading;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setErr('As senhas não conferem.');
      return;
    }
    setErr('');
    setOkMsg('');
    setLoading(true);
    try {
      // Apenas 1 genérico: tipo da resposta (não precisamos tipar a req)
      await apiPost<unknown>('/auth/reset-password', {
        id,
        token,
        newPassword,
      });
      setOkMsg('Senha redefinida com sucesso. Redirecionando para o login...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Falha ao redefinir senha.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!id || !token) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-2">Redefinir senha</h1>
        <p className="text-slate-700">
          Link inválido ou incompleto. Solicite um novo e-mail de recuperação.
        </p>
        <p className="mt-4">
          <Link href="/login" className="text-emerald-700 underline">
            Voltar ao login
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Definir nova senha</h1>
      <p className="text-sm text-slate-600 mb-6">
        Defina uma senha com no mínimo 8 caracteres.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nova senha</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirmar nova senha</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            placeholder="********"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
          {confirm.length > 0 && confirm !== newPassword && (
            <p className="text-xs text-red-700 mt-1">As senhas não conferem.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded bg-emerald-600 text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Redefinir senha'}
        </button>

        {err && <p className="text-sm text-red-700 break-all">{err}</p>}
        {okMsg && <p className="text-sm text-emerald-700">{okMsg}</p>}
      </form>

      <p className="text-sm text-slate-600 mt-6">
        Lembrou a senha?{' '}
        <Link href="/login" className="text-emerald-700 underline">
          Voltar ao login
        </Link>
      </p>
    </main>
  );
}

export default function ResetPage() {
  // ✅ Coloca o hook dentro de um Suspense boundary
  return (
    <Suspense fallback={<main className="p-6">Carregando…</main>}>
      <ResetFormInner />
    </Suspense>
  );
}
