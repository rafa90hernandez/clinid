'use client';
import { Logo } from '@/components/logo';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import BottomNav from '@/components/BottomNav';

/* =======================
   Tipos / Constantes
======================= */
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodType = (typeof BLOOD_TYPES)[number] | null;

type ProfileResponse = {
  // Identidade (somente leitura)
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  cpf?: string | null;

  // Clínico
  sex?: 'M' | 'F' | null;
  bloodType?: BloodType;
  allergies?: string[] | null;
  medications?: string[] | null;
  diseases?: string[] | null;
  surgeries?: string[] | null;

  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};
/* =======================
  Utils
======================= */
function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

function cpfLast2Masked(cpf: string | null | undefined): string {
  const d = onlyDigits(cpf ?? '');
  if (d.length !== 11) return 'XXX.XXX.XXX-**';
  return `XXX.XXX.XXX-${d.slice(-2)}`;
}
function formatList(list?: string[] | null) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

/* =======================
   Página (somente leitura)
======================= */
export default function HistoryReadOnlyPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [sex, setSex] = useState<'M' | 'F' | null>(null);
  const [bloodType, setBloodType] = useState<BloodType>(null);

  const [allergies, setAllergies] = useState<string[]>([]);
  const [medications, setMedications] = useState<string[]>([]);
  const [diseases, setDiseases] = useState<string[]>([]);
  const [surgeries, setSurgeries] = useState<string[]>([]);

  const [emgName, setEmgName] = useState('');
  const [emgPhone, setEmgPhone] = useState('');

  useEffect(() => {
    if (!ready) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await apiGet<ProfileResponse>('/me/profile');
        const data = res.data ?? {};
        if (!mounted) return;

 // Nome / CPF
        const fn = (data.firstName ?? '').trim();
        const ln = (data.lastName ?? '').trim();
        const full = (data.name ?? '').trim();
        const composed = (fn || ln) ? `${fn}${ln ? ' ' + ln : ''}` : full;

        // Clínico
        setSex(data.sex ?? null);
        setBloodType((BLOOD_TYPES as readonly string[]).includes(String(data.bloodType))
          ? (data.bloodType as BloodType)
          : null);

        setAllergies(formatList(data.allergies));
        setMedications(formatList(data.medications));
        setDiseases(formatList(data.diseases));
        setSurgeries(formatList(data.surgeries));

        setEmgName((data.emergencyContactName ?? '').trim());
        setEmgPhone((data.emergencyContactPhone ?? '').trim());
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Falha ao carregar informações.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
 }, [ready]);

  const hasAny =
    sex ||
    bloodType ||
    allergies.length > 0 ||
    medications.length > 0 ||
    diseases.length > 0 ||
    surgeries.length > 0 ||
    emgName ||
    emgPhone;

  const headerRight = useMemo(() => {
    const sx = sex ?? '—';
    const bt = bloodType ?? '—';
    return { sx, bt };
  }, [sex, bloodType]);

  async function handleLogout() {
    try {
      await apiPost<unknown>('/accounts/logout', {});
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }

  if (!ready || loading) {
    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo />
        </div>
        <div className="relative z-10">Carregando…</div>
      </main>
    );
  }

  return (
  <main className="relative min-h-dvh bg-[#E6EBFF] p-6">
      {/* Marca d’água */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo className="opacity-30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Histórico do Funcionário</h1>

        {err && (
          <div className="mb-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}
{/* Linha: Sexo / Tipo Sanguíneo */}
        <div className="mb-3 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-x-3 gap-y-1 text-sm">
          <span>Sexo:</span>
          <div className="rounded-md border bg-[#fefefe] text-slate-900 ring-1 ring-slate-300 px-3 py-2">{headerRight.sx}</div>
          <span className="text-right">Tipo Sanguíneo:</span>
          <div className="rounded-md border bg-[#fefefe] px-3 py-2">{headerRight.bt}</div>
        </div>

        {/* Blocos de listas */}
        <ReadOnlyList label="Alergias:" items={allergies} />
        <ReadOnlyList label="Medicamentos utilizados:" items={medications} />
        <ReadOnlyList label="Doenças:" items={diseases} />
        <ReadOnlyList label="Cirurgias realizadas:" items={surgeries} />

        {/* Contato de emergência */}
        <div className="mt-4">
          <label className="mb-1 block text-sm">Contato de emergência:</label>

          <div className="mb-3">
            <label className="mb-1 block text-sm">Nome:</label>
            <div className="rounded-md border bg-[#fefefe] px-3 py-2 text-sm">{emgName || '—'}</div>
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm">Celular:</label>
            <div className="rounded-md border bg-[#fefefe] px-3 py-2 text-sm">{emgPhone || '—'}</div>
          </div>
        </div>

        {!hasAny && (
          <p className="mb-6 text-sm text-slate-600">
            Nenhuma informação clínica cadastrada.
          </p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

/* =======================
   Componentes auxiliares
======================= */
function ReadOnlyList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-sm">{label}</label>
      <div className="rounded-md border bg-white p-2">
        {items.length === 0 ? (
          <div className="px-2 py-1 text-sm text-slate-600">—</div>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {items.map((it, i) => (
              <li key={`${it}-${i}`} className="text-sm">
                {it}
              </li>
            ))}
          </ul>
        )}
      </div>
  </div>
  );
}
