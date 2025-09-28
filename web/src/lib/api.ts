// web/src/lib/api.ts

/** Chave única para o token no localStorage (mantida em um único lugar) */
export const TOKEN_STORAGE_KEY = 'token';

/** Base URL da API (Render: defina NEXT_PUBLIC_API_URL nas envs do serviço Web) */
export const API_URL =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') as string | undefined) ||
  'http://localhost:3001';

/** Init extra aceitando headers/flags, mas sem permitir sobrescrever method/body/credentials */
export type ExtraInit = Omit<RequestInit, 'method' | 'body' | 'credentials'> & {
  /** Se true, adiciona Authorization: Bearer <token> se houver */
  withAuth?: boolean;
};

/** Erro aplicacional com status opcional */
export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Type guard simples para objetos */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Extrai mensagem padrão de respostas de erro JSON típicas da API Nest */
function extractMessage(v: unknown): string | undefined {
  if (!isRecord(v)) return undefined;

  // Nest padrão: { message: "texto", error: "Unauthorized", statusCode: 401 }
  const m = v['message'];
  if (typeof m === 'string') return m;
  if (Array.isArray(m) && m.length && typeof m[0] === 'string') return m[0];

  // Algumas APIs usam { error: "texto" }
  const e = v['error'];
  if (typeof e === 'string') return e;

  return undefined;
}

/** Monta URL absoluta para a API */
function buildUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${clean}`;
}

/** Core request: já envia credentials: 'include' para cookies httpOnly */
async function request<TResponse>(
  path: string,
  init: RequestInit & { withAuth?: boolean }
): Promise<TResponse> {
  const url = buildUrl(path);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (init.headers) {
    for (const [k, v] of Object.entries(init.headers)) {
      if (typeof v === 'string') headers[k] = v;
    }
  }

  // Token opcional via header (se você quiser usar além de cookie)
  if (init.withAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let parsed: unknown = undefined;
    try {
      parsed = await res.json();
    } catch {
      /* ignore */
    }
    // Corrige precedência: primeiro ?? depois ||
    const message = (extractMessage(parsed) ?? res.statusText) || 'Erro na requisição';
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as TResponse;

  try {
    return (await res.json()) as TResponse;
  } catch {
    throw new ApiError('Resposta inválida da API (JSON esperado).', res.status);
  }
}

/** Helpers HTTP */
export function apiGet<T>(path: string, extra?: ExtraInit) {
  return request<T>(path, { method: 'GET', ...extra });
}

export function apiPost<T>(path: string, body?: unknown, extra?: ExtraInit) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}), ...extra });
}

export function apiPut<T>(path: string, body?: unknown, extra?: ExtraInit) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}), ...extra });
}

export function apiPatch<T>(path: string, body?: unknown, extra?: ExtraInit) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}), ...extra });
}

export function apiDelete<T>(path: string, extra?: ExtraInit) {
  return request<T>(path, { method: 'DELETE', ...extra });
}
