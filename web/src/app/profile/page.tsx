'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPut, ApiError } from '@/lib/api';

/** ===== Tipos ===== */
type ProfileApiResponse = {
  // snake_case (retorno possível)
  first_name?: string;
  last_name?: string;
  sex?: string | null;
  blood_type?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  allergies?: string[];
  medications?: string[];
  diseases?: string[];
  surgeries?: string[];

  // camelCase (retorno possível, dependendo de como a API serializa)
  firstName?: string;
  lastName?: string;
  bloodType?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

type UpsertProfileBody = {
  // ATENÇÃO: a API espera SNAKE_CASE
  first_name: string;
  last_name: string;
  sex?: string;
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  allergies: string[];
  medications: string[];
  diseases: string[];
  surgeries: string[];
  consent?: boolean; // usado na primeira vez
};

function toList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function fromList(list?: string[] | null): string {
  return (list ?? []).join(', ');
}

export default function ProfilePage() {
  const router = useRouter();

  // Campos do formulário (internamente camelCase para conveniência)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [diseases, setDiseases] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [consent, setConsent] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const p = await apiGet<ProfileApiResponse>('/me/profile').catch((e) => {
          // 404 -> ainda não tem perfil, tudo bem.
          if (e instanceof ApiError && e.status === 404) return null;
          throw e;
        });

        if (p) {
          // aceita snake_case OU camelCase na leitura
          setFirstName(p.firstName ?? p.first_name ?? '');
          setLastName(p.lastName ?? p.last_name ?? '');
          setSex(p.sex ?? '');
          setBloodType(p.bloodType ?? p.blood_type ?? '');
          setEmergencyName(p.emergencyContactName ?? p.emergency_contact_name ?? '');
          setEmergencyPhone(p.emergencyContactPhone ?? p.emergency_contact_phone ?? '');
          setAllergies(fromList(p.allergies));
          setMedications(fromList(p.medications));
          setDiseases(fromList(p.diseases));
          setSurgeries(fromList(p.surgeries));
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          localStorage.removeItem('token');
          router.replace('/login');
          return;
        }
        setErr('Falha ao carregar perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    setOkMsg(null);

    try {
      // MONTA EM snake_case, como o endpoint espera
      const body: UpsertProfileBody = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        sex: sex ? sex.trim() : undefined,
        blood_type: bloodType ? bloodType.trim() : undefined,
        emergency_contact_name: emergencyName ? emergencyName.trim() : undefined,
        emergency_contact_phone: emergencyPhone ? emergencyPhone.trim() : undefined,
        allergies: toList(allergies),
        medications: toList(medications),
        diseases: toList(diseases),
        surgeries: toList(surgeries),
        // envie consent true na primeira gravação (mantém compatibilidade)
        consent: consent ? true : undefined,
      };

      await apiPut<unknown, UpsertProfileBody>('/me/profile', body);
      setOkMsg('Perfil salvo com sucesso.');
      setTimeout(() => router.replace('/'), 700);
    } catch (e) {
      if (e instanceof ApiError) {
        // tenta exibir mensagem vinda da API (validation pipe, etc.)
        const msg =
          (typeof e.body === 'string' && e.body) ||
          (e.body && (e.body.message || e.body.error)) ||
          'Erro ao salvar perfil.';
        setErr(typeof msg === 'string' ? msg : 'Erro ao salvar perfil.');
      } else {
        setErr('Erro ao salvar perfil.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Carregando perfil…</h1>
      </main>
    );
  }

  return (
    <main className="pb-24">
      <header className="flex items-center justify-between p-6">
        <h1 className="text-xl font-semibold">Editar perfil clínico</h1>
        <Link className="text-sm underline text-slate-700" href="/">
          Voltar
        </Link>
      </header>

      <form onSubmit={onSubmit} className="px-6 space-y-6">
        {err && <p className="text-sm text-red-600">{String(err)}</p>}
        {okMsg && <p className="text-sm text-green-600">{okMsg}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-slate-600">Nome</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Sobrenome</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Sexo (M/F/Outro)</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              placeholder="M"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Tipo sanguíneo</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value)}
              placeholder="O+"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Contato de emergência (nome)</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="Ex.: Maria"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Contato de emergência (telefone)</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="11999999999"
            />
          </label>
        </div>

        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm text-slate-600">Alergias (separe por vírgula)</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Penicilina, Dipirona"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Medicações em uso (vírgula)</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              placeholder="AAS 100mg"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Doenças (vírgula)</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={diseases}
              onChange={(e) => setDiseases(e.target.value)}
              placeholder="Hipertensão, Diabetes"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-600">Cirurgias (vírgula)</span>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={surgeries}
              onChange={(e) => setSurgeries(e.target.value)}
              placeholder="Colecistectomia 2017"
            />
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={!!consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span className="text-sm">
            Concordo em manter meus dados disponíveis no link público com PIN.
          </span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
          <Link href="/" className="rounded-md border px-4 py-2 text-slate-800">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
