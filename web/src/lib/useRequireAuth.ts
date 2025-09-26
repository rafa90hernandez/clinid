// web/src/lib/useRequireAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { apiGet, ApiError } from '@/lib/api';

export type Me = {
  id: string;
  email: string;
  role?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  createdAt?: string;
};

type UseRequireAuthResult = {
  me: Me | null;
  ready: boolean; // true quando já sabemos se há sessão (com ou sem usuário)
};

export function useRequireAuth(): UseRequireAuthResult {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // apiGet<Me> retorna o JSON tipado diretamente (sem .data)
        const meRes = await apiGet<Me>('/accounts/me');
        if (cancelled) return;
        setMe(meRes ?? null);
      } catch (err: unknown) {
        // Se seu api.ts já redireciona em 401, aqui só marcamos como pronto
        if (err instanceof ApiError) {
          if (err.status === 401) {
            if (!cancelled) setMe(null);
          } else {
            // Outros erros de API: considere logar/telemetria
            if (!cancelled) setMe(null);
          }
        } else {
          if (!cancelled) setMe(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { me, ready };
}

export default useRequireAuth;
