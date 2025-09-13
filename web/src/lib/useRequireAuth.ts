// web/src/lib/useRequireAuth.ts
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from './auth';

export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) router.replace(redirectTo);
  }, [router, redirectTo]);
}
