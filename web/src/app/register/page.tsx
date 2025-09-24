'use client';

import { FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

/** =======================
 *  Tipos de resposta
 *  ======================= */
type RegisterResponse = {
  id: string;
  email: string;
  createdAt: string;
};

/** =======================
 *  Helpers de máscara
 *  ======================= */
function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  let out = p1;
  if (p2) out += '.' + p2;
  if (p3) out += '.' + p3;
  if (p4) out += '-' + p4;
  return out;
}

function maskCEP(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function maskPhoneBR(v: string) {
  // (DD) 9 9999-9999
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

/** =======================
 *  Página
 *  ======================= */
export default function RegisterPage() {
  const router = useRouter();

  // campos visuais do protótipo
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [cellphone, setCellphone] = useState('');
  // credenciais usadas na API
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // regras de senha
  const rules = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const digit = /\d/.test(password);
    const match = confirm.length > 0 && confirm === password;
    return { len, upper, lower, digit, match, all: len && upper && lower && digit && match };
  }, [password, confirm]);

  // lookup via cep (opcional; só preenche o campo Endereço)
  async function fetchCEP() {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!data?.erro) {
        const parts = [
          data.logradouro ?? '',
          data.bairro ? `- ${data.bairro}` : '',
          data.localidade && data.uf ? `, ${data.localidade}/${data.uf}` : '',
        ]
          .join('')
          .trim();
        if (parts) setAddress(parts);
      }
    } catch {
      // silencioso; é opcional
    }
  }

  const canSubmit =
    !loading &&
    email.trim().length > 3 &&
    rules.all;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!rules.all) return;

    try {
      setLoading(true);
      // a API do backend cadastra apenas email+password
      const res = await apiPost<RegisterResponse>('/accounts/register', {
        email: email.trim(),
        password,
      });

      if (!res.ok || !res.data) {
        throw new Error('Falha ao cadastrar.');
      }

      // depois do cadastro, mandamos o usuário para completar o perfil clínico
      router.replace('/profile');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao cadastrar.';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh bg-[#E6EBFF] text-slate-900">
      {/* logo grande, 30% opacidade no fundo (igual protótipo) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Image src="/logo.png" alt="ClinID" width={360} height={150} className="opacity-30" />
      </div>

      <main className="relative z-10 mx-auto max-w-sm px-6 py-8">
        <h1 className="mb-6 text-center text-xl font-semibold">Cadastro de Usuário</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm">Nome Completo</label>
            <input
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-sm">CPF</label>
            <input
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              inputMode="numeric"
              placeholder="000.000.000-00"
              maxLength={14}
            />
          </div>

          <div>
            <label className="block text-sm">CEP</label>
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 rounded-md border bg-white px-3 py-2"
                value={cep}
                onChange={(e) => setCep(maskCEP(e.target.value))}
                inputMode="numeric"
                placeholder="00000-000"
                maxLength={9}
              />
              <button
                type="button"
                onClick={fetchCEP}
                className="rounded-md bg-[#cfe2ff] px-3 py-2 text-slate-900 ring-1 ring-slate-300"
              >
                Buscar endereço
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm">Endereço</label>
            <input
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Bairro, Cidade/UF"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Número</label>
              <input
                className="mt-1 w-full rounded-md border bg-white px-3 py-2"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="123"
              />
            </div>
            <div>
              <label className="block text-sm">Celular</label>
              <input
                className="mt-1 w-full rounded-md border bg-white px-3 py-2"
                value={cellphone}
                onChange={(e) => setCellphone(maskPhoneBR(e.target.value))}
                inputMode="tel"
                placeholder="(11) 9 9999-9999"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm">E-mail</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm">Senha</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <ul className="mt-2 space-y-1 text-xs">
              <li className={rules.len ? 'text-green-600' : 'text-slate-600'}>• mínimo de 8 caracteres</li>
              <li className={rules.upper ? 'text-green-600' : 'text-slate-600'}>• ao menos 1 letra maiúscula</li>
              <li className={rules.lower ? 'text-green-600' : 'text-slate-600'}>• ao menos 1 letra minúscula</li>
              <li className={rules.digit ? 'text-green-600' : 'text-slate-600'}>• ao menos 1 número</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm">Confirmar senha</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border bg-white px-3 py-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
            {confirm.length > 0 && (
              <p className={`mt-1 text-xs ${rules.match ? 'text-green-600' : 'text-slate-600'}`}>
                {rules.match ? '• senhas coincidem' : '• deve ser igual à senha acima'}
              </p>
            )}
          </div>

          {err && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Finalizando…' : 'Finalizar'}
          </button>

          <p className="pt-1 text-center text-xs text-slate-600">
            Já tem conta?{' '}
            <Link href="/login" className="underline">
              Entrar
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
