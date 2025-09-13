'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useRequireAuth() {
  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login'); // só manda pro login quando NÃO autenticado
    }
    // ✅ não redireciona para /qr em hipótese alguma
  }, [router]);
}
