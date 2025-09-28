// web/src/lib/useRequireAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOKEN_STORAGE_KEY } from './api';

/**
 * Hook de proteção de rota:
 * - Se NÃO houver token no localStorage, redireciona para /login
 * - Retorna { loading, ready }:
 *    - loading: true enquanto decide/redirect
 *    - ready:   !loading (útil para telas que aguardam o gate)
 */
export function useRequireAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Garante execução apenas no cliente
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      // sem token => envia para login
      router.replace('/login');
      // não marcamos loading=false aqui para evitar flicker de conteúdo protegido
      return;
    }

    // com token => liberado
    setLoading(false);
  }, [router]);

  return { loading, ready: !loading };
}
