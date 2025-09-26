'use client';

import { useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';
import BottomNav from '@/components/BottomNav';

export default function PublicQrPage() {
  const { slug } = useParams<{ slug: string }>() || { slug: '' };

  const [pin, setPin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && slug) { // Adicionado 'slug' como dependência
      // Recupera o PIN usando a chave específica para o slug
      const cached = sessionStorage.getItem(`public_pin_for_${slug}`) || '';
      setPin(cached);
    }
  }, [slug]); // Ação de useEffect deve ser re-executada se o slug mudar

  // Base para montar a URL pública
  const publicBase =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_WEB_BASE_URL || 'http://localhost:3000';

  // A URL pública agora aponta para a rota 'public-access'
  const publicUrl = useMemo(() => `${publicBase}/public-access/${slug}`, [publicBase, slug]);

  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      {/* marca d’água */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo className="opacity-30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-5 text-center text-base font-semibold">QR Code de Acesso</h1>

        {/* QR Code que aponta para a URL de acesso público */}
        <div className="mx-auto w-fit rounded-xl bg-white p-3 shadow-sm">
          {slug ? <QRCode value={publicUrl} size={224} /> : <p>Carregando QR Code...</p>}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-medium">Link de acesso público:</p>
          {/* Link exibido, apontando para a URL de acesso público */}
          <Link
            href={publicUrl}

            className="mt-2 block break-all text-xs text-blue-600 hover:underline"
          >
            {publicUrl}
          </Link>

          <p className="mt-4 text-sm font-medium">Senha pública:</p>
          <p className="mt-2 text-3xl font-semibold tracking-widest">
            {pin && /^\d{6}$/.test(pin) ? pin : '••••••'}
          </p>

          {/* Quando o PIN não estiver disponível (ex.: refresh da página),
              mostra uma nota sutil para o usuário. */}
          {!pin && (
            <p className="mt-2 text-xs text-slate-600">
              Gere ou confirme o PIN em <Link href="/qr" className="font-medium text-blue-600 hover:underline">/qr</Link> para exibí-lo aqui.
            </p>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/qr/print"
            className="rounded-md bg-slate-200 px-5 py-2 text-slate-900 ring-1 ring-slate-300 hover:bg-slate-300"
          >
            Imprimir
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
