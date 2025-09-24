import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="p-6" role="main" aria-labelledby="nf-title">
      <h1 id="nf-title" className="text-xl font-semibold">
        404 — Página não encontrada
      </h1>
      <p className="mt-2 text-slate-600">
        O recurso solicitado não existe ou foi movido.
      </p>
      <Link href="/" className="mt-4 inline-block underline">
        Voltar para o início
      </Link>
    </main>
  );
}
