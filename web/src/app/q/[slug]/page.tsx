// web/src/app/q/[slug]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { apiPost } from '@/lib/api';

// Corpo da requisição que a API espera
type PublicViewRequest = { slug: string; pin: string };

// Resposta da API (campos em snake_case vindos do backend)
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
  updated_at: string; // ISO string
};

export default function PublicViewPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicViewResponse | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setData(null);

    try {
      // >>> AQUI usamos os DOIS genéricos: <Resposta, CorpoDaRequisicao>
      const res = await apiPost<PublicViewResponse, PublicViewRequest>(
        '/public/view',
        { slug, pin }
      );
      setData(res);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao consultar informações.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-2xl font-semibold">Acesso público</h1>
      <p className="mb-6 text-sm text-gray-600">
        Digite o PIN público do crachá para visualizar as informações clínicas.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">PIN (6 dígitos)</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
            placeholder="******"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? 'Consultando…' : 'Ver informações'}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {data && (
        <section className="mt-6 space-y-3 rounded-md border p-4">
          <h2 className="text-lg font-semibold">
            {data.first_name} {data.last_name}
          </h2>
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="font-medium">Sexo:</span> {data.sex ?? '—'}
            </div>
            <div>
              <span className="font-medium">Tipo sanguíneo:</span>{' '}
              {data.blood_type ?? '—'}
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium">Alergias:</span>{' '}
              {data.allergies.length ? data.allergies.join(', ') : '—'}
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium">Medicamentos:</span>{' '}
              {data.medications.length ? data.medications.join(', ') : '—'}
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium">Doenças:</span>{' '}
              {data.diseases.length ? data.diseases.join(', ') : '—'}
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium">Cirurgias:</span>{' '}
              {data.surgeries.length ? data.surgeries.join(', ') : '—'}
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium">Contato de emergência:</span>{' '}
              {data.emergency_contact_name ?? '—'}{' '}
              {data.emergency_contact_phone
                ? `(${data.emergency_contact_phone})`
                : ''}
            </div>
            <div className="sm:col-span-2 text-gray-500">
              <span className="font-medium">Atualizado em:</span>{' '}
              {new Date(data.updated_at).toLocaleString()}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
