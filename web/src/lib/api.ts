// web/src/lib/api.ts

// Define a base URL para a sua API.
// Pelas modificações que você fez (criando 'web/src/app/api/[...path]/route.ts'),
// o ideal é usar um proxy através do Next.js API Route para evitar problemas de CORS no frontend.
const API_BASE_URL = '/api'; // Aponta para o Next.js API Route (ex: /api/accounts/login)

// Função utilitária genérica para fazer requisições à API
async function requestApi<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: object,
  options?: RequestInit,
): Promise<T> {
  // Pega o token do localStorage se estiver no ambiente do navegador
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers, // Mantém quaisquer outros cabeçalhos passados
  };

  // Se houver um token, adicione o cabeçalho Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Faz a requisição usando fetch
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  // Se a requisição não for bem-sucedida (status 4xx ou 5xx)
  if (!response.ok) {
    // Se for 401 Unauthorized e houver um token, o token pode estar inválido.
    // Limpa e redireciona para login.
    if (response.status === 401 && token) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // Você pode adicionar um redirecionamento aqui, por exemplo:
        // window.location.href = '/login';
      }
    }
    // Tenta ler a mensagem de erro do corpo da resposta, caso exista
    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na API' }));
    throw new Error(errorData.message || `Erro na API: ${response.status} ${response.statusText}`);
  }

  // Se a resposta for 204 No Content, não há corpo para parsear
  if (response.status === 204) {
    return null as T;
  }

  // Retorna o corpo da resposta como JSON
  return response.json() as Promise<T>;
}

// Funções utilitárias para cada método HTTP
export const apiGet = <T>(path: string, options?: RequestInit) => requestApi<T>('GET', path, undefined, options);
export const apiPost = <T>(path: string, body: object, options?: RequestInit) => requestApi<T>('POST', path, body, options);
export const apiPut = <T>(path: string, body: object, options?: RequestInit) => requestApi<T>('PUT', path, body, options);
export const apiPatch = <T>(path: string, body: object, options?: RequestInit) => requestApi<T>('PATCH', path, body, options);
export const apiDelete = <T>(path: string, options?: RequestInit) => requestApi<T>('DELETE', path, undefined, options);

// Função específica para a rota de login que salva o token no localStorage
export async function apiLogin(email: string, password: string): Promise<{ access_token: string }> {
  // Usa apiPost para fazer a requisição de login
  const responseData = await apiPost<{ access_token?: string }>('/accounts/login', { email, password });

  // Verifica se o token foi recebido e o salva
  if (responseData && responseData.access_token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', responseData.access_token);
    }
    return { access_token: responseData.access_token };
  } else {
    // Se o login foi 200 OK mas o token não veio, algo está errado
    throw new Error('Login bem-sucedido, mas o token de acesso não foi encontrado na resposta da API.');
  }
}