// web/src/lib/api.ts

/**
 * Cliente de API do frontend.
 * Estratégia: chamar "/api/..." localmente para que o next.config
 * faça o rewrite para o BACKEND quando a env NEXT_PUBLIC_API_BASE_URL
 * existir. Se a env não existir, você verá 405 (sem proxy)!
 */

export class ApiError extends Error {
  status: number;
  response?: Response;
  body?: unknown;

  constructor(message: string, status: number, response?: Response, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
    this.body = body;
  }
}

// Sempre usar caminho relativo; o next.config.* faz o proxy (quando configurado)
const API_BASE = '/api';

/** Tipos aceitos como payload JSON */
type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [k: string]: JsonValue };
type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** Tipos que aceitaremos como body no fetch */
type FetchBody = BodyInit | JsonValue | undefined;

/** Narrow util: checa se é um objeto com 'message' */
function hasMessageKey(u: unknown): u is { message: unknown } {
  return typeof u === 'object' && u !== null && 'message' in u;
}

/** Extrai string de mensagem, se houver */
function extractMessage(u: unknown): string | undefined {
  if (typeof u === 'string') return u;
  if (hasMessageKey(u) && typeof u.message === 'string') return u.message;
  return undefined;
}

/** Converte nosso FetchBody em BodyInit conforme o content-type */
function toBodyInit(body: FetchBody, contentType: string | undefined): BodyInit | undefined {
  if (body === undefined) return undefined;

  // Se for JSON explícito
  if (contentType && contentType.includes('application/json')) {
    return JSON.stringify(body as JsonValue);
  }

  // Se já for BodyInit nativo, retorna como está
  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ReadableStream ||
    body instanceof ArrayBuffer ||
    body instanceof DataView ||
    ArrayBuffer.isView(body) // TypedArrays
  ) {
    return body as BodyInit;
  }

  // Fallback: serializa como JSON
  return JSON.stringify(body as JsonValue);
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let parsed: unknown = undefined;
    try {
      parsed = isJson ? await res.json() : await res.text();
    } catch {
      /* ignore parse errors */
    }
    // ✅ corrigido: use parênteses ao misturar ?? e ||
    const message = extractMessage(parsed) ?? (res.statusText || 'Erro na requisição');
    throw new ApiError(message, res.status, res, parsed);
  }

  if (res.status === 204) {
    // No Content
    return undefined as unknown as T;
  }

  return (isJson ? await res.json() : await res.text()) as T;
}

/** Normaliza headers (sem usar any) */
function buildHeaders(extra?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = { Accept: 'application/json' };

  if (extra instanceof Headers) {
    extra.forEach((v, k) => {
      out[k] = v;
    });
  } else if (Array.isArray(extra)) {
    for (const [k, v] of extra) {
      out[String(k)] = String(v);
    }
  } else if (extra && typeof extra === 'object') {
    for (const [k, v] of Object.entries(extra)) {
      out[String(k)] = String(v);
    }
  }

  return out;
}

/** GET */
export async function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = buildHeaders(init.headers);
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: 'GET',
    credentials: 'include',
    headers,
  });
  return handleResponse<T>(res);
}

/** POST */
export async function apiPost<T>(
  path: string,
  body?: FetchBody,
  init: RequestInit = {},
): Promise<T> {
  const headers = buildHeaders(init.headers);
  if (body !== undefined && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: 'POST',
    credentials: 'include',
    headers,
    body: toBodyInit(body, headers['Content-Type']),
  });
  return handleResponse<T>(res);
}

/** PUT */
export async function apiPut<T>(
  path: string,
  body?: FetchBody,
  init: RequestInit = {},
): Promise<T> {
  const headers = buildHeaders(init.headers);
  if (body !== undefined && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: 'PUT',
    credentials: 'include',
    headers,
    body: toBodyInit(body, headers['Content-Type']),
  });
  return handleResponse<T>(res);
}

/** PATCH */
export async function apiPatch<T>(
  path: string,
  body?: FetchBody,
  init: RequestInit = {},
): Promise<T> {
  const headers = buildHeaders(init.headers);
  if (body !== undefined && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: toBodyInit(body, headers['Content-Type']),
  });
  return handleResponse<T>(res);
}

/** DELETE */
export async function apiDelete<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = buildHeaders(init.headers);
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method: 'DELETE',
    credentials: 'include',
    headers,
  });
  return handleResponse<T>(res);
}
