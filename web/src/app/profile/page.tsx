// web/src/app/profile/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiPut } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import BottomNav from '@/components/BottomNav';

const SEX_OPTIONS = ['M', 'F'] as const;
type SexOption = (typeof SEX_OPTIONS)[number] | '';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodTypeOption = (typeof BLOOD_TYPES)[number] | '';

const EMPTY_SEX: SexOption = '';
const EMPTY_BLOOD: BloodTypeOption = '';

type ListItem = string;

type ProfileResponse = {
  firstName?: string | null;
  lastName?: string | null;
  sex?: 'M' | 'F' | null;
  bloodType?: (typeof BLOOD_TYPES)[number] | null;
  allergies?: string[] | null;
  medications?: string[] | null;
  diseases?: string[] | null;
  surgeries?: string[] | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

function formatPhoneBR(raw: string) {
  const d = onlyDigits(raw).slice(0, 11);
  const dd = d.slice(0, 2);
  const nine = d.slice(2, 3);
  const p1 = d.slice(3, 7);
  const p2 = d.slice(7, 11);

  if (d.length <= 2) return `(${dd}`;
  if (d.length === 3) return `(${dd}) ${nine}`;
  if (d.length <= 7) return `(${dd}) ${nine} ${p1}`;
  return `(${dd}) ${nine} ${p1}-${p2}`;
}

function isSex(v: unknown): v is Exclude<SexOption, ''> {
  return v === 'M' || v === 'F';
}

function isBloodType(v: unknown): v is Exclude<BloodTypeOption, ''> {
  return typeof v === 'string' && (BLOOD_TYPES as readonly string[]).includes(v);
}

export default function ProfilePage() {
  const router = useRouter();
  const { ready } = useRequireAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState<SexOption>(EMPTY_SEX);
  const [bloodType, setBloodType] = useState<BloodTypeOption>(EMPTY_BLOOD);

  const [allergies, setAllergies] = useState<ListItem[]>([]);
  const [medications, setMedications] = useState<ListItem[]>([]);
  const [diseases, setDiseases] = useState<ListItem[]>([]);
  const [surgeries, setSurgeries] = useState<ListItem[]>([]);

  const [allergyInput, setAllergyInput] = useState('');
  const [medInput, setMedInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');
  const [surgeryInput, setSurgeryInput] = useState('');

  const [emgName, setEmgName] = useState('');
  const [emgPhone, setEmgPhone] = useState('');

  const [hasData, setHasData] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  const maxItems = 20;

  useEffect(() => {
    if (!ready) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const data: Partial<ProfileResponse> =
          (await apiGet<ProfileResponse>('/me/profile')) ?? {};

        if (!mounted) return;

        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setSex(isSex(data.sex) ? data.sex : EMPTY_SEX);
        setBloodType(isBloodType(data.bloodType) ? data.bloodType : EMPTY_BLOOD);

        setAllergies(Array.isArray(data.allergies) ? data.allergies.slice(0, maxItems) : []);
        setMedications(Array.isArray(data.medications) ? data.medications.slice(0, maxItems) : []);
        setDiseases(Array.isArray(data.diseases) ? data.diseases.slice(0, maxItems) : []);
        setSurgeries(Array.isArray(data.surgeries) ? data.surgeries.slice(0, maxItems) : []);

        setEmgName(data.emergencyContactName ?? '');
        setEmgPhone(data.emergencyContactPhone ? formatPhoneBR(data.emergencyContactPhone) : '');

        const anyData =
          !!(data.firstName && data.firstName.trim()) ||
          !!(data.lastName && data.lastName.trim()) ||
          isSex(data.sex) ||
          isBloodType(data.bloodType) ||
          (Array.isArray(data.allergies) && data.allergies.length > 0) ||
          (Array.isArray(data.medications) && data.medications.length > 0) ||
          (Array.isArray(data.diseases) && data.diseases.length > 0) ||
          (Array.isArray(data.surgeries) && data.surgeries.length > 0) ||
          !!(data.emergencyContactName && data.emergencyContactName.trim()) ||
          !!(data.emergencyContactPhone && data.emergencyContactPhone.trim());

        setHasData(anyData);
        setIsEditing(!anyData);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Falha ao carregar perfil.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [ready]);

  const canSave = useMemo(() => !saving && isEditing, [saving, isEditing]);
  const disabled = !isEditing;

  const addItem = (value: string, list: ListItem[], setter: (v: ListItem[]) => void) => {
    if (disabled) return;

    const v = value.trim();
    if (!v) return;
    if (list.length >= maxItems) return;

    setter([...list, v]);
  };

  const removeItem = (index: number, list: ListItem[], setter: (v: ListItem[]) => void) => {
    if (disabled) return;
    setter(list.filter((_, i) => i !== index));
  };

  async function handleSave() {
    if (!canSave) return;

    setSaving(true);
    setErr(null);
    setOkMsg(null);

    try {
      const phoneDigits = onlyDigits(emgPhone);

      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        sex: sex || null,
        blood_type: bloodType || null,
        allergies,
        medications,
        diseases,
        surgeries,
        emergency_contact_name: emgName || null,
        emergency_contact_phone: phoneDigits || null,
        consent: true,
      } as const;

      await apiPut('/me/profile', payload);

      setOkMsg('Cadastro clínico salvo com sucesso.');
      setHasData(true);
      setIsEditing(false);

      setTimeout(() => router.replace('/'), 600);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Falha ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  if (!ready || loading) {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-[#E6EBFF] px-5 py-8 pb-24">
        <BackgroundDecor />

        <section className="relative z-10 mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center text-center">
          <Logo className="mb-6 opacity-80" />

          <div className="rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-xl backdrop-blur">
            <p className="text-sm font-semibold text-slate-700">Carregando cadastro clínico...</p>

            <div className="mt-4 h-2 w-48 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#7CA7FF]" />
            </div>
          </div>
        </section>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#E6EBFF] via-[#EEF4FF] to-[#DCE8FF] px-5 py-6 pb-32 text-slate-900">
      <BackgroundDecor />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5277C8]">
            ClinID
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            Cadastro Clínico
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Atualize suas informações essenciais para situações de emergência.
          </p>
        </header>

        <div className="mb-5 rounded-[2rem] border border-white/80 bg-white/75 p-4 shadow-xl shadow-slate-300/30 backdrop-blur">
          <div className="flex gap-3">
            {hasData && !isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7CA7FF] to-[#38BDF8] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-300/30 transition hover:brightness-95"
                title="Editar cadastro clínico"
              >
                <span>✏️</span>
                Editar
              </button>
            ) : (
              <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#E6EBFF] px-4 py-3 text-sm font-extrabold text-[#5277C8]">
                <span>📝</span>
                Editando
              </div>
            )}

            <Link
              href="/settings/delete"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600 shadow-sm transition hover:bg-red-100"
              title="Excluir conta"
            >
              <span>🗑️</span>
              Excluir
            </Link>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {err}
          </div>
        )}

        {okMsg && (
          <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {okMsg}
          </div>
        )}

        <div className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-300/30 backdrop-blur">
          <div className="mb-5 rounded-3xl bg-[#F7F9FF] p-4">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Identificação
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Nome">
                <input
                  className={inputClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Seu nome"
                  disabled={disabled}
                />
              </InputField>

              <InputField label="Sobrenome">
                <input
                  className={inputClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Seu sobrenome"
                  disabled={disabled}
                />
              </InputField>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <SelectField label="Sexo">
              <select
                className={selectClass}
                value={sex}
                onChange={(e) => setSex(e.target.value as SexOption)}
                disabled={disabled}
              >
                <option value="">Selecione</option>
                {SEX_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </SelectField>

            <SelectField label="Tipo sanguíneo">
              <select
                className={selectClass}
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as BloodTypeOption)}
                disabled={disabled}
              >
                <option value="">Selecione</option>
                {BLOOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </SelectField>
          </div>

          <FieldWithAdder
            label="Alergias"
            placeholder="Ex: poeira, dipirona..."
            value={allergyInput}
            onChange={setAllergyInput}
            list={allergies}
            onAdd={() => {
              addItem(allergyInput, allergies, setAllergies);
              setAllergyInput('');
            }}
            onRemove={(i) => removeItem(i, allergies, setAllergies)}
            maxItems={maxItems}
            disabled={disabled}
          />

          <FieldWithAdder
            label="Medicamentos utilizados"
            placeholder="Nome do medicamento"
            value={medInput}
            onChange={setMedInput}
            list={medications}
            onAdd={() => {
              addItem(medInput, medications, setMedications);
              setMedInput('');
            }}
            onRemove={(i) => removeItem(i, medications, setMedications)}
            maxItems={maxItems}
            disabled={disabled}
          />

          <FieldWithAdder
            label="Doenças"
            placeholder="Nome da doença"
            value={diseaseInput}
            onChange={setDiseaseInput}
            list={diseases}
            onAdd={() => {
              addItem(diseaseInput, diseases, setDiseases);
              setDiseaseInput('');
            }}
            onRemove={(i) => removeItem(i, diseases, setDiseases)}
            maxItems={maxItems}
            disabled={disabled}
          />

          <FieldWithAdder
            label="Cirurgias realizadas"
            placeholder="Nome da cirurgia"
            value={surgeryInput}
            onChange={setSurgeryInput}
            list={surgeries}
            onAdd={() => {
              addItem(surgeryInput, surgeries, setSurgeries);
              setSurgeryInput('');
            }}
            onRemove={(i) => removeItem(i, surgeries, setSurgeries)}
            maxItems={maxItems}
            disabled={disabled}
          />

          <div className="mt-6 rounded-3xl bg-[#F7F9FF] p-4">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Contato de emergência
            </h2>

            <div className="space-y-4">
              <InputField label="Nome">
                <input
                  className={inputClass}
                  value={emgName}
                  onChange={(e) => setEmgName(e.target.value)}
                  placeholder="Nome do contato"
                  disabled={disabled}
                />
              </InputField>

              <InputField label="Celular">
                <input
                  className={inputClass}
                  value={emgPhone}
                  onChange={(e) => setEmgPhone(formatPhoneBR(e.target.value))}
                  inputMode="tel"
                  placeholder="(DD) 9 9999-9999"
                  disabled={disabled}
                />
              </InputField>
            </div>
          </div>

          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#7CA7FF] to-[#38BDF8] px-4 py-3 text-base font-extrabold text-white shadow-lg shadow-blue-300/30 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar cadastro clínico'}
          </button>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

const inputClass =
  'w-full rounded-2xl border border-[#A9C4FF]/40 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 focus:border-[#7CA7FF] focus:ring-4 focus:ring-[#7CA7FF]/15';

const selectClass =
  'w-full rounded-2xl border border-[#A9C4FF]/40 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-[#7CA7FF] focus:ring-4 focus:ring-[#7CA7FF]/15';

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#A9C4FF]/45 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
        <Logo className="scale-[3]" />
      </div>
    </>
  );
}

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function FieldWithAdder(props: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  list: string[];
  maxItems: number;
  disabled?: boolean;
}) {
  const { label, placeholder, value, onChange, onAdd, onRemove, list, maxItems, disabled } = props;

  return (
    <div className="mb-5">
      <label className="mb-1.5 block text-sm font-bold text-slate-700">{label}</label>

      <div className="flex gap-2">
        <input
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={!!disabled}
          onKeyDown={(e) => {
            if (disabled) return;

            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />

        <button
          type="button"
          onClick={onAdd}
          disabled={!!disabled || !value.trim() || list.length >= maxItems}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#CFE2FF] text-xl font-black text-[#5277C8] shadow-sm ring-1 ring-[#A9C4FF] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Adicionar"
          title="Adicionar"
        >
          +
        </button>
      </div>

      {list.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {list.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100"
            >
              <span className="max-w-[220px] truncate">{item}</span>

              <button
                type="button"
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                onClick={() => onRemove(i)}
                title="Remover"
                aria-label="Remover"
                disabled={!!disabled}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}