'use client';

import Link from 'next/link';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  const message = error?.message?.trim() || 'Algo deu errado. Tente novamente.';

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Ocorreu um erro</h1>

      <p className="mt-2 text-sm text-slate-700 break-words">{message}</p>

      {error?.digest && (
        <p className="mt-1 text-xs text-slate-500">
          Código do erro: <code className="rounded bg-slate-100 px-1 py-0.5">{error.digest}</code>
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-slate-900 px-4 py-2 text-white"
        >
          Tentar novamente
        </button>

        <Link href="/" className="rounded-md border px-4 py-2 text-slate-800">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
