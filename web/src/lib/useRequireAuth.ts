'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiGet } from './api';

type Me = { id?: string; sub?: string; email: string };

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ⬅️ seu apiGet retorna { ok, status, data, response }
        const { data } = await apiGet<Me>('/accounts/me');

        if (cancelled) return;
        setMe(data ?? null);
        setReady(true);
      } catch {
        if (cancelled) return;
        setMe(null);
        setReady(true);

        // Evita loop quando já está em /login ou /register
        if (pathname !== '/login' && pathname !== '/register') {
          const next = encodeURIComponent(pathname || '/');
          router.replace(`/login?next=${next}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return { ready, me };
}
