// web/src/lib/api.ts

/** Chave única para guardar o token no localStorage */
export const TOKEN_STORAGE_KEY = 'token';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || '';

export class ApiError extends Error {
  status: number;
  response: Response;
  payload: unknown;

  constructor(message: string, status: number, response: Response, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
    this.payload = payload;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ExtraInit = {
  headers?: Record<string, string>;
  /** Pass-through do body nativo do fetch */
  body?: BodyInit | null;
  /** Atalho: serializa como JSON e define Content-Type automaticamente */
  json?: unknown;
  /** Se true, envia credenciais (cookies). Padrão: true */
  withAuth?: boolean;
  /** Sinal do AbortController, opcional */
  signal?: AbortSignal;
};

/** Tenta extrair uma mensagem amigável do payload de erro */
function extractMessage(p: unknown): string | undefined {
  if (p && typeof p === 'object') {
    // @ts-expect-error tentativa best-effort
    const msg = (p.message ?? p.error ?? p.detail) as unknown;
    if (typeof msg === 'string') return msg;
  }
  return undefined;
}

async function parseMaybeJson(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return null;
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_URL) return path;
  const base = API_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  extra: ExtraInit = {},
): Promise<T> {
  const url = buildUrl(path);

  const headers: Record<string, string> = {
    ...(extra.headers || {}),
  };

  let body: BodyInit | null | undefined = extra.body;

  if (extra.json !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = JSON.stringify(extra.json);
  }

  const withAuth = extra.withAuth !== false; // padrão true

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: withAuth ? 'include' : 'omit',
    signal: extra.signal,
    cache: 'no-store',
  });

  if (!res.ok) {
    const parsed = await parseMaybeJson(res);
    const message = (extractMessage(parsed) ?? res.statusText) || 'Erro na requisição';
    throw new ApiError(message, res.status, res, parsed);
  }

  const parsed = await parseMaybeJson(res);
  return parsed as T;
}

export function apiGet<T>(path: string, extra?: Omit<ExtraInit, 'body' | 'json'>) {
  return request<T>('GET', path, extra);
}

export function apiPost<T>(path: string, body?: unknown, extra?: Omit<ExtraInit, 'body' | 'json'>) {
  return request<T>('POST', path, { ...(extra || {}), json: body });
}

export function apiPut<T>(path: string, body?: unknown, extra?: Omit<ExtraInit, 'body' | 'json'>) {
  return request<T>('PUT', path, { ...(extra || {}), json: body });
}

export function apiPatch<T>(path: string, body?: unknown, extra?: Omit<ExtraInit, 'body' | 'json'>) {
  return request<T>('PATCH', path, { ...(extra || {}), json: body });
}

/** DELETE pode enviar corpo usando extra.json (ou extra.body). */
export function apiDelete<T>(path: string, extra?: ExtraInit) {
  return request<T>('DELETE', path, extra || {});
}
