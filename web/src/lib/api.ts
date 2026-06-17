// web/src/lib/api.ts

export const TOKEN_STORAGE_KEY = 'token';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue | undefined };

export type JsonBody = Record<string, JsonValue | undefined>;

type QueryValue = string | number | boolean | undefined;

export interface ExtraInit {
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  withAuth?: boolean;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
  // `json?: object;` foi removido pois o 'body' é passado como argumento separado nas funções apiX, não como parte do ExtraInit
}

export class ApiError<T = unknown> extends Error {
  public readonly status: number;
  public readonly res: Response;
  public readonly data: T | null;

  constructor(message: string, status: number, res: Response, data: T | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.res = res;
    this.data = data;
  }
}

function buildUrl(path: string, query?: ExtraInit['query']): string {
  const base = API_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;

  if (!query) return `${base}${p}`;

  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `${base}${p}?${qs}` : `${base}${p}`;
}

function getAuthHeader(withAuth?: boolean): Record<string, string> {
  if (!withAuth) return {};
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isExtraInit(candidate: unknown): candidate is ExtraInit {
  if (!candidate || typeof candidate !== 'object') return false;
  const keys = new Set(Object.keys(candidate as Record<string, unknown>));
  // heurística: chaves típicas de ExtraInit
  const known = ['headers', 'query', 'withAuth', 'credentials', 'signal'];
  return known.some((k) => keys.has(k));
}

async function safeParseJson<T>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function extractMessage(data: unknown): string | null {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const possible = ['message', 'error', 'detail'];
    for (const k of possible) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  return null;
}

async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD',
  path: string,
  body?: unknown,
  extra?: ExtraInit,
): Promise<T> {
  const url = buildUrl(path, extra?.query);

  const headers: Record<string, string> = {
    ...(extra?.headers ?? {}),
    ...getAuthHeader(extra?.withAuth),
  };

  let finalBody: BodyInit | undefined;

  if (body instanceof FormData) {
    finalBody = body;
    // não define Content-Type manualmente
  } else if (typeof body !== 'undefined' && body !== null) {
    // Apenas define Content-Type se ainda não estiver definido
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    finalBody = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers,
    // Em requisições GET, HEAD, o body deve ser undefined
    body: method === 'GET' || method === 'HEAD' ? undefined : finalBody,
    credentials: extra?.credentials ?? 'include',
    signal: extra?.signal,
  });

  const parsed = await safeParseJson<T>(res);

  if (!res.ok) {
    const msg = (extractMessage(parsed) ?? res.statusText) || 'Erro na requisição';

    throw new ApiError<T>(msg, res.status, res, parsed);
  }

  // Se o tipo esperado T é 'void' ou 'undefined',
  // retornamos undefined em vez de um objeto parcialmente preenchido
  if (parsed === null && (typeof undefined === typeof parsed)) { 
      return undefined as T;
  }
  
  // Mantém a lógica original de retorno, garantindo que 'parsed' é do tipo T
  return (parsed ?? undefined) as T; 
}

/* ---------------- GET ---------------- */

export function apiGet<T = unknown>(path: string): Promise<T>;
export function apiGet<T = unknown>(path: string, extra: ExtraInit): Promise<T>;
export function apiGet<T = unknown>(
  path: string,
  extra?: ExtraInit,
): Promise<T> {
  return apiRequest<T>('GET', path, undefined, extra);
}

/* ---------------- POST ---------------- */

// NOVAS SOBRECARGAS E IMPLEMENTAÇÃO PADRONIZADA
export function apiPost<T = unknown>(path: string): Promise<T>; // Permite 1 argumento (path, sem body, sem extra)
export function apiPost<T = unknown>(path: string, body: unknown): Promise<T>; // Permite 2 argumentos (path, body, sem extra)
export function apiPost<T = unknown>(path: string, extra: ExtraInit): Promise<T>; // Permite 2 argumentos (path, sem body, com extra)
export function apiPost<T = unknown>(path: string, body: unknown, extra: ExtraInit): Promise<T>; // Permite 3 argumentos (path, body, extra)
export function apiPost<T = unknown>(
  path: string,
  secondArg?: unknown, // Pode ser body ou extra
  thirdArg?: ExtraInit, // Pode ser extra se secondArg for body
): Promise<T> {
  // Overloads aceitam (path), (path, body), (path, extra) e (path, body, extra)
  let body: unknown = undefined;
  let extra: ExtraInit | undefined = undefined;

  if (typeof secondArg === 'undefined') {
    // Caso: apiPost(path)
    body = undefined;
    extra = undefined;
  } else if (isExtraInit(secondArg)) {
    // Caso: apiPost(path, extra)
    body = undefined;
    extra = secondArg;
  } else {
    // Caso: apiPost(path, body) ou apiPost(path, body, extra?)
    body = secondArg;
    extra = thirdArg;
  }

  return apiRequest<T>('POST', path, body, extra);
}

/* ---------------- PUT ---------------- */

// NOVAS SOBRECARGAS E IMPLEMENTAÇÃO PADRONIZADA
export function apiPut<T = unknown>(path: string): Promise<T>; // Permite 1 argumento (path, sem body, sem extra)
export function apiPut<T = unknown>(path: string, body: unknown): Promise<T>; // Permite 2 argumentos (path, body, sem extra)
export function apiPut<T = unknown>(path: string, extra: ExtraInit): Promise<T>; // Permite 2 argumentos (path, sem body, com extra)
export function apiPut<T = unknown>(path: string, body: unknown, extra: ExtraInit): Promise<T>; // Permite 3 argumentos (path, body, extra)
export function apiPut<T = unknown>(
  path: string,
  secondArg?: unknown, // Pode ser body ou extra
  thirdArg?: ExtraInit, // Pode ser extra se secondArg for body
): Promise<T> {
  // Overloads aceitam (path), (path, body), (path, extra) e (path, body, extra)
  let body: unknown = undefined;
  let extra: ExtraInit | undefined = undefined;

  if (typeof secondArg === 'undefined') {
    // Caso: apiPut(path)
    body = undefined;
    extra = undefined;
  } else if (isExtraInit(secondArg)) {
    // Caso: apiPut(path, extra)
    body = undefined;
    extra = secondArg;
  } else {
    // Caso: apiPut(path, body) ou apiPut(path, body, extra?)
    body = secondArg;
    extra = thirdArg;
  }

  return apiRequest<T>('PUT', path, body, extra);
}

/* ---------------- PATCH ---------------- */

// NOVAS SOBRECARGAS E IMPLEMENTAÇÃO PADRONIZADA
export function apiPatch<T = unknown>(path: string): Promise<T>; // Permite 1 argumento (path, sem body, sem extra)
export function apiPatch<T = unknown>(path: string, body: unknown): Promise<T>; // Permite 2 argumentos (path, body, sem extra)
export function apiPatch<T = unknown>(path: string, extra: ExtraInit): Promise<T>; // Permite 2 argumentos (path, sem body, com extra)
export function apiPatch<T = unknown>(path: string, body: unknown, extra: ExtraInit): Promise<T>; // Permite 3 argumentos (path, body, extra)
export function apiPatch<T = unknown>(
  path: string,
  secondArg?: unknown, // Pode ser body ou extra
  thirdArg?: ExtraInit, // Pode ser extra se secondArg for body
): Promise<T> {
  // Overloads aceitam (path), (path, body), (path, extra) e (path, body, extra)
  let body: unknown = undefined;
  let extra: ExtraInit | undefined = undefined;

  if (typeof secondArg === 'undefined') {
    // Caso: apiPatch(path)
    body = undefined;
    extra = undefined;
  } else if (isExtraInit(secondArg)) {
    // Caso: apiPatch(path, extra)
    body = undefined;
    extra = secondArg;
  } else {
    // Caso: apiPatch(path, body) ou apiPatch(path, body, extra?)
    body = secondArg;
    extra = thirdArg;
  }

  return apiRequest<T>('PATCH', path, body, extra);
}

/* ---------------- DELETE ---------------- */

// As sobrecargas e implementação de apiDelete já estavam corretas e flexíveis
export function apiDelete<T = unknown>(path: string): Promise<T>;
export function apiDelete<T = unknown>(path: string, extra: ExtraInit): Promise<T>;
export function apiDelete<T = unknown>(path: string, body: unknown, extra: ExtraInit): Promise<T>;
export function apiDelete<T = unknown>(
  path: string,
  secondArg?: unknown, // Renomeado para consistência
  thirdArg?: ExtraInit, // Renomeado para consistência
): Promise<T> {
  // Overloads aceitam (path), (path, extra) e (path, body, extra)
  let body: unknown = undefined;
  let extra: ExtraInit | undefined = undefined;

  if (typeof secondArg === 'undefined') {
    // (path)
    body = undefined;
    extra = undefined;
  } else if (isExtraInit(secondArg)) {
    // (path, extra)
    body = undefined;
    extra = secondArg;
  } else {
    // (path, body, extra?)
    body = secondArg;
    extra = thirdArg;
  }

  return apiRequest<T>('DELETE', path, body, extra);
}