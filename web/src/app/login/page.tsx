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
        // ✅ caminho correto no backend:
        const resp = await apiPost<{ access_token?: string; ok?: boolean }>(
          '/accounts/login',
          { email: email.trim(), password },
          { withAuth: false }
        );

        // Compat: se vier token no corpo, guardamos numa chave única usada pelo app
        if (resp?.access_token) {
          localStorage.setItem('token', resp.access_token);
        } else {
          // Se login é só cookie, gravamos um flag leve para hooks client-side (se precisarem)
          localStorage.setItem('logged_in', '1');
        }

        // Redireciona para home após sucesso
        router.replace('/');
      } catch (err: unknown) {
        // Mensagens amigáveis
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
    [email, password, canSubmit, router]
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Logo central */}
        <div style={styles.logoWrap}>
          <Logo />
        </div>

        {/* Linha fina */}
        <div style={styles.divider} />

        {/* Formulário */}
        <form onSubmit={onSubmit} style={styles.form}>
          <label style={styles.label}>E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder=""
            style={styles.input}
            autoComplete="email"
            required
          />

          <label style={{ ...styles.label, marginTop: 16 }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            placeholder=""
            style={styles.input}
            autoComplete="current-password"
            required
          />

          {/* Links: cadastro & recuperar senha */}
          <div style={styles.linksWrap}>
            <div>Ainda não possui cadastro?</div>
            <a href="/register" style={styles.link}>
              Cadastre-se aqui
            </a>
            <a href="/forgot" style={styles.link}> {/* Corrigido de /recover para /forgot conforme seu middleware */}
              Recuperar Senha
            </a>
          </div>

          {/* Erro */}
          {error ? <div style={styles.error}>{error}</div> : null}

          {/* Botão */}
          <button type="submit" disabled={!canSubmit} style={{ ...styles.button, ...(canSubmit ? {} : styles.buttonDisabled) }}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Estilos inline simples para ficar bem próximo ao protótipo enviado */
const styles: Record<string, React.CSSProperties> = {
  page: {
    // ESTILOS ADICIONADOS/MODIFICADOS AQUI para centralizar e ocupar a tela inteira
    display: 'flex',
    justifyContent: 'center', // Centraliza horizontalmente
    alignItems: 'center',     // Centraliza verticalmente
    minHeight: '100vh',       // Ocupa 100% da altura da viewport
    width: '100vw',           // Ocupa 100% da largura da viewport
    background: '#E8EDFF',    // Um fundo suave para toda a página
    // Adiciona padding para garantir que o card não toque as bordas em telas muito pequenas
    padding: '20px',
    boxSizing: 'border-box', // Garante que padding não adicione largura/altura extra
  },
  headerTitle: {
    position: 'absolute',
    top: 8,
    left: 10,
    color: '#8A8A8A',
    fontSize: 14,
    fontWeight: 600,
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 26,
    marginBottom: 22,
  },
  logoBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fff',
    padding: '12px 16px',
    borderRadius: 14,
    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
  },
  logoPlus: {
    color: '#13B3F3',
    fontSize: 28,
    fontWeight: 800,
    marginRight: 4,
  },
  logoTitle: {
    color: '#13B3F3',
    fontWeight: 800,
    fontSize: 28,
    lineHeight: 1,
  },
  logoSubtitle: {
    color: '#4BA8C8',
    fontSize: 12,
    marginTop: -2,
  },
  divider: {
    height: 2,
    width: 80,
    background: '#111',
    margin: '0 auto 18px auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    color: '#333',
  },
  input: {
    height: 34,
    borderRadius: 6,
    border: '1px solid rgba(0,0,0,0.1)',
    background: '#fff',
    padding: '0 10px',
    outline: 'none',
  },
  linksWrap: {
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 10,
    color: '#444',
    fontSize: 12,
    lineHeight: 1.35,
  },
  link: {
    display: 'block',
    color: '#0b79d0',
    textDecoration: 'none',
    marginTop: 4,
  },
  error: {
    color: '#b00020',
    fontSize: 12,
    margin: '6px 0 10px 0',
    textAlign: 'center',
  },
  button: {
    height: 36,
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,0.06)',
    background: '#cfe0f7', // azul clarinho do protótipo
    color: '#0f2b4d',
    fontWeight: 700,
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};