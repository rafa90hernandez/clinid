// web/src/lib/useRequireAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === '/login') {
      setLoading(false);
      return;
    }

    const hasWindow = typeof window !== 'undefined';
    const loggedIn = hasWindow ? localStorage.getItem('logged_in') : null;

    if (!loggedIn) {
      router.replace('/login');
      return;
    }

    setLoading(false);
  }, [pathname, router]);

  const ready = !loading;

  return { loading, ready };
}