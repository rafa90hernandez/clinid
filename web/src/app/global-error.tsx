'use client';

import Link from 'next/link';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const message = error?.message?.trim() || 'Erro inesperado.';

  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-slate-50 p-6 text-slate-900 antialiased">
        <main role="alert">
          <h2 className="text-xl font-semibold">Ops! Algo deu errado.</h2>

          <p className="mt-2 text-slate-700 break-words">{message}</p>

          {error?.digest && (
            <p className="mt-1 text-xs text-slate-500">
              Código do erro:{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5">{error.digest}</code>
            </p>
          )}

          <div className="mt-4 flex gap-3">
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
      </body>
    </html>
  );
}
