// web/src/lib/api.ts

export class ApiError extends Error {
  readonly status: number;
  readonly url?: string;
  readonly body?: unknown;

  constructor(message: string, status: number, url?: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

/**
 * Base da API (defina no Render/Local):
 * NEXT_PUBLIC_API_BASE_URL=https://clinid-api.onrender.com
 * Em dev, cai no localhost:3001.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

/** Token opcional (se você ainda suportar Bearer além de cookie httpOnly). */
function getAuthToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token') || null;
  } catch {
    return null;
  }
}

/** Redireciona em 401 se estamos no client */
function maybeRedirectToLoginOn401(status: number) {
  if (typeof window !== 'undefined' && status === 401) {
    const next = window.location.pathname + window.location.search;
    const nextParam = encodeURIComponent(next);
    window.location.replace(`/login?next=${nextParam}`);
  }
}

/** Constrói Headers de forma segura (sem erro de tipagem). */
function buildHeaders(init?: RequestInit, withJson: boolean = true): Headers {
  const headers = new Headers(init?.headers ?? {});
  const token = getAuthToken();

  if (withJson && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/** Trata a resposta: lança ApiError se !ok; retorna JSON (ou null se 204/empty). */
async function handleResponse<T>(response: Response, url: string): Promise<T> {
  if (!response.ok) {
    let body: unknown = null;
    try {
      // tenta parsear JSON de erro, mas não depende disso
      body = await response.clone().json();
    } catch {
      /* ignore */
    }

    // redireciona em 401 no client, mas também lança erro (SSR/calls isolados tratam)
    if (response.status === 401) {
      maybeRedirectToLoginOn401(401);
    }

    throw new ApiError(
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: unknown }).message ?? 'Erro na API')
        : `Erro ${response.status} na API`),
      response.status,
      url,
      body
    );
  }

  if (response.status === 204) {
    // No Content
    return null as unknown as T;
  }

  // Alguns endpoints podem retornar vazio (ex.: 200 com corpo vazio)
  const text = await response.text();
  if (!text) return null as unknown as T;

  return JSON.parse(text) as T;
}

/** Requisição base */
async function request<T>(
  path: string,
  init?: RequestInit & { jsonBody?: unknown; noJsonHeader?: boolean }
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const withJson = init?.noJsonHeader ? false : true;

  const headers = buildHeaders(init, withJson);

  const fetchInit: RequestInit = {
    method: init?.method ?? 'GET',
    headers,
    body:
      init?.jsonBody !== undefined
        ? JSON.stringify(init.jsonBody)
        : init?.body ?? undefined,
    credentials: 'include', // envia cookies httpOnly
    // Você pode adicionar: mode, cache, signal, etc. se precisar.
  };

  const res = await fetch(url, fetchInit);
  return handleResponse<T>(res, url);
}

/* ===========================
   Helpers públicos de alto nível
   =========================== */

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: 'GET' });
}

export async function apiPost<T, B = unknown>(
  path: string,
  body?: B,
  init?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...init,
    method: 'POST',
    jsonBody: body,
  });
}

export async function apiPut<T, B = unknown>(
  path: string,
  body?: B,
  init?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...init,
    method: 'PUT',
    jsonBody: body,
  });
}

export async function apiPatch<T, B = unknown>(
  path: string,
  body?: B,
  init?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...init,
    method: 'PATCH',
    jsonBody: body,
  });
}

export async function apiDelete<T, B = unknown>(
  path: string,
  body?: B,
  init?: RequestInit
): Promise<T> {
  return request<T>(path, {
    ...init,
    method: 'DELETE',
    jsonBody: body,
  });
}
