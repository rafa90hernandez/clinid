'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased p-6">
        <h2 className="text-xl font-semibold">Ops! Algo deu errado.</h2>
        <p className="mt-2 text-slate-600">
          {error?.message || 'Erro inesperado.'}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-md bg-slate-900 px-4 py-2 text-white"
          >
            Tentar novamente
          </button>
          <Link href="/" className="rounded-md border px-4 py-2">
            Ir para o início
          </Link>
        </div>
      </body>
    </html>
  );
}
