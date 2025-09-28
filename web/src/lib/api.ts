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
  /** Envia um corpo arbitrário sem serialização automática */
  body?: BodyInit | null;
  /** Converte o valor informado em JSON e aplica Content-Type */
  json?: unknown;
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

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value as ArrayBufferView) ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ReadableStream
  );
}

function mergeBody(body: unknown, opts?: RequestOpts): RequestOpts {
  const nextOpts: RequestOpts = { ...(opts ?? {}) };

  if (body === undefined) {
    return nextOpts;
  }

  if (body === null) {
    nextOpts.body = null;
    return nextOpts;
  }

  if (isBodyInit(body)) {
    nextOpts.body = body;
    return nextOpts;
  }

  nextOpts.json = body;
  return nextOpts;
}

const REQUEST_OPT_KEYS = new Set(['withAuth', 'headers', 'body', 'json'] as const);

function isRequestOptsLike(value: unknown): value is RequestOpts {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length === 0) return false;

  return keys.every((key) => REQUEST_OPT_KEYS.has(key as keyof RequestOpts));
}

function buildRequestOpts(body: unknown, opts?: RequestOpts): RequestOpts {
  if (opts !== undefined) {
    return mergeBody(body, opts);
  }

  if (isRequestOptsLike(body)) {
    return { ...(body as RequestOpts) };
  }

  return mergeBody(body, undefined);
}

async function request<T>(method: HttpMethod, path: string, opts?: RequestOpts): Promise<T> {
  const { withAuth = true, headers: extraHeaders, json, body } = opts ?? {};

  const headers: Record<string, string> = { ...(extraHeaders ?? {}) };

  let payload: BodyInit | null | undefined;

  if (body !== undefined) {
    if (body === null) {
      payload = null;
    } else if (isBodyInit(body)) {
      payload = body;
    } else {
      payload = JSON.stringify(body);
      if (!('Content-Type' in headers)) {
        headers['Content-Type'] = 'application/json';
      }
    }
  } else if (json !== undefined) {
    payload = JSON.stringify(json);
    if (!('Content-Type' in headers)) {
      headers['Content-Type'] = 'application/json';
    }
  }

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
    body: payload ?? undefined,
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
  request<T>('GET', path, opts);

export const apiPost = <T>(path: string, body: unknown, opts?: RequestOpts) =>
  request<T>('POST', path, buildRequestOpts(body, opts));

export const apiPut = <T>(path: string, body: unknown, opts?: RequestOpts) =>
  request<T>('PUT', path, buildRequestOpts(body, opts));

export const apiPatch = <T>(path: string, body: unknown, opts?: RequestOpts) =>
  request<T>('PATCH', path, buildRequestOpts(body, opts));

export const apiDelete = <T>(path: string, body?: unknown, opts?: RequestOpts) =>
  request<T>('DELETE', path, buildRequestOpts(body, opts));
