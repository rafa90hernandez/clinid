// web/src/lib/api.ts

/**
 * Cliente de API do frontend.
 * Estratégia: SEMPRE chamar "/api/..." localmente.
 * O next.config faz o rewrite de "/api/*" -> BACKEND_URL (NEXT_PUBLIC_API_BASE_URL).
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

// Base SEMPRE relativa ao front; o rewrite redireciona para o backend.
const API_BASE = '/api';

/** Tipos aceitáveis como payload de JSON “alto nível”. */
type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [k: string]: JsonValue };
type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** Tipos de corpo aceitos pelo fetch. */
type FetchBody =
  | BodyInit
  | JsonValue
  | undefined;

/** Narrow util: checa se é um objeto com uma chave string. */
function hasMessageKey(u: unknown): u is { message: unknown } {
  return typeof u === 'object' && u !== null && 'message' in u;
}

/** Extrai mensagem amigável de um corpo de erro desconhecido. */
function extractMessage(u: unknown): string | undefined {
  if (typeof u === 'string') return u;
  if (hasMessageKey(u) && typeof u.message === 'string') return u.message;
  return undefined;
}

/** Converte nosso tipo FetchBody em BodyInit (quando preciso). */
function toBodyInit(body: FetchBody, contentType: string | undefined): BodyInit | undefined {
  if (body === undefined) return undefined;

  // Se o header indica JSON, serializa JsonValue.
  if (contentType && contentType.includes('application/json')) {
    return JSON.stringify(body as JsonValue);
  }

  // Se já for BodyInit (FormData, URLSearchParams, Blob etc.), retorna direto.
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

  // Sem content-type forçado: fallback para JSON seguro.
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
    const message = extractMessage(parsed) ?? res.statusText || 'Erro na requisição';
    throw new ApiError(message, res.status, res, parsed);
  }

  if (res.status === 204) {
    // No Content
    return undefined as unknown as T;
  }

  return (isJson ? await res.json() : await res.text()) as T;
}

function buildHeaders(extra?: HeadersInit): Record<string, string> {
  // Normalizamos para um record string-string sem usar `any`.
  const out: Record<string, string> = {
    Accept: 'application/json',
  };

  if (extra instanceof Headers) {
    extra.forEach((v, k) => {
      out[k] = v;
    }