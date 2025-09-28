// web/src/lib/useRequireAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TOKEN_STORAGE_KEY } from './api';

/**
 * Garante que a página só seja acessada autenticado.
 * Redireciona para /login se não houver token local.
 *
 * Retorna { loading } (true enquanto decide/redirect).
 */
export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Evita loop no /login
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    const hasWindow = typeof window !== 'undefined';
    const token = hasWindow ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

    if (!token) {
      // sem token -> manda para login
      router.replace('/login');
      return;
    }

    // ok, segue
    setLoading(false);
  }, [pathname, router]);

  return { loading };
}
