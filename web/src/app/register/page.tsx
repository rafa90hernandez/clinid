'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

type RegisterResponse = {
  id: string;
  email: string;
  createdAt: string;
};

function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

function maskCEP(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function maskPhoneBR(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  const dd = d.slice(0, 2);
  const nine = d.slice(2, 3);
  const p1 = d.slice(3, 7);
  const p2 = d.slice(7, 11);

  if (d.length <= 2) return `(${dd}`;
  if (d.length === 3) return `(${dd}) ${nine}`;
  if (d.length <= 7) return `(${dd}) ${nine} ${p1}`;
  return `(${dd}) ${nine} ${p1}-${p2}`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [cellphone, setCellphone] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rules = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const digit = /\d/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    const match = confirm.length > 0 && confirm === password;

    return {
      len,
      upper,
      lower,
      digit,
      special,
      match,
      all: len && upper && lower && digit && special && match,
    };
  }, [password, confirm]);

  async function fetchCEP() {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (!data?.erro) {
        if (data.logradouro) setAddress(data.logradouro);
        if (data.bairro) setNeighborhood(data.bairro);
        if (data.localidade) setCity(data.localidade);
        if (data.uf) setStateUf(data.uf);
      }
    } catch {
      // busca de CEP é opcional
    }
  }

  const completedRules = [
    rules.len,
    rules.upper,
    rules.lower,
    rules.digit,
    rules.special,
  ].filter(Boolean).length;

  const canSubmit = !loading && email.trim().length > 3 && rules.all;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    if (!rules.all) return;

    try {
      setLoading(true);

      const res = await apiPost<RegisterResponse>('/accounts/register', {
        email: email.trim(),
        password,
      });

      if (!res) {
        throw new Error('Falha ao cadastrar.');
      }

      router.replace('/profile');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao cadastrar.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#E6EBFF] via-[#EEF4FF] to-[#DCE8FF] px-5 py-8 pb-24 text-slate-900">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#A9C4FF]/45 blur-3xl" />

      <section className="relative z-10 mx-auto w-full max-w-md">
        <div className="rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-xl shadow-slate-300/30 backdrop-blur">
          <div className="mb-7 flex justify-center">
            <Logo />
          </div>

          <h1 className="text-center text-2xl font-black tracking-tight text-slate-950">
            Cadastro de Usuário
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-slate-600">
            Crie sua conta para configurar seu perfil clínico e gerar seu QR Code de emergência.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <Field label="Nome completo">
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </Field>

            <Field label="CPF">
              <input
                className={inputClass}
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                inputMode="numeric"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </Field>

            <Field label="CEP">
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={cep}
                  onChange={(e) => setCep(maskCEP(e.target.value))}
                  inputMode="numeric"
                  placeholder="00000-000"
                  maxLength={9}
                />
                <button
                  type="button"
                  onClick={fetchCEP}
                  className="shrink-0 rounded-2xl bg-[#CFE2FF] px-3 py-3 text-xs font-bold text-slate-800 shadow-sm ring-1 ring-[#A9C4FF]"
                >
                  Buscar
                </button>
              </div>
            </Field>

            <Field label="Logradouro">
              <input
                className={inputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Logradouro"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Número">
                <input
                  className={inputClass}
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123"
                />
              </Field>

              <Field label="Complemento">
                <input
                  className={inputClass}
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto, bloco..."
                />
              </Field>
            </div>

            <Field label="Bairro">
              <input
                className={inputClass}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Bairro"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cidade">
                <input
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                />
              </Field>

              <Field label="Estado">
                <input
                  className={inputClass}
                  value={stateUf}
                  onChange={(e) => setStateUf(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="UF"
                  maxLength={2}
                />
              </Field>
            </div>

            <Field label="Celular">
              <input
                className={inputClass}
                value={cellphone}
                onChange={(e) => setCellphone(maskPhoneBR(e.target.value))}
                inputMode="tel"
                placeholder="(11) 9 9999-9999"
              />
            </Field>

            <Field label="E-mail">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Senha">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <div className="mt-3 rounded-3xl border border-[#D7E3FF] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Segurança da senha
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      completedRules === 5
                        ? 'bg-emerald-100 text-emerald-700'
                        : completedRules >= 3
                          ? 'bg-[#E6EBFF] text-[#5277C8]'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {completedRules}/5
                  </span>
                </div>

                <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      completedRules === 5
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-[#7CA7FF] to-[#38BDF8]'
                    }`}
                    style={{ width: `${completedRules * 20}%` }}
                  />
                </div>

                <div className="grid gap-2">
                  <PasswordRule ok={rules.len} text="Mínimo de 8 caracteres" />
                  <PasswordRule ok={rules.upper} text="1 letra maiúscula" />
                  <PasswordRule ok={rules.lower} text="1 letra minúscula" />
                  <PasswordRule ok={rules.digit} text="1 número" />
                  <PasswordRule ok={rules.special} text="1 símbolo especial" />
                </div>
              </div>
            </Field>

            <Field label="Confirmar senha">
              <input
                type="password"
                className={inputClass}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />

              {confirm.length > 0 && (
                <p
                  className={`mt-2 rounded-2xl px-3 py-2 text-xs font-semibold ${
                    rules.match
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {rules.match ? '✓ Senhas coincidem' : '• Deve ser igual à senha acima'}
                </p>
              )}
            </Field>

            {err && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#7CA7FF] to-[#38BDF8] px-4 py-3 text-base font-extrabold text-white shadow-lg shadow-blue-300/30 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Finalizando…' : 'Finalizar'}
            </button>

            <p className="pt-2 text-center text-xs text-slate-600">
              Já tem conta?{' '}
              <Link href="/login" className="font-bold text-[#0A84D8] underline">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

const inputClass =
  'mt-1 w-full rounded-2xl border border-[#A9C4FF]/40 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#7CA7FF] focus:ring-4 focus:ring-[#7CA7FF]/15';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function PasswordRule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-all ${
        ok ? 'bg-emerald-50 text-emerald-700' : 'bg-[#F7F9FF] text-slate-500'
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all ${
          ok ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'
        }`}
      >
        {ok ? '✓' : '•'}
      </span>te

      <span className="font-semibold">{text}</span>
    </div>
  );
}