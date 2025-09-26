// web/src/lib/api.ts

const API_BASE_URL = '/api'; // Aponta para o Next.js API Route (ex: /api/accounts/login)

// Define uma classe de erro customizada para incluir o status HTTP
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // Captura o stack trace, excluindo o construtor do erro
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

async function requestApi<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: object,
  options?: RequestInit,
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    // Se for 401 Unauthorized, limpa o token e redireciona para login
    if (response.status === 401 && token) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login'; // Redireciona o usuário
      }
      // Mesmo com redirecionamento, lançamos o erro para interromper a execução no componente
      throw new ApiError('Unauthorized', response.status);
    }

    // Tenta ler a mensagem de erro do corpo da resposta, caso exista
    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na API' }));
    // Lança o ApiError com a mensagem e o status
    throw new ApiError(errorData.message || `Erro na API: ${response.status} ${response.statusText}`, response.status);
  }

  // Se a resposta for 204 No Content, não há corpo para parsear, retorna null
  if (response.status === 204) {
    return null as T;
  }

  // Retorna o corpo da resposta como JSON
  return response.json() as Promise<T>;
}

export const apiGet = <T>(path: string, options?: RequestInit) => requestApi<T>('GET', path, undefined, options);
export const apiPost = <T>(path: string, body: object, options?: RequestInit) => requestApi<T>('POST', path, body, options);
export const apiPut = <T>(path: string, body: object, options?: RequestInit) => requestApi<T>('PUT', path, body, options);
export const apiPatch = <T>(path: string, body: object, options?: RequestInit) => requestApi<T>('PATCH', path, body, options);
export const apiDelete = <T>(path: string, options?: RequestInit) => requestApi<T>('DELETE', path, undefined, options);

export async function apiLogin(email: string, password: string): Promise<{ access_token: string }> {
  const responseData = await apiPost<{ access_token?: string }>('/accounts/login', { email, password });

  if (responseData && responseData.access_token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', responseData.access_token);
    }
    return { access_token: responseData.access_token };
  } else {
    throw new Error('Login bem-sucedido, mas o token de acesso não foi encontrado na resposta da API.');
  }
}