// web/src/lib/api.ts (ARQUIVO COMPLETO)

export const API_URL: string = (() => {
  // Se vier do ambiente, usa o valor informado
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl && envUrl.length > 0) return envUrl;

  // Padrão seguro: same-origin via NGINX
  return '/api';
})();

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOpts = {
  /** Por padrão enviamos Authorization: Bearer <token> */
  withAuth?: boolean;
  /** Headers extras se necessário */
  headers?: Record<string, string>;
};

interface ApiError extends Error {
  status?: number;
  body?: unknown;
}

function parseJsonSafely(text: string): unknown {
  try {
    return text ? JSON.parse(text) : undefined;
  } catch {
    return undefined;
  }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  opts?: RequestOpts
): Promise<T> {
  const withAuth = opts?.withAuth ?? true;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers ?? {}),
  };

  if (withAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // same-origin resolve cookies/CSRF se algum dia usar; ok para NGINX
    credentials: 'include',
    redirect: 'follow',
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    const data: unknown = parseJsonSafely(raw);

    // tenta extrair message do backend
    let message = `HTTP ${res.status}`;
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
    ) {
      message = (data as { message: string }).message;
    }

    const err: ApiError = Object.assign(new Error(message), {
      status: res.status,
      body: data ?? raw,
    });

    throw err;
  }

  if (res.status === 204) {
    // sem corpo
    return undefined as unknown as T;
  }

  return (await res.json()) as T;
}

export const apiGet = <T>(path: string, opts?: RequestOpts) =>
  request<T>('GET', path, undefined, opts);

export const apiPost = <T>(path: string, body: unknown, opts?: RequestOpts) =>
  request<T>('POST', path, body, opts);

export const apiPut = <T>(path: string, body: unknown, opts?: RequestOpts) =>
  request<T>('PUT', path, body, opts);

export const apiPatch = <T>(path: string, body: unknown, opts?: RequestOpts) =>
  request<T>('PATCH', path, body, opts);

export const apiDelete = <T>(path: string, body?: unknown, opts?: RequestOpts) =>
  request<T>('DELETE', path, body, opts);
