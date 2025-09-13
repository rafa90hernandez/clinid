// web/src/app/history/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Formatos que podem vir do backend dentro de snapshot */
type SnapshotRaw = Partial<{
  first_name: string;
  last_name: string;
  blood_type: string;
  sex: string | null;
  allergies: string[];
  medications: string[];
  diseases: string[];
  surgeries: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  // camelCase (fallback)
  firstName: string;
  lastName: string;
  bloodType: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}>;

type HistoryLatest = {
  id: string;
  changedAt: string;
  note: string | null;
  snapshot: SnapshotRaw;
} | null;

type SnapshotNormalized = {
  first_name: string;
  last_name: string;
  sex: string;
  blood_type: string;
  allergies: string[];
  medications: string[];
  diseases: string[];
  surgeries: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

function normalizeSnapshot(s: SnapshotRaw | undefined): SnapshotNormalized | null {
  if (!s) return null;

  const first_name = s.first_name ?? s.firstName ?? '';
  const last_name = s.last_name ?? s.lastName ?? '';
  const sex = (s.sex ?? '') || '';
  const blood_type = s.blood_type ?? s.bloodType ?? '';
  const allergies = Array.isArray(s.allergies) ? s.allergies : [];
  const medications = Array.isArray(s.medications) ? s.medications : [];
  const diseases = Array.isArray(s.diseases) ? s.diseases : [];
  const surgeries = Array.isArray(s.surgeries) ? s.surgeries : [];
  const emergency_contact_name =
    s.emergency_contact_name ?? s.emergencyContactName ?? '';
  const emergency_contact_phone =
    s.emergency_contact_phone ?? s.emergencyContactPhone ?? '';

  return {
    first_name,
    last_name,
    sex,
    blood_type,
    allergies,
    medications,
    diseases,
    surgeries,
    emergency_contact_name,
    emergency_contact_phone,
  };
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryLatest>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [changedAtText, setChangedAtText] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      // sem sessão → login
      window.location.href = '/login';
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/me/history/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error(await res.text());

        const json = (await res.json()) as HistoryLatest;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Falha ao carregar histórico';
          setErr(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Normaliza snapshot para a UI
  const s = useMemo(() => normalizeSnapshot(data?.snapshot), [data?.snapshot]);

  // Evita hydration mismatch formatando data no cliente e guardando em estado
  useEffect(() => {
    if (data?.changedAt) {
      try {
        setChangedAtText(new Date(data.changedAt).toLocaleString());
      } catch {
        setChangedAtText(data.changedAt);
      }
    } else {
      setChangedAtText('');
    }
  }, [data?.changedAt]);

  return (
    <main className="mx-auto max-w-md p-4 print:p-0">
      <h1 className="text-center text-lg font-semibold mb-3">
        Histórico do Funcionário
      </h1>

      {loading && <p>Carregando…</p>}

      {!loading && err && (
        <p className="text-sm text-red-700 break-words">Erro: {err}</p>
      )}

      {!loading && !err && !s && (
        <p className="text-sm text-slate-600">
          Nenhum histórico encontrado. Preencha seu cadastro clínico primeiro.
        </p>
      )}

      {!loading && !err && s && (
        <div className="space-y-2">
          <Field label="Nome completo" value={`${s.first_name} ${s.last_name}`.trim()} />
          <Field label="Sexo" value={s.sex} />
          <Field label="Tipo sanguíneo" value={s.blood_type} />
          <Field label="Alergias" value={s.allergies.join(', ')} />
          <Field label="Medicamentos utilizados" value={s.medications.join(', ')} />
          <Field label="Doenças" value={s.diseases.join(', ')} />
          <Field label="Cirurgias realizadas" value={s.surgeries.join(', ')} />
          <Field label="Contato de emergência" value={s.emergency_contact_name} />
          <Field label="Celular" value={s.emergency_contact_phone} />

          <p className="text-xs text-slate-500 mt-2">
            Última atualização: {changedAtText}
          </p>

          <div className="pt-3 flex gap-2">
            <button
              className="w-full rounded bg-slate-200 py-2 text-slate-800"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600">{label}</span>
      <input
        className="mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
        value={value}
        readOnly
      />
    </label>
  );
}
