// web/src/app/api/[...path]/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs'; // Especifica o runtime para Node.js
export const dynamic = 'force-dynamic'; // Garante que a rota não seja estaticamente otimizada


const API_BACKEND_URL = process.env.API_BACKEND_URL || 'https://clinid.onrender.com';

/**
 * Constrói a URL completa para a requisição ao backend.
 * @param path O array de segmentos de caminho da URL.
 * @param req A requisição NextRequest original.
 * @returns A URL completa para o backend.
 */
function buildUpstreamUrl(path: string[], req: NextRequest): URL {
  // Garante que a URL base não termine com barra para evitar barras duplas
  const base = API_BACKEND_URL.endsWith('/') ? API_BACKEND_URL.slice(0, -1) : API_BACKEND_URL;
  // Codifica cada segmento do caminho para garantir URLs válidas
  const pathname = path.map(encodeURIComponent).join('/');
  const url = new URL(`${base}/${pathname}`);
  // Copia os parâmetros de query da requisição original (ex: ?param=value)
  url.search = req.nextUrl.search;
  return url;
}

/**
 * Filtra e encaminha os cabeçalhos da requisição original para o backend.
 * @param req A requisição NextRequest original.
 * @returns Um novo objeto Headers com os cabeçalhos a serem encaminhados.
 */
function forwardRequestHeaders(req: NextRequest): Headers {
  const h = new Headers(req.headers);
  // Remove cabeçalhos que são específicos do cliente para o proxy,
  // e que não devem ser encaminhados para o backend diretamente.
  h.delete('host'); // O host será o do backend
  h.delete('content-length'); // O fetch recalcula automaticamente
  h.delete('accept-encoding'); // Deixa o 'fetch' lidar com a compressão
  // O cabeçalho 'origin' é mantido para que o backend possa fazer suas próprias
  // verificações CORS com base no domínio do frontend (clinid-frontend.onrender.com).

  // Define um cabeçalho 'Accept' padrão se não houver um.
  if (!h.get('accept')) {
    h.set('accept', 'application/json');
  }
  return h;
}

/**
 * Copia os cabeçalhos da resposta do backend para a resposta do proxy.
 * @param upstream A resposta do backend.
 * @returns Um novo objeto Headers com os cabeçalhos da resposta do backend.
 */
function copyUpstreamHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((v, k) => {
    // Copia todos os cabeçalhos da resposta do backend.
   
    out.append(k, v);
  });
  return out;
}

/**
 * Função principal do proxy que faz a requisição ao backend.
 * @param method O método HTTP da requisição (GET, POST, etc.).
 * @param req A requisição NextRequest original.
 * @param path O array de segmentos de caminho para o backend.
 * @returns A resposta do proxy para o cliente.
 */
async function proxyRequest(method: string, req: NextRequest, path: string[]): Promise<Response> {
  const url = buildUpstreamUrl(path, req);
  const headers = forwardRequestHeaders(req);

  let requestBody: ReadableStream | Buffer | null = null;
  // Para métodos que podem ter um corpo (POST, PUT, PATCH, DELETE),
  // lê o corpo da requisição original.
  if (!['GET', 'HEAD'].includes(method)) {
    // 'req.body' já é um ReadableStream, que é mais eficiente para o fetch.
    if (req.body) {
      requestBody = req.body;
    }
  }

  // Faz a requisição ao backend.
  const `upstream` = await fetch(url, {
    method,
    headers,
    body: requestBody, // Passa o corpo lido, se houver
    redirect: 'manual', // Impede que o 'fetch' siga redirecionamentos automaticamente
    // Isso dá mais controle ao proxy sobre redirecionamentos.
  });

  const respHeaders = copyUpstreamHeaders(upstream);
  // Retorna a resposta do backend para o cliente do frontend, usando NextResponse.
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

/**
 * Handler unificado para todos os métodos HTTP.
 * @param req A requisição NextRequest.
 * @param ctx O contexto da rota, contendo os parâmetros dinâmicos (path).
 * @returns A resposta do proxy.
 */
async function handleRequest(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: { params: { path: string[] } } // Tipagem melhorada para ctx.params
): Promise<Response> {
  const { path } = ctx.params;
  const method = req.method;
  return proxyRequest(method, req, path ?? []);
}

// Exporta o handler para cada método HTTP suportado.
// Isso garante que todos os tipos de requisição sejam roteados pelo proxy.
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
export const HEAD = handleRequest; // Adicionado HEAD para completude