// web/src/lib/api.ts

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

type JsonPrimitive = string | number | boolean | null;
export type Json = JsonPrimitive | { [key: string]: Json } | Json[];

function makeUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${p}`;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      if (text) msg = text;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export async function apiPost<T, B extends Record<string, Json>>(
  path: string,
  body: B,
  opts?: { token?: string },
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(makeUrl(path), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function apiGet<T>(
  path: string,
  opts?: { token?: string },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(makeUrl(path), { method: 'GET', headers });
  return handle<T>(res);
}
