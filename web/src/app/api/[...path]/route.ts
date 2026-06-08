// web/src/app/api/[...path]/route.ts

import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BACKEND_URL =
  process.env.API_BACKEND_URL?.replace(/\/+$/, '') || 'https://clinid.onrender.com';

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

function buildUpstreamUrl(path: string[], req: NextRequest): URL {
  const pathname = path.map(encodeURIComponent).join('/');
  const url = new URL(`${API_BACKEND_URL}/${pathname}`);
  url.search = req.nextUrl.search;
  return url;
}

function forwardRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);

  headers.delete('host');
  headers.delete('content-length');
  headers.delete('accept-encoding');

  if (!headers.get('accept')) {
    headers.set('accept', 'application/json');
  }

  return headers;
}

function copyUpstreamHeaders(upstream: Response): Headers {
  const headers = new Headers();

  upstream.headers.forEach((value, key) => {
    headers.append(key, value);
  });

  return headers;
}

async function proxyRequest(method: string, req: NextRequest, path: string[]): Promise<Response> {
  const url = buildUpstreamUrl(path, req);
  const headers = forwardRequestHeaders(req);

  const hasBody = !['GET', 'HEAD'].includes(method) && req.body;

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    redirect: 'manual',
  };

  if (hasBody) {
    init.body = req.body;
    init.duplex = 'half';
  }

  const upstream = await fetch(url, init);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: copyUpstreamHeaders(upstream),
  });
}

async function handleRequest(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const params = await ctx.params;
  return proxyRequest(req.method, req, params.path ?? []);
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
export const HEAD = handleRequest;
