// web/src/lib/useRequireAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TOKEN_STORAGE_KEY } from './api';

/**
 * Garante que a página só seja acessada autenticado.
 * - Redireciona para /login se não houver token local.
 *
 * Retorna:
 * - loading: true enquanto decide/redirect
 * - ready: alias para !loading (mantém compatibilidade com código existente)
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
      router.replace('/login');
      return;
    }

    setLoading(false);
  }, [pathname, router]);

  // Compat: muitos lugares usam { ready }. Mantemos por enquanto.
  const ready = !loading;

  return { loading, ready };
}
