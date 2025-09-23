'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';

type Me = { sub: string; email: string };

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        await apiGet<Me>('/auth/me');
        setReady(true);
      } catch {
        localStorage.removeItem('token');
        router.replace('/login');
      }
    })();
  }, [router]);

  // ready === true quando já validou o token.
  return { ready };
}
