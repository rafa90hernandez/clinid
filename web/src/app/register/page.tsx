'use client';
import { useState } from 'react';
import { apiPost } from '@/lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) {
      setMsg('As senhas não coincidem');
      return;
    }
    try {
      await apiPost<unknown, { email: string; password: string }>('/auth/register', {
        email,
        password,
      });
      setMsg('Cadastro realizado! Agora faça login.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar';
      setMsg(message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded">
        <h1 className="text-2xl font-bold">Criar conta</h1>
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Senha (≥8, letra e número)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Confirmar senha"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <button className="w-full bg-black text-white p-2 rounded">Cadastrar</button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </form>
    </div>
  );
}
