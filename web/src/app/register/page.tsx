'use client';
import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { Card, Input, Label, Button, Helper } from '@/components/ui';
import { Logo } from '@/components/logo';

function isStrong(pwd: string) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pwd); // ≥8, letra e número
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pwdOk = isStrong(password);
  const match = password === confirm;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    if (!pwdOk) {
      setMsg('A senha deve ter pelo menos 8 caracteres, com letra e número.');
      return;
    }
    if (!match) {
      setMsg('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await apiPost<unknown, { email: string; password: string }>('/auth/register', {
        email,
        password,
      });
      setMsg('Cadastro realizado! Agora faça login.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card>
        <div className="mb-6 text-center">
          <Logo className="mb-2" />
          <p className="text-sm text-brand-700/80">Cadastro de Usuário</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Helper>Use pelo menos 8 caracteres com letra e número.</Helper>
          </div>

          <div>
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading || !pwdOk || !match}>
            {loading ? 'Cadastrando...' : 'Finalizar'}
          </Button>

          {msg && <p className="text-sm text-center text-gray-700">{msg}</p>}

          <p className="text-center text-sm text-gray-600">
            Já possui conta?{' '}
            <Link href="/login" className="text-brand-600 underline">
              Entrar
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
