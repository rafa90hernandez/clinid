'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import ResetForm from './reset-form';

function LoadingFallback() {
  const common = useTranslations('common');

  return (
    <main className="p-6">
      {common('loading')}
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetForm />
    </Suspense>
  );
}