'use client';

import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { apiPost } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setSubmitting(true);
      setError(null);

      try {
        const resp = await apiPost<{ access_token?: string; ok?: boolean }>(
          '/accounts/login',
          { email: email.trim(), password },
          { withAuth: false },
        );

        if (resp?.access_token) {
          localStorage.setItem('token', resp.access_token);
        } else {
          localStorage.setItem('logged_in', '1');
        }

        router.replace('/');
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : 'Falha ao entrar. Verifique suas credenciais.';
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, canSubmit, router],
  );

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlowTop} />
      <div style={styles.backgroundGlowBottom} />

      <section style={styles.card}>
        <div style={styles.logoWrap}>
          <Logo />
        </div>

        <div style={styles.titleWrap}>
          <h1 style={styles.title}>Bem-vindo</h1>
          <p style={styles.subtitle}>Acesse sua identificação clínica com segurança.</p>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              style={styles.input}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              style={styles.input}
              autoComplete="current-password"
              required
            />
          </div>

          <div style={styles.linksWrap}>
            <span style={styles.helperText}>Ainda não possui cadastro?</span>
            <a href="/register" style={styles.link}>
              Cadastre-se aqui
            </a>
            <a href="/forgot" style={styles.link}>
              Recuperar senha
            </a>
          </div>

          {error ? <div style={styles.error}>{error}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...styles.button,
              ...(canSubmit ? styles.buttonEnabled : styles.buttonDisabled),
            }}
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
    minHeight: '100vh',
    width: '100vw',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    boxSizing: 'border-box',
    background:
      'radial-gradient(circle at top right, rgba(124, 167, 255, 0.42), transparent 32%), linear-gradient(135deg, #E6EBFF 0%, #EEF4FF 52%, #DCE8FF 100%)',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.65)',
    filter: 'blur(44px)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -130,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 999,
    background: 'rgba(124,167,255,0.32)',
    filter: 'blur(50px)',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 390,
    borderRadius: 34,
    padding: '34px 26px 28px',
    background: 'rgba(255,255,255,0.58)',
    border: '1px solid rgba(255,255,255,0.78)',
    boxShadow: '0 24px 70px rgba(69, 89, 145, 0.18)',
    backdropFilter: 'blur(18px)',
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  titleWrap: {
    textAlign: 'center',
    marginBottom: 26,
  },
  title: {
    margin: 0,
    color: '#13233F',
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: -0.6,
  },
  subtitle: {
    margin: '8px auto 0',
    maxWidth: 280,
    color: '#5D6F91',
    fontSize: 14,
    lineHeight: 1.45,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 700,
    color: '#253653',
  },
  input: {
    height: 48,
    borderRadius: 16,
    border: '1px solid rgba(124, 167, 255, 0.28)',
    background: '#FFFFFF',
    padding: '0 15px',
    outline: 'none',
    color: '#111827',
    fontSize: 15,
    boxShadow: '0 10px 24px rgba(69, 89, 145, 0.08)',
  },
  linksWrap: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 2,
    color: '#52647F',
    fontSize: 13,
    lineHeight: 1.55,
  },
  helperText: {
    display: 'block',
    color: '#52647F',
  },
  link: {
    display: 'block',
    color: '#0A84D8',
    textDecoration: 'none',
    fontWeight: 700,
    marginTop: 2,
  },
  error: {
    borderRadius: 14,
    border: '1px solid rgba(244, 63, 94, 0.24)',
    background: 'rgba(255, 241, 242, 0.9)',
    color: '#B42318',
    fontSize: 13,
    lineHeight: 1.4,
    padding: '10px 12px',
    textAlign: 'center',
  },
  button: {
    height: 50,
    marginTop: 4,
    borderRadius: 18,
    border: 'none',
    fontSize: 16,
    fontWeight: 800,
    transition: 'transform 160ms ease, filter 160ms ease, opacity 160ms ease',
  },
  buttonEnabled: {
    background: 'linear-gradient(135deg, #7CA7FF 0%, #38BDF8 100%)',
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: '0 16px 34px rgba(56, 139, 255, 0.28)',
  },
  buttonDisabled: {
    background: '#CFE0F7',
    color: '#607391',
    opacity: 0.75,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};