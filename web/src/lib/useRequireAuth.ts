// web/src/lib/useRequireAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOKEN_STORAGE_KEY } from './api';

/**
 * Hook simples de proteção de rota:
 * - Se não houver token no localStorage, redireciona para /login
 * - Retorna { loading } para você exibir um skeleton/spinner enquanto decide
 */
export function useRequireAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem(TOKEN_STORAGE_KEY)
        : null;

      if (!token) {
        router.replace('/login');
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { loading };
}
