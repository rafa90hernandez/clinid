'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { apiPost } from '@/lib/api';

/* =======================
   Tipos da API pública
======================= */
type PublicViewRequest = { slug: string; pin: string };

type PublicViewResponse = {
  first_name: string;
  last_name: string;
  sex: string | null;
  blood_type: string | null;
  allergies: string[];
  medications: string[];
  diseases: string[];
  surgeries: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  updated_at: string;
};

/* =======================
   Unwrap para api.ts
======================= */
type Wrapped<T> = { ok: boolean; status: number; data: T | null; response: Response };
function isWrapped<T>(x: unknown): x is Wrapped<T> {
  return !!x && typeof x === 'object' && 'ok' in x && 'status' in x && 'response' in x;
}
function unwrap<T>(res: T | Wrapped<T>): T {
  return isWrapped<T>(res) ? (res.data as T) : res;
}

/* =======================
   Utils
======================= */
function joinOrDash(list?: string[] | null): string {
  return list && list.length ? list.join(', ') : '-';
}
function fmtPhoneBR(raw: string | null): string {
  if (!raw) return '-';
  const d = raw.replace(/\D/g, '');
  if (d.length < 10) return raw;
  const dd = d.slice(0, 2);
  const nine = d.slice(2, 3);
  const p1 = d.slice(3, 7);
  const p2 = d.slice(7, 11);
  return `(${dd}) ${nine} ${p1}-${p2}`;
}

/* =======================
   Página
======================= */
export default function PublicPage() {
  const params = useParams() as Record<string, string | string[]>;
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug ?? '');

  const [pin, setPin] = useState('');
  const [data, setData] = useState<PublicViewResponse | null>(null);
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setData(null);
    setLoading(true);
    try {
      const res = await apiPost<PublicViewResponse>('/public/view', {
        slug,
        pin,
      } as PublicViewRequest);

      const unwrapped = unwrap<PublicViewResponse>(res);
      setData(unwrapped);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Falha ao validar PIN';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-2 text-xl font-semibold">Acesso público</h1>
      <p className="mb-4 text-sm text-slate-600">
        Digite o PIN do crachá para visualizar as informações.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="PIN de 6 dígitos"
          className="w-full rounded border px-3 py-2"
          required
        />
        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={pin.length !== 6 || loading}
        >
          {loading ? 'Validando…' : 'Validar PIN'}
        </button>
      </form>

      {err && <p className="mt-3 break-all text-sm text-red-700">Erro: {err}</p>}

      {data && (
        <div className="mt-4 rounded border bg-white p-3 text-sm">
          <div>
            <span className="font-medium">Nome: </span>
            {data.first_name} {data.last_name}
          </div>
          <div>
            <span className="font-medium">Sexo: </span>
            {data.sex ?? '-'}
          </div>
          <div>
            <span className="font-medium">Tipo sanguíneo: </span>
            {data.blood_type ?? '-'}
          </div>
          <div>
            <span className="font-medium">Alergias: </span>
            {joinOrDash(data.allergies)}
          </div>
          <div>
            <span className="font-medium">Medicações: </span>
            {joinOrDash(data.medications)}
          </div>
          <div>
            <span className="font-medium">Doenças: </span>
            {joinOrDash(data.diseases)}
          </div>
          <div>
            <span className="font-medium">Cirurgias: </span>
            {joinOrDash(data.surgeries)}
          </div>
          <div>
            <span className="font-medium">Contato de emergência: </span>
            {data.emergency_contact_name || data.emergency_contact_phone
              ? `${data.emergency_contact_name ?? ''} ${fmtPhoneBR(
                  data.emergency_contact_phone
                )}`.trim()
              : '-'}
          </div>
          <div className="text-slate-500">
            <span className="font-medium">Atualizado em: </span>
            {new Date(data.updated_at).toLocaleString()}
          </div>
        </div>
      )}
    </main>
  );
}
