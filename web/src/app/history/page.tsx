'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

/* =======================
   Tipos
======================= */
type HistoryItem = {
  id: string;
  changedAt: string; // ISO
  changedBy?: string | null;
  note?: string | null;
  snapshot: {
    firstName?: string;
    lastName?: string;
    sex?: string | null;
    bloodType?: string | null;
    allergies?: string[];
    medications?: string[];
    diseases?: string[];
    surgeries?: string[];
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    updatedAt?: string;
  };
};

/* =======================
   Helpers
======================= */
function isApiError(e: unknown): e is { status: number; body?: unknown } {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    typeof (e as { status?: unknown }).status === 'number'
  );
}

function needLogin(next = '/history') {
  if (typeof window !== 'undefined') {
    // limpa qualquer resquício legado
    try {
      localStorage.removeItem('token');
    } catch {}
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }
}

/* =======================
   Página
======================= */
export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [latest, setLatest] = useState<HistoryItem | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr('');

      try {
        // apiGet retorna { ok, status, data, response }
        const [listRes, lastRes] = await Promise.all([
          apiGet<HistoryItem[]>('/me/history?limit=10'),
          apiGet<HistoryItem | null>('/me/history/latest'),
        ]);

        if (!mounted) return;

        const list = Array.isArray(listRes.data) ? listRes.data : [];
        const last = lastRes.data ?? null;

        setItems(list);
        setLatest(last);
        setOpenId(null); // reset painel aberto ao atualizar lista
      } catch (e) {
        if (isApiError(e) && e.status === 401) {
          needLogin('/history');
          return;
        }
        setErr(e instanceof Error ? e.message : 'Falha ao carregar histórico');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-2 text-xl font-semibold">Histórico de alterações</h1>

      {loading && <p className="text-sm text-slate-600">Carregando…</p>}
      {err && <p className="break-all text-sm text-red-700">Erro: {err}</p>}

      {/* Último snapshot */}
      <section className="mb-4 rounded border bg-white p-4">
        <h2 className="mb-2 font-medium">Último snapshot</h2>
        {latest ? (
          <div className="text-sm">
            <div>
              <span className="font-medium">Data:</span>{' '}
              {latest.changedAt ? new Date(latest.changedAt).toLocaleString() : '-'}
            </div>
            <div className="break-words">
              <span className="font-medium">Resumo:</span>{' '}
              {`${latest.snapshot.firstName ?? ''} ${latest.snapshot.lastName ?? ''}`.trim() ||
                '(sem nome)'}
              {latest.snapshot.bloodType ? ` • ${latest.snapshot.bloodType}` : ''}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Nenhum registro ainda.</p>
        )}
      </section>

      {/* Lista de alterações */}
      <section className="rounded border bg-white p-4">
        <h2 className="mb-2 font-medium">Últimas alterações</h2>
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum item.</p>
        ) : (
          <ul className="divide-y">
            {items.map((it) => (
              <li key={it.id} className="py-3">
                <div className="flex items-start justify-between">
                  <div className="text-sm">
                    <div>
                      <span className="font-medium">Data:</span>{' '}
                      {it.changedAt ? new Date(it.changedAt).toLocaleString() : '-'}
                    </div>
                    {it.note && (
                      <div className="text-slate-600">
                        <span className="font-medium">Nota:</span> {it.note}
                      </div>
                    )}
                  </div>
                  <button
                    className="text-xs underline"
                    onClick={() => setOpenId(openId === it.id ? null : it.id)}
                  >
                    {openId === it.id ? 'ocultar' : 'detalhes'}
                  </button>
                </div>

                {openId === it.id && (
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded border bg-slate-50 p-2 text-xs">
{JSON.stringify(it.snapshot, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
