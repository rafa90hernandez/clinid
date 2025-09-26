'use client';

import { useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { apiGet } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

type PublicLink = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt: string | null;
};

// Aceita tanto “puro” quanto “envelopado”
type ApiBox<T> = { ok: boolean; status: number; data: T | null; response: Response };
function unwrap<T>(res: T | ApiBox<T>): T | null {
  if (res && typeof res === 'object' && 'ok' in res && 'data' in res) {
    return (res as ApiBox<T>).data ?? null;
  }
  return (res as T) ?? null;
}

export default function PrintEmergencyCardPage() {
  // garante que o usuário está logado antes de buscar dados
  const { ready } = useRequireAuth();

  const [link, setLink] = useState<PublicLink | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // origem do site para montar a URL pública
  const WEB_ORIGIN = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
    return (process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
  }, []);

  useEffect(() => {
    if (!ready) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await apiGet<PublicLink | null>('/me/public-link');
        const data = unwrap<PublicLink | null>(res);
        setLink(data);
      } catch {
        setErr('Erro ao carregar link público. Faça login novamente.');
        setLink(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  function handlePrint() {
    if (typeof window !== 'undefined') window.print();
  }

  if (!ready || loading) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Imprimir cartão de emergência</h1>
        <p className="mt-2 text-sm text-slate-600">Carregando…</p>
      </main>
    );
  }

  if (err) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Imprimir cartão de emergência</h1>
        <p className="mt-3 text-sm text-red-600">{err}</p>
        <div className="mt-6">
          <Link href="/qr" className="rounded-md border px-4 py-2 text-slate-800">
            Voltar ao QR
          </Link>
        </div>
      </main>
    );
  }

  if (!link) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Imprimir cartão de emergência</h1>
        <p className="mt-3 text-sm">
          Você ainda não possui link público ativo. Gere em{' '}
          <Link className="underline" href="/qr">
            /qr
          </Link>
          .
        </p>
      </main>
    );
  }

  const publicUrl = `${WEB_ORIGIN}/p/${link.slug}`;

  return (
    <main className="p-6">
      {/* Barra superior (oculta na impressão) */}
      <div className="no-print mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">QR Code de Acesso</h1>
        <div className="flex gap-3">
          <Link href="/qr" className="rounded-md border px-4 py-2 text-slate-800">
            Voltar
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-slate-900 px-4 py-2 text-white"
          >
            Imprimir
          </button>
        </div>
      </div>

      {/* Cartão (pensado para caber bem na impressão) */}
      <section
        className="card mx-auto w-[360px] max-w-full rounded-2xl bg-white p-5 shadow-md print:w-[320px]"
        aria-label="Cartão de emergência"
      >
        <div className="mb-3 flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-xs leading-tight text-slate-500">+ClinID</p>
            <p className="text-[11px] leading-tight text-slate-500">Soluções emergenciais</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="rounded-xl border p-3">
            <QRCode value={publicUrl} size={168} />
          </div>

          <div className="mt-4 w-full text-center">
            <p className="text-xs text-slate-600">Acesso público (protegido por PIN)</p>
            <p className="mt-1 break-all text-sm font-medium">{publicUrl}</p>
          </div>

          {/* Por segurança, não exibimos o PIN aqui. */}
          <p className="mt-3 text-xs text-slate-500">
            Para visualizar, acesse o link e informe seu PIN cadastrado.
          </p>
        </div>
      </section>

      {/* CSS específico de impressão */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #00000020;
          }
        }
      `}</style>
    </main>
  );
}
