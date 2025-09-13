'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type PublicLink = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string | null;
};

export default function QrPrintPage() {
  const [link, setLink] = useState<PublicLink | null>(null);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
  const token = localStorage.getItem('token') ?? '';
  const goLogin = () => {
    localStorage.removeItem('token');
    window.location.href = '/login?next=/qr/print';
  };

  if (!token) {
    goLogin();
    return;
  }

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/me/public-link`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        goLogin();
        return;
      }

      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as PublicLink | null;
      setLink(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao carregar link público');
    }
  })();
}, []);


  const viewUrl = useMemo(() => {
    if (!link?.slug) return '';
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `${origin}/q/${link.slug}`; // página pública de entrada do PIN
  }, [link?.slug]);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-lg font-semibold mb-3">Imprimir cartão de emergência</h1>

      {err && <p className="text-sm text-red-700 break-words">Erro: {err}</p>}
      {!link && !err && <p>Carregando…</p>}

      {link && link.status === 'revoked' && (
        <p className="text-sm text-red-700 mb-3">
          Este link está <b>revogado</b>. Gere um novo em <code>/qr</code> antes de imprimir.
        </p>
      )}

      {link && link.status === 'active' && (
        <>
          <div className="rounded-lg border p-4 bg-white print:border-0 print:p-0">
            <div className="flex flex-col items-center gap-3">
              {/* LOGO (coloque /public/Logo.png no projeto) */}
              <img
                src="/Logo.png"
                alt="ClinID"
                className="h-10 print:h-8"
              />

              {/* QR Code */}
              {viewUrl && (
                <div className="bg-white p-2 rounded">
                  <QRCode value={viewUrl} size={180} />
                </div>
              )}

              {/* URL em texto (útil se QR falhar) */}
              <p className="text-xs text-slate-600 break-all">
                {viewUrl}
              </p>

              {/* PIN digitado pelo usuário (aparece na impressão) */}
              <div className="w-full">
                <label className="block text-sm">
                  <span className="text-slate-600">PIN público (6 dígitos)</span>
                  <input
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    className="mt-1 w-full rounded border px-3 py-2 text-center tracking-widest text-lg"
                    placeholder="______"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </label>
                <div className="mt-2 text-center">
                  <span className="text-slate-600 text-sm">PIN:</span>{' '}
                  <span className="font-mono text-2xl">{pin || '______'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center mt-1">
                Escaneie o QR e digite o PIN para visualizar as informações clínicas.
              </p>
            </div>
          </div>

          {/* Controles (escondidos na impressão) */}
          <div className="mt-4 flex gap-2 print:hidden">
            <button
              className="w-full rounded bg-slate-200 py-2"
              onClick={() => window.history.back()}
            >
              Voltar
            </button>
            <button
              className="w-full rounded bg-emerald-600 hover:bg-emerald-700 text-white py-2"
              onClick={() => window.print()}
              disabled={!viewUrl}
            >
              Imprimir
            </button>
          </div>
        </>
      )}

      {/* CSS de impressão local à página */}
      <style jsx global>{`
        @media print {
          @page {
            size: A6 portrait;
            margin: 6mm;
          }
          body {
            background: #fff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
