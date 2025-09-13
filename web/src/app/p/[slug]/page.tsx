// web/src/app/p/[slug]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { apiPost } from '@/lib/api';

// Corpo e resposta da API
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

export default function PublicViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicViewResponse | null>(null);

  const onPinChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);
    try {
      const res = await apiPost<PublicViewResponse, PublicViewRequest>(
        '/public/view',
        { slug, pin }
      );
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao consultar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Acesso Público</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm">PIN (6 dígitos)</span>
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            value={pin}
            onChange={onPinChange}
            placeholder="******"
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || pin.length !== 6}
          className="w-full rounded-md bg-sky-500 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Verificando…' : 'Ver dados'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <section className="mt-6 space-y-2 rounded-md border p-4 text-sm">
          <h2 className="text-lg font-semibold">
            {data.first_name} {data.last_name}
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Info label="Sexo" value={data.sex ?? '—'} />
            <Info label="Tipo sanguíneo" value={data.blood_type ?? '—'} />
            <Info label="Alergias" value={fmtList(data.allergies)} />
            <Info label="Medicamentos" value={fmtList(data.medications)} />
            <Info label="Doenças" value={fmtList(data.diseases)} />
            <Info label="Cirurgias" value={fmtList(data.surgeries)} />
            <Info
              label="Contato de emergência"
              value={
                data.emergency_contact_name
                  ? `${data.emergency_contact_name} • ${data.emergency_contact_phone ?? ''}`
                  : '—'
              }
            />
            <Info
              label="Atualizado em"
              value={new Date(data.updated_at).toLocaleString()}
            />
          </div>
        </section>
      )}
    </main>
  );
}

function Info(props: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium">{props.label}: </span>
      <span>{props.value}</span>
    </p>
  );
}

function fmtList(list: string[]): string {
  return list.length ? list.join(', ') : '—';
}
