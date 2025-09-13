'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { useParams } from 'next/navigation';

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

type PublicViewRequest = { slug: string; pin: string };

export default function PublicPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';
  const [pin, setPin] = useState('');
  const [data, setData] = useState<PublicViewResponse | null>(null);
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setData(null);
    try {
      // ✅ apiPost tipado com APENAS o tipo de resposta
      const res = await apiPost<PublicViewResponse>('/public/view', {
        slug,
        pin,
      } as PublicViewRequest);
      setData(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao validar PIN');
    }
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold mb-2">Acesso público</h1>
      <p className="text-sm text-slate-600 mb-4">
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
          className="rounded bg-emerald-600 text-white px-4 py-2 disabled:opacity-50"
          disabled={pin.length !== 6}
        >
          Validar PIN
        </button>
      </form>

      {err && <p className="mt-3 text-sm text-red-700 break-all">Erro: {err}</p>}

      {data && (
        <div className="mt-4 rounded border bg-white p-3 text-sm">
          <div>
            <span className="font-medium">Nome: </span>
            {data.first_name} {data.last_name}
          </div>
          <div>
            <span className="font-medium">Tipo sanguíneo: </span>
            {data.blood_type ?? '-'}
          </div>
          <div>
            <span className="font-medium">Alergias: </span>
            {data.allergies?.length ? data.allergies.join(', ') : '-'}
          </div>
          {}
        </div>
      )}
    </main>
  );
}
