// web/src/app/clinical-register/page.tsx

'use client';
import { Logo } from '@/components/logo';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPut, ApiError } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import type { ProfileResponse } from '@/types/profile.d.ts'; // Importado ProfileResponse

/* =======================
   Tipos / Constantes
======================= */
const SEX_OPTIONS = ['M', 'F'] as const;
type SexOption = (typeof SEX_OPTIONS)[number] | '';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
type BloodTypeOption = (typeof BLOOD_TYPES)[number] | '';

const EMPTY_SEX: SexOption = '' as const;
const EMPTY_BLOOD: BloodTypeOption = '' as const;

type ListItem = string;

// ProfileResponse é importado de '@/types/profile.d.ts'

function isSex(v: unknown): v is Exclude<SexOption, ''> {
  return v === 'M' || v === 'F';
}
function isBloodType(v: unknown): v is Exclude<BloodTypeOption, ''> {
  return typeof v === 'string' && (BLOOD_TYPES as readonly string[]).includes(v);
}

/* =======================
   Máscaras
======================= */
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

/* =======================
   Página
======================= */
export default function ClinicalRegisterPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // somente leitura - firstName/lastName vêm de ProfileResponse, CPF de outro lugar (MeResponse?)
  const [firstName, setFirstName] = useState(''); // Alterado de 'name'
  const [lastName, setLastName] = useState('');   // Novo estado para lastName
  const [cpf] = useState(''); // Se o CPF for exibido, ele precisa vir de outra API (ex: /me)

  // seletores
  const [sex, setSex] = useState<SexOption>(EMPTY_SEX);
  const [bloodType, setBloodType] = useState<BloodTypeOption>(EMPTY_BLOOD);

  // listas
  const [allergies, setAllergies] = useState<ListItem[]>([]);
  const [medications, setMedications] = useState<ListItem[]>([]);
  const [diseases, setDiseases] = useState<ListItem[]>([]);
  const [surgeries, setSurgeries] = useState<ListItem[]>([]);

  // inputs temporários
  const [allergyInput, setAllergyInput] = useState('');
  const [medInput, setMedInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');
  const [surgeryInput, setSurgeryInput] = useState('');

  // contato
  const [emgName, setEmgName] = useState('');
  const [emgPhone, setEmgPhone] = useState('');

  const [hasData, setHasData] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  const maxItems = 20;

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      try {
        const data = await apiGet<ProfileResponse>('/me/profile');
        if (!mounted) return;

        setFirstName(data.firstName ?? ''); // Usando firstName
        setLastName(data.lastName ?? '');   // Usando lastName
        // O CPF não vem na ProfileResponse do `profiles.service.ts::getMine`.
        // Se você precisar exibi-lo aqui, ele deve ser buscado do `/me` endpoint (MeResponse).
        // setCpf(data.cpf ?? ''); // Esta linha deve ser removida ou adaptada.

        setSex(isSex(data.sex) ? data.sex : EMPTY_SEX);
        setBloodType(isBloodType(data.bloodType) ? data.bloodType : EMPTY_BLOOD);

        setAllergies(Array.isArray(data.allergies) ? data.allergies.slice(0, maxItems) : []);
        setMedications(Array.isArray(data.medications) ? data.medications.slice(0, maxItems) : []);
        setDiseases(Array.isArray(data.diseases) ? data.diseases.slice(0, maxItems) : []);
        setSurgeries(Array.isArray(data.surgeries) ? data.surgeries.slice(0, maxItems) : []);

        setEmgName(data.emergencyContactName ?? '');
        setEmgPhone(data.emergencyContactPhone ? formatPhoneBR(data.emergencyContactPhone) : '');

        const anyData =
          !!data.firstName || // Verifica se firstName existe
          !!data.lastName ||  // Verifica se lastName existe
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
      } catch (err) {
        if (!mounted) return;
        if (err instanceof ApiError) {
          if (err.status === 404) {
            console.log('Nenhum perfil clínico encontrado. Começando novo registro.');
            setHasData(false);
            setIsEditing(true);
          } else if (err.status !== 401) {
            console.error(`Erro da API (${err.status}):`, err.message);
          }
        } else {
          console.error('Erro desconhecido ou de rede ao carregar perfil:', err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, []);

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
    try {
      const phoneDigits = onlyDigits(emgPhone);

      const payload = {
        // firstName e lastName devem ser enviados aqui se você permitir a edição deles.
        // O `profiles.service.ts::upsertMine` espera `dto.first_name` e `dto.last_name`.
        first_name: firstName || '', // Enviar o firstName atual
        last_name: lastName || '',   // Enviar o lastName atual
        sex: sex || null,
        blood_type: bloodType || null,
        allergies,
        medications,
        diseases,
        surgeries,
        emergency_contact_name: emgName || null,
        emergency_contact_phone: phoneDigits || null,
        consent: true,
      };

      await apiPut<unknown>('/me/profile', payload);

      alert('Cadastro clínico salvo com sucesso!');
      setHasData(true);
      setIsEditing(false);
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Falha ao salvar (HTTP ${err.status}). Mensagem: ${err.message}. Tente novamente.`);
      } else {
        alert('Falha ao salvar. Verifique sua conexão e tente novamente.');
      }
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSaving(false);
    }
  }

  const fullName = `${firstName} ${lastName}`.trim();

  if (loading) {
    return (
      <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Logo className="opacity-30"/>
        </div>
        <div className="relative z-10">Carregando…</div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh bg-[#E6EBFF] p-6 pb-24">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Logo />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <h1 className="mb-6 text-center text-lg font-semibold">Cadastro Clínico</h1>

        <div className="mb-3 flex items-start justify-between">
          <div className="text-sm">
            <div>{fullName || '—'}</div>
            {/* CPF ainda precisa ser populado de outra fonte, como o /me endpoint */}
            <div className="text-slate-600">CPF: {cpf || '—'}</div>
          </div>
          <div className="text-xs">
            {hasData && !isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="underline mr-2"
                title="Editar cadastro clínico"
              >
                EDITAR
              </button>
            ) : (
              <span className="text-slate-400 mr-2 select-none">EDITANDO…</span>
            )}
            /
            <Link href="/settings/delete" className="underline ml-2" title="Excluir conta">
              EXCLUIR
            </Link>
          </div>
        </div>

        {/* Sexo / Tipo sanguíneo */}
        <div className="mb-4 grid grid-cols-[auto_1fr_auto_1fr] items-center gap-x-3 gap-y-2">
          <label className="text-sm">Sexo:</label>
          <select
            className="rounded-md border bg-white px-3 py-2 text-sm disabled:bg-slate-100"
            value={sex}
            onChange={(e) => setSex(e.target.value as SexOption)}
            disabled={disabled}
          >
            <option value="">Selecione…</option>
            {SEX_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label className="text-sm text-right">Tipo Sanguíneo:</label>
          <select
            className="rounded-md border bg-white px-3 py-2 text-sm disabled:bg-slate-100"
            value={bloodType}
            onChange={(e) => setBloodType(e.target.value as BloodTypeOption)}
            disabled={disabled}
          >
            <option value="">Selecione…</option>
            {BLOOD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Alergias */}
        <FieldWithAdder
          label="Alergias:"
          placeholder="Antialérgico"
          value={allergyInput}
          onChange={setAllergyInput}
          list={allergies}
          onAdd={() => { addItem(allergyInput, allergies, setAllergies); setAllergyInput(''); }}
          onRemove={(i) => removeItem(i, allergies, setAllergies)}
          maxItems={maxItems}
          disabled={disabled}
        />

        {/* Medicamentos */}
        <FieldWithAdder
          label="Medicamentos utilizados:"
          placeholder="Nome do medicamento"
          value={medInput}
          onChange={setMedInput}
          list={medications}
          onAdd={() => { addItem(medInput, medications, setMedications); setMedInput(''); }}
          onRemove={(i) => removeItem(i, medications, setMedications)}
          maxItems={maxItems}
          disabled={disabled}
        />

        {/* Doenças */}
        <FieldWithAdder
          label="Doenças:"
          placeholder="Doença"
          value={diseaseInput}
          onChange={setDiseaseInput}
          list={diseases}
          onAdd={() => { addItem(diseaseInput, diseases, setDiseases); setDiseaseInput(''); }}
          onRemove={(i) => removeItem(i, diseases, setDiseases)}
          maxItems={maxItems}
          disabled={disabled}
        />

        {/* Cirurgias */}
        <FieldWithAdder
          label="Cirurgias realizadas:"
          placeholder="Cirurgia"
          value={surgeryInput}
          onChange={setSurgeryInput}
          list={surgeries}
          onAdd={() => { addItem(surgeryInput, surgeries, setSurgeries); setSurgeryInput(''); }}
          onRemove={(i) => removeItem(i, surgeries, setSurgeries)}
          maxItems={maxItems}
          disabled={disabled}
        />

        {/* Contato de emergência */}
        <div className="mt-4">
          <label className="mb-1 block text-sm">Contato de emergência:</label>

          <div className="mb-3">
            <label className="mb-1 block text-sm">Nome:</label>
            <input
              className="w-full rounded-md border bg-white px-3 py-2 text-sm disabled:bg-slate-100"
              value={emgName}
              onChange={(e) => setEmgName(e.target.value)}
              placeholder="Nome do contato"
              disabled={disabled}
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm">Celular:</label>
            <input
              className="w-full rounded-md border bg-white px-3 py-2 text-sm disabled:bg-slate-100"
              value={emgPhone}
              onChange={(e) => setEmgPhone(formatPhoneBR(e.target.value))}
              inputMode="tel"
              placeholder="(DD) 9 9999-9999"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Salvar */}
        <div className="mt-4 pb-2">
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

/* =======================
   Campo com “+” e lista
======================= */
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
    <div className="mb-4">
      <label className="mb-1 block text-sm">{label}</label>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border bg-white px-3 py-2 text-sm disabled:bg-slate-100"
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
          className="grid h-9 w-9 place-items-center rounded-md border bg-white text-xl leading-none disabled:opacity-50"
          aria-label="Adicionar"
          title="Adicionar"
        >
          +
        </button>
      </div>

      {list.length > 0 && (
        <ul className="mt-2 space-y-1">
          {list.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm"
            >
              <span className="truncate">{item}</span>
              <button
                type="button"
                className="ml-2 text-slate-500 hover:text-red-600 disabled:opacity-50"
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