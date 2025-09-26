import { apiGet, apiPost } from '@/lib/api';

export type PublicUser = {
  id: string;
  email: string;
  role: string | null;
  createdAt: string;
};

export async function login(email: string, password: string) {
  // cookie httpOnly volta via Set-Cookie automaticamente
  const res = await apiPost<{ ok: true }>('/accounts/login', { email, password });
  return res.ok;
}

export async function me() {
  const res = await apiGet<PublicUser>('/accounts/me');
  return res.data ?? null;
}

export async function logout() {
  const res = await apiPost<{ ok: true }>('/accounts/logout');
  return res.ok;
}

export async function forgot(email: string) {
  const res = await apiPost<{ ok: true }>('/accounts/forgot', { email });
  return res.ok;
}

export async function reset(id: string, token: string, newPassword: string) {
  const res = await apiPost<{ ok: true }>('/accounts/reset', { id, token, newPassword });
  return res.ok;
}