// web/src/lib/api.ts

/** Base da API (same-origin + rewrite /api recomendado) */
export const API_URL: string = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  return envUrl && envUrl.length > 0 ? envUrl : '/api';
})();

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOpts = {
  /** Headers extras se necessário */
  headers?: Record<string, string>;
  /**
   * Por padrão enviamos credenciais (cookies) para o backend,
   * pois a autenticação é via cookie httpOnly.
   */
  credentials?: RequestInit['credentials']; // default: 'include'
  /**
   * Caso MUITO específico: forçar Authorization Bearer.
   * Evite usar — sua API já autentica por cookie httpOnly.
   */
  bearerToken?: string;
  /** Corpo já serializado (quando não usar json) */
  body?: BodyInit | null;
  /** Se você quiser enviar JSON, use 'json' */
  json?: unknown;
  /** Método HTTP (override) */
  method?: HttpMethod;
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

/** Helper principal de fetch */
export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOpts = {},
): Promise<{ ok: boolean; status: number; data: T | null; response: Response }> {
  const {
    headers,
    credentials = 'include',
    bearerToken,
    body,
    json,
    method,
  } = opts;

  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders: Record<string, string> = {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(headers ?? {}),
  };

  if (bearerToken) {
    finalHeaders.Authorization = `Bearer ${bearerToken}`;
  }

  const res = await fetch(url, {
    method: method ?? (json ? 'POST' : 'GET'),
    credentials,
    headers: finalHeaders,
    body: json ? JSON.stringify(json) : body,
    redirect: 'follow',
  });

  // tenta ler JSON; se falhar, deixa null
  let data: T | null = null;
  let raw = '';
  try {
    data = (await res.clone().json()) as T;
  } catch {
    try {
      raw = await res.clone().text();
      data = parseJsonSafely(raw) as T | null;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    // extrai "message" do backend se houver
    let message = `HTTP ${res.status}`;
    const maybeObj = data as Record<string, unknown> | null;
    if (maybeObj && typeof maybeObj === 'object') {
      const m = maybeObj['message'];
      if (typeof m === 'string' && m.trim().length > 0) {
        message = m;
      }
    }

    const err: ApiError = Object.assign(new Error(message), {
      status: res.status,
      body: data ?? raw,
    });
    throw err;
  }

  return { ok: true, status: res.status, data, response: res };
}

/** Atalhos verbosos para ergonomia */
export const apiGet = <T>(path: string, opts?: Omit<RequestOpts, 'method' | 'json'>) =>
  apiRequest<T>(path, { ...opts, method: 'GET' });

export const apiPost = <T>(path: string, json?: unknown, opts?: Omit<RequestOpts, 'method'>) =>
  apiRequest<T>(path, { ...opts, method: 'POST', json });

export const apiPut = <T>(path: string, json?: unknown, opts?: Omit<RequestOpts, 'method'>) =>
  apiRequest<T>(path, { ...opts, method: 'PUT', json });

export const apiPatch = <T>(path: string, json?: unknown, opts?: Omit<RequestOpts, 'method'>) =>
  apiRequest<T>(path, { ...opts, method: 'PATCH', json });

export const apiDelete = <T>(path: string, json?: unknown, opts?: Omit<RequestOpts, 'method'>) =>
  apiRequest<T>(path, { ...opts, method: 'DELETE', json });
