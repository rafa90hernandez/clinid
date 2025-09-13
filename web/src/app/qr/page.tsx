'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';

type PublicLink = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt: string | null;
} | null;

export default function QrManagerPage() {
  const [link, setLink] = useState<PublicLink>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await apiGet<PublicLink>('/me/public-link', { auth: true });
      setLink(data);
    } catch (e) {
      setErr('Falha ao carregar link público. Faça login novamente.');
      setLink(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createOrRegenerate() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiPost<NonNullable<PublicLink>>('/me/public-link', {}, { auth: true });
      setLink(data);
    } catch (e) {
      setErr('Erro ao gerar link.');
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    if (!link?.id) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await apiPost<NonNullable<PublicLink>>(
        `/me/public-link/${link.id}/revoke`,
        {},
        { auth: true, method: 'PATCH' }
      );
      setLink(data);
    } catch (e) {
      setErr('Erro ao revogar link.');
    } finally {
      setLoading(false);
    }
  }

  const fullPublicUrl = link?.slug ? `/p/${link.slug}` : '';

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">QR público de emergência</h1>
      <p className="text-sm text-slate-600">
        Gere um link público (protegido por PIN) para ser acessado via QR Code.
      </p>

      {err && (
        <div className="rounded-md bg-red-50 text-red-700 p-3 text-sm">
          {err}
        </div>
      )}

      <section className="rounded-lg border p-4 bg-white space-y-3">
        <div className="text-sm">
          <div>
            <span className="font-medium">Status:</span>{' '}
            {link ? link.status : '—'}
          </div>
          <div>
            <span className="font-medium">Slug:</span>{' '}
            {link?.slug ?? '—'}
          </div>
          <div className="break-all">
            <span className="font-medium">URL pública:</span>{' '}
            {link?.slug ? (
              <Link href={fullPublicUrl} className="text-blue-600 underline">
                {fullPublicUrl}
              </Link>
            ) : (
              '—'
            )}
          </div>
          <p className="text-slate-500 mt-2 text-xs">
            A <b>página pública</b> correta é <code>/p/&lt;slug&gt;</code>. A impressão do cartão está em <code>/qr/print</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={createOrRegenerate}
            disabled={loading}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {link ? 'Regerar' : 'Gerar'}
          </button>

          <button
            onClick={revoke}
            disabled={loading || !link || link.status !== 'active'}
            className="px-3 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            Revogar
          </button>

          <Link
            href="/qr/print"
            className="px-3 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-900"
          >
            Imprimir
          </Link>

          {link?.slug && (
            <Link
              href={fullPublicUrl}
              className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Abrir página pública
            </Link>
          )}
        </div>
      </section>

      <section className="text-sm text-slate-600">
        <ul className="list-disc pl-5 space-y-1">
          <li>Defina um PIN em <b>Configurar PIN</b> (ou via API <code>/me/pin</code>).</li>
          <li>Gere o link e escaneie o QR do cartão (ou clique em “Abrir página pública”).</li>
          <li>Na página <code>/p/&lt;slug&gt;</code> insira o PIN para visualizar seus dados.</li>
        </ul>
      </section>
    </main>
  );
}
