'use client';
import { useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { Card, Input, Label, Button, Helper } from '@/components/ui';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const data = await apiPost<{ access_token: string }, { email: string; password: string }>(
        '/auth/login',
        { email, password },
      );
      localStorage.setItem('access_token', data.access_token);
      setMsg('Login realizado com sucesso!');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card>
        <div className="mb-6 text-center">
          <Logo className="mb-2" />
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Helper>Esqueceu a senha? Em breve adicionaremos a recuperação.</Helper>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          {msg && <p className="text-sm text-center text-gray-700">{msg}</p>}

          <p className="text-center text-sm text-gray-600">
            Não possui conta?{' '}
            <Link href="/register" className="text-brand-600 underline">
              Criar conta
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
