// web/src/app/qr/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
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

export default function QrManagerPage() {
  const { ready } = useRequireAuth(); // garante que só carrega quando autenticado

  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Base pública para montar a URL do slug
  const publicBase = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin;
    return process.env.NEXT_PUBLIC_WEB_BASE_URL || 'http://localhost:3000';
  }, []);

  const publicUrl = link ? `${publicBase}/p/${link.slug}` : '';

  async function load() {
    setErr(null);
    try {
      const res = await apiGet<PublicLink | null>('/me/public-link');
      const data = unwrap<PublicLink | null>(res);
      setLink(data);
    } catch {
      setErr('Falha ao carregar link público. Faça login novamente.');
      setLink(null);
    }
  }

  async function generate() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiPost<PublicLink | null>('/me/public-link', {});
      const data = unwrap<PublicLink | null>(res);
      setLink(data);
    } catch {
      setErr('Erro ao gerar link.');
    } finally {
      setLoading(false);
    }
  }

  // “Regerar” = criar um novo (o backend deve invalidar o antigo)
  async function regenerate() {
    setLoading(true);
    setErr(null);
    try {
      const res = await apiPost<PublicLink | null>('/me/public-link', {});
      const data = unwrap<PublicLink | null>(res);
      setLink(data);
    } catch {
      setErr('Erro ao regerar link.');
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    if (!link?.id) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await apiPatch<PublicLink | null>(`/me/public-link/${link.id}/revoke`, {});
      const data = unwrap<PublicLink | null>(res);
      setLink(data);
    } catch {
      setErr('Erro ao revogar link.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready]);

  if (!ready) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <p>Carregando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">QR público de emergência</h1>
      <p className="mb-6 text-sm text-slate-600">
        Gere um link público (protegido por PIN) para ser acessado via QR Code.
      </p>

      {err && (
        <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-rose-700">
          {err}
        </div>
      )}

      <div className="mb-6 rounded-lg border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Status:</span>
          <span
            className={
              'rounded px-2 py-0.5 text-xs ' +
              (link?.status === 'active'
                ? 'bg-green-100 text-green-700'
                : link
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-500')
            }
          >
            {link ? (link.status === 'active' ? 'ativo' : 'revogado') : '—'}
          </span>
        </div>

        <div className="mt-3 text-sm">
          <div className="mb-1 text-slate-500">Slug:</div>
          <div className="font-mono">{link?.slug ?? '—'}</div>
        </div>

        <div className="mt-3 text-sm">
          <div className="mb-1 text-slate-500">URL pública:</div>
          {link ? (
            <a
              href={publicUrl}
              className="font-mono text-blue-600 underline"
              target="_blank"
              rel="noreferrer"
            >
              {publicUrl}
            </a>
          ) : (
            <span>—</span>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          A página pública é <code>/p/&lt;slug&gt;</code>. A impressão do cartão está em{' '}
          <code>/qr/print</code>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {!link && (
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Gerando…' : 'Gerar'}
          </button>
        )}

        {link?.status === 'active' && (
          <>
            <button
              onClick={regenerate}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {loading ? 'Regerando…' : 'Regerar'}
            </button>

            <button
              onClick={revoke}
              disabled={loading}
              className="rounded-lg bg-rose-600 px-4 py-2 text-white disabled:opacity-60"
            >
              {loading ? 'Revogando…' : 'Revogar'}
            </button>

            <Link
              href="/qr/print"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Imprimir
            </Link>

            <Link
              href={publicUrl || '#'}
              target="_blank"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Abrir público
            </Link>
          </>
        )}

        {link && link.status === 'revoked' && (
          <button
            onClick={generate}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Gerando…' : 'Gerar novo'}
          </button>
        )}
      </div>
    </main>
  );
}
