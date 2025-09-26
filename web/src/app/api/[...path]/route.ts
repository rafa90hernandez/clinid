import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE = process.env.INTERNAL_API_BASE ?? 'http://api:3001';

function buildUpstreamUrl(path: string[], req: NextRequest) {
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const pathname = path.map(encodeURIComponent).join('/');
  const url = new URL(`${base}/${pathname}`);
  url.search = req.nextUrl.search;
  return url;
}

function forwardRequestHeaders(req: NextRequest): Headers {
  const h = new Headers(req.headers);
  h.delete('host');
  h.delete('content-length');
  h.delete('accept-encoding');
  if (!h.get('accept')) h.set('accept', 'application/json');
  return h;
}

function copyUpstreamHeaders(up: Response): Headers {
  const out = new Headers();
  up.headers.forEach((v, k) => {
    out.append(k, v);
  });
  return out;
}

async function proxy(method: string, req: NextRequest, path: string[]) {
  const url = buildUpstreamUrl(path, req);
  const headers = forwardRequestHeaders(req);
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(url, {
    method,
    headers,
    body,
    redirect: 'manual',
  });

  const respHeaders = copyUpstreamHeaders(upstream);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

// Handlers com 'any' para o contexto e com a supressão do ESLint
export async function GET(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any // <--- 'any' para contornar bug de tipagem do Next.js
) {
  const { path } = ctx.params;
  return proxy('GET', req, path ?? []);
}

export async function POST(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const { path } = ctx.params;
  return proxy('POST', req, path ?? []);
}

export async function PUT(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const { path } = ctx.params;
  return proxy('PUT', req, path ?? []);
}

export async function PATCH(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const { path } = ctx.params;
  return proxy('PATCH', req, path ?? []);
}

export async function DELETE(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const { path } = ctx.params;
  return proxy('DELETE', req, path ?? []);
}

export async function OPTIONS(
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any
) {
  const { path } = ctx.params;
  return proxy('OPTIONS', req, path ?? []);
}