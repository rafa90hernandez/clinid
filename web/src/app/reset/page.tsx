'use client';

import { Suspense } from 'react';
import ResetForm from './reset-form';

export default function ResetPage() {
  // Colocar o hook de busca de querystring atrás de <Suspense>
  // evita o aviso: "useSearchParams() should be wrapped in a suspense boundary".
  return (
    <Suspense fallback={<main className="p-6">Carregando…</main>}>
      <ResetForm />
    </Suspense>
  );
}
