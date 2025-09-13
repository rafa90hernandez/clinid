'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type PublicLink = {
  id: string;
  slug: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string | null;
};

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/80 text-white px-3 py-2 text-sm shadow">
      {msg}{' '}
      <button onClick={onClose} className="underline ml-2">
        ok
      </button>
    </div>
  );
}

export default function QrPage() {
  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const token = (typeof window !== 'undefined' && localStorage.getItem('token')) || '';

  const needLogin = () => {
    localStorage.removeItem('token');
    window.location.href = '/login?next=/qr';
  };

  async function fetchLink() {
    if (!token) return needLogin();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/me/public-link`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return needLogin();
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as PublicLink | null;
      setLink(json);
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Falha ao carregar link público');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    if (!token) return needLogin();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/me/public-link`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return needLogin();
      if (!res.ok) throw new Error(await res.text());
      setToast('Link gerado com sucesso');
      await fetchLink();
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Erro ao gerar link');
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    if (!token) return needLogin();
    if (!link?.id) return setToast('Nenhum link ativo para revogar');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/me/public-link/${link.id}/revoke`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return needLogin();
      if (!res.ok) throw new Error(await res.text());
      setToast('Link revogado');
      await fetchLink();
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Erro ao revogar link');
    } finally {
      setLoading(false);
    }
  }

  async function regenerate() {
    // estratégia simples: se houver ativo, revoga; em seguida gera novo
    try {
      if (link?.id && link.status === 'active') {
        await revoke();
      }
    } finally {
      await generate();
    }
  }

  const publicUrl =
    typeof window !== 'undefined' && link?.slug
      ? `${window.location.origin}/q/${link.slug}`
      : '';

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="text-xl font-semibold mb-2">QR público de emergência</h1>
      <p className="text-sm text-slate-600 mb-4">
        Gere um link público (protegido por PIN) para ser acessado via QR Code.
      </p>

      {/* Estado atual */}
      <div className="rounded border bg-white p-4 mb-4">
        {loading && <p>Carregando…</p>}

        {!loading && !link && <p>Nenhum link ativo.</p>}

        {!loading && link && (
          <div className="space-y-2">
            <div className="text-sm">
              <div>
                <span className="font-medium">Status:</span>{' '}
                {link.status === 'active' ? (
                  <span className="text-emerald-700">ativo</span>
                ) : (
                  <span className="text-red-700">revogado</span>
                )}
              </div>
              <div>
                <span className="font-medium">Slug:</span> {link.slug}
              </div>
              {publicUrl && (
                <div className="break-all">
                  <span className="font-medium">URL:</span> {publicUrl}
                </div>
              )}
            </div>

            {link.status === 'active' && publicUrl && (
              <div className="text-xs text-slate-600">
                A página pública é <code>/q/{link.slug}</code>. A impressão do cartão está em{' '}
                <code>/qr/print</code>.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2">
        <button
          className="rounded bg-emerald-600 text-white py-2 disabled:opacity-50"
          onClick={generate}
          disabled={loading}
        >
          Gerar
        </button>
        <button
          className="rounded bg-amber-600 text-white py-2 disabled:opacity-50"
          onClick={regenerate}
          disabled={loading}
        >
          Regerar
        </button>
        <button
          className="rounded bg-red-600 text-white py-2 disabled:opacity-50"
          onClick={revoke}
          disabled={loading || !link}
        >
          Revogar
        </button>
        <Link
          href="/qr/print"
          className="rounded bg-slate-200 py-2 text-center disabled:opacity-50"
        >
          Imprimir
        </Link>
      </div>

      <Toast msg={toast} onClose={() => setToast('')} />
    </main>
  );
}
