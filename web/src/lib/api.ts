// web/src/lib/api.ts

// URL base da API vinda do ambiente (ex.: https://clinid.onrender.com)
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || '';

export class ApiError extends Error {
  status: number;
  res: Response;
  body: unknown;

  constructor(message: string, status: number, res: Response, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.res = res;
    this.body = body;
  }
}

type ExtraInit = Omit<RequestInit, 'method' | 'body' | 'credentials'> & {
  withAuth?: boolean; // reservado p/ futuras rotas autenticadas
};

function joinUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${p}`;
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractMessage(body: unknown): string | null {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.message === 'string') return b.message;
    if (typeof b.error === 'string') return b.error;
  }
  return null;
}

async function handleJson<T>(res: Response): Promise<T> {
  const parsed = await parseJsonSafe(res);
  if (!res.ok) {
    const msg = extractMessage(parsed) ?? res.statusText ?? 'Erro na requisição';
    throw new ApiError(msg, res.status, res, parsed);
  }
  return parsed as T;
}

export async function apiGet<T>(
  path: string,
  init: ExtraInit = {},
): Promise<T> {
  const url = joinUrl(path);
  const res = await fetch(url, {
    ...init,
    method: 'GET',
    credentials: 'include', // importante para cookies httpOnly
    headers: {
      ...(init.headers || {}),
      Accept: 'application/json',
    },
  });
  return handleJson<T>(res);
}

export async function apiPost<T>(
  path: string,
  data?: unknown,
  init: ExtraInit = {},
): Promise<T> {
  const url = joinUrl(path);
  const res = await fetch(url, {
    ...init,
    method: 'POST',
    credentials: 'include', // cookies de sessão
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Accept: 'application/json',
    },
    body: data != null ? JSON.stringify(data) : undefined,
  });
  return handleJson<T>(res);
}

export async function apiPut<T>(
  path: string,
  data?: unknown,
  init: ExtraInit = {},
): Promise<T> {
  const url = joinUrl(path);
  const res = await fetch(url, {
    ...init,
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Accept: 'application/json',
    },
    body: data != null ? JSON.stringify(data) : undefined,
  });
  return handleJson<T>(res);
}

export async function apiPatch<T>(
  path: string,
  data?: unknown,
  init: ExtraInit = {},
): Promise<T> {
  const url = joinUrl(path);
  const res = await fetch(url, {
    ...init,
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Accept: 'application/json',
    },
    body: data != null ? JSON.stringify(data) : undefined,
  });
  return handleJson<T>(res);
}

export async function apiDelete<T>(
  path: string,
  init: ExtraInit = {},
): Promise<T> {
  const url = joinUrl(path);
  const res = await fetch(url, {
    ...init,
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...(init.headers || {}),
      Accept: 'application/json',
    },
  });
  return handleJson<T>(res);
}
