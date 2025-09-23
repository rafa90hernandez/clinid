'use client';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Ocorreu um erro</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error?.message ?? 'Tente novamente.'}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-slate-900 px-4 py-2 text-white"
        >
          Tentar novamente
        </button>
          <Link href="/" className="rounded-md border px-4 py-2">
            Ir para o início
          </Link>
      </div>
    </main>
  );
}
