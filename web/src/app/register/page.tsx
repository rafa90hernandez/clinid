'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { useTranslations } from 'next-intl';

type IdType = 'PASSPORT' | 'VISA' | 'DRIVER_LICENSE' | 'PPS';

type RegisterResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
};

const ID_TYPES: { value: IdType; label: string }[] = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'VISA', label: 'Visa' },
  { value: 'DRIVER_LICENSE', label: 'Driver Licence' },
  { value: 'PPS', label: 'PPS Number' },
];

const COUNTRIES = ['Ireland', 'Brazil', 'Spain', 'Portugal', 'United Kingdom', 'United States', 'France', 'Germany', 'Italy', 'Other'];

export default function RegisterPage() {
  const t = useTranslations('register');
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idType, setIdType] = useState<IdType>('PASSPORT');
  const [idNumber, setIdNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [country, setCountry] = useState('Ireland');
  const [cityCounty, setCityCounty] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const completedRules = [
    rules.len,
    rules.upper,
    rules.lower,
    rules.digit,
    rules.special,
  ].filter(Boolean).length;

  const canSubmit =
    !loading &&
    firstName.trim().length > 1 &&
    lastName.trim().length > 1 &&
    idNumber.trim().length > 2 &&
    addressLine1.trim().length > 2 &&
    country.trim().length > 1 &&
    cityCounty.trim().length > 1 &&
    postalCode.trim().length > 1 &&
    phoneNumber.trim().length > 5 &&
    email.trim().length > 3 &&
    rules.all;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    if (!canSubmit) return;

    try {
      setLoading(true);

      const res = await apiPost<RegisterResponse>(
        '/accounts/register',
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          idType,
          idNumber: idNumber.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          country: country.trim(),
          cityCounty: cityCounty.trim(),
          postalCode: postalCode.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim(),
          password,
        },
        { withAuth: false },
      );

      if (!res) {
        throw new Error(t('errors.failed'));
      }

      router.replace('/login');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('errors.failed');
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
            {t('title')}
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-slate-600">
            {t('subtitle')}
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-5">
            <FormSection title={t('sections.personal')}>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('firstName')}>
                  <input
                    className={inputClass}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Rafael"
                    required
                  />
                </Field>

                <Field label={t('lastName')}>
                  <input
                    className={inputClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Hernandez"
                    required
                  />
                </Field>
              </div>

              <Field label={t('email')}>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </Field>
            </FormSection>

            <FormSection title={t('sections.identification')}>
              <Field label={t('idType')}>
                <select
                  className={inputClass}
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as IdType)}
                  required
                >
                  {ID_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t('idNumber')}>
                <input
                  className={inputClass}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Document number"
                  required
                />
              </Field>
            </FormSection>

            <FormSection title={t('sections.contact')}>
              <Field label={t('addressLine1')}>
                <input
                  className={inputClass}
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Street and number"
                  required
                />
              </Field>

              <Field label={t('addressLine2')}>
                <input
                  className={inputClass}
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apartment, building, unit..."
                />
              </Field>

              <Field label={t('country')}>
                <select
                  className={inputClass}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                >
                  {COUNTRIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('cityCounty')}>
                  <input
                    className={inputClass}
                    value={cityCounty}
                    onChange={(e) => setCityCounty(e.target.value)}
                    placeholder="Dublin"
                    required
                  />
                </Field>

                <Field label={t('postalCode')}>
                  <input
                    className={inputClass}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                    placeholder="D08 KFN8"
                    required
                  />
                </Field>
              </div>

              <Field label={t('phoneNumber')}>
                <input
                  className={inputClass}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  inputMode="tel"
                  placeholder="+353 83 000 0000"
                  required
                />
              </Field>
            </FormSection>

            <FormSection title={t('sections.security')}>
              <Field label={t('password')}>
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
                      {t('passwordSecurity')}
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
                    <PasswordRule ok={rules.len} text={t('rules.minLength')} />
                    <PasswordRule ok={rules.upper} text={t('rules.uppercase')} />
                    <PasswordRule ok={rules.lower} text={t('rules.lowercase')} />
                    <PasswordRule ok={rules.digit} text={t('rules.number')} />
                    <PasswordRule ok={rules.special} text={t('rules.special')} />
                  </div>
                </div>
              </Field>

              <Field label={t('confirmPassword')}>
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
                    {rules.match ? t('passwordsMatch') : t('passwordsDoNotMatch')}
                  </p>
                )}
              </Field>
            </FormSection>

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
              {loading ? t('creating') : t('createAccount')}
            </button>

            <p className="pt-2 text-center text-xs text-slate-600">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="font-bold text-[#0A84D8] underline">
                {t('signIn')}
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

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-[#F7F9FF] p-4">
      <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h2>

      <div className="space-y-4">{children}</div>
    </section>
  );
}

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
      </span>

      <span className="font-semibold">{text}</span>
    </div>
  );
}