'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type HistoryItem = {
  id: string;
  changedAt: string;
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

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [latest, setLatest] = useState<HistoryItem | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const token = (typeof window !== 'undefined' && localStorage.getItem('token')) || '';

  const needLogin = () => {
    localStorage.removeItem('token');
    window.location.href = '/login?next=/history';
  };

  useEffect(() => {
    if (!token) return needLogin();

    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/me/history?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/me/history/latest`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (r1.status === 401 || r2.status === 401) return needLogin();

        if (!r1.ok) throw new Error(await r1.text());
        if (!r2.ok) throw new Error(await r2.text());

        setItems((await r1.json()) as HistoryItem[]);
        const l = (await r2.json()) as HistoryItem | null;
        setLatest(l);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Falha ao carregar histórico');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-xl font-semibold mb-2">Histórico de alterações</h1>
      {err && <p className="text-sm text-red-700 break-all">Erro: {err}</p>}

      <section className="rounded border bg-white p-4 mb-4">
        <h2 className="font-medium mb-2">Último snapshot</h2>
        {latest ? (
          <div className="text-sm">
            <div>
              <span className="font-medium">Data:</span>{' '}
              {new Date(latest.changedAt).toLocaleString()}
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

      <section className="rounded border bg-white p-4">
        <h2 className="font-medium mb-2">Últimas alterações</h2>
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
                      {new Date(it.changedAt).toLocaleString()}
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
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs bg-slate-50 p-2 rounded border">
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
