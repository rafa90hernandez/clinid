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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && slug) {
      const cached = sessionStorage.getItem(`public_pin_for_${slug}`) || '';
      setPin(cached);
    }
  }, [slug]);

  const publicBase =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_WEB_BASE_URL || 'http://localhost:3000';

  const publicUrl = useMemo(() => `${publicBase}/public-access/${slug}`, [publicBase, slug]);

  async function handleCopy() {
    if (!publicUrl || typeof navigator === 'undefined') return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#E6EBFF] via-[#EEF4FF] to-[#DCE8FF] px-5 py-6 pb-32 text-slate-900">
      <BackgroundDecor />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5277C8]">
            ClinID
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            QR Code de Acesso
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Compartilhe este QR Code apenas em situações de emergência.
          </p>
        </header>

        <div className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-300/30 backdrop-blur">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-[#7CA7FF] to-[#A9C4FF] p-5 text-white shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white/85">Acesso público</p>
                <h2 className="mt-1 text-2xl font-black leading-tight">Pronto para uso</h2>
                <p className="mt-2 text-sm leading-5 text-white/80">
                  Escaneie para abrir a página pública protegida por PIN.
                </p>
              </div>

              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/20 text-3xl backdrop-blur">
                ▣
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="rounded-[2rem] bg-white p-4 shadow-lg ring-1 ring-slate-100">
              {slug ? (
                <QRCode value={publicUrl} size={224} />
              ) : (
                <div className="grid h-56 w-56 place-items-center text-sm text-slate-500">
                  Carregando QR Code...
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-[#F7F9FF] p-4 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Link público
            </p>

            <Link
              href={publicUrl}
              className="mt-3 block break-all rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-[#0A84D8] shadow-sm ring-1 ring-slate-100 hover:underline"
            >
              {publicUrl}
            </Link>

            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 rounded-2xl bg-[#CFE2FF] px-4 py-2 text-xs font-extrabold text-[#5277C8] shadow-sm ring-1 ring-[#A9C4FF] transition hover:brightness-95"
            >
              {copied ? 'Link copiado' : 'Copiar link'}
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-[#D7E3FF] bg-white p-4 text-center shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              Senha pública
            </p>

            <p className="mt-3 text-4xl font-black tracking-[0.35em] text-slate-950">
              {pin && /^\d{6}$/.test(pin) ? pin : '••••••'}
            </p>

            {!pin && (
              <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-slate-600">
                Por segurança, o PIN só aparece nesta tela após ser gerado nesta sessão. Para
                exibir novamente, confirme o PIN em{' '}
                <Link href="/qr" className="font-bold text-[#0A84D8] underline">
                  QR Code
                </Link>
                .
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              href="/qr"
              className="flex items-center justify-center rounded-2xl bg-[#E6EBFF] px-4 py-3 text-sm font-extrabold text-[#5277C8] shadow-sm ring-1 ring-[#A9C4FF] transition hover:brightness-95"
            >
              Editar PIN
            </Link>

            <Link
              href="/qr/print"
              className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#7CA7FF] to-[#38BDF8] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-300/30 transition hover:brightness-95"
            >
              Imprimir
            </Link>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#A9C4FF]/45 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <Logo className="scale-[3]" />
      </div>
    </>
  );
}