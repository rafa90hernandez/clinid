// web/src/lib/api.ts

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOpts = {
  /** Por padrão enviamos Authorization: Bearer <token> */
  withAuth?: boolean;
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
  };

  if (withAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    const data: unknown = parseJsonSafely(raw);

    const message =
      (typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message?: unknown }).message === 'string' &&
        (data as { message: string }).message) ||
      `HTTP ${res.status}`;

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
