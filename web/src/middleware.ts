import { NextRequest, NextResponse } from 'next/server';

// Rotas públicas EXATAS
const PUBLIC_EXACT = new Set<string>([
  '/login',
  '/register',
  '/forgot',
]);

// Prefixos públicos
const PUBLIC_PREFIXES = [
  '/p/',           // página pública protegida por PIN (ex.: /p/slug)
  '/reset',        // tela de redefinição de senha via link
  '/api',          // proxy do Next para a API Nest (não interceptar)
  '/_next',        // assets internos do Next
  '/favicon',      // ícone
  '/images',       // estáticos
  '/robots.txt',
  '/sitemap.xml',
] as const;

// Mesmo logado, o usuário PODE acessar essas rotas (não redirecionar)
const ALLOW_WHEN_LOGGED_EXACT = new Set<string>([
  '/login',
  '/register',
  '/forgot',
]);
const ALLOW_WHEN_LOGGED_PREFIXES = ['/p/', '/reset', '/api'] as const;

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) return true;
  }
  return false;
}

function isAllowedWhenLogged(pathname: string): boolean {
  if (ALLOW_WHEN_LOGGED_EXACT.has(pathname)) return true;
  for (const prefix of ALLOW_WHEN_LOGGED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix)) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Deixe OPTIONS passar (pré-flight)
  if (req.method === 'OPTIONS') {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value ?? '';
  const isLogged = Boolean(token);
  const isPublic = isPublicPath(pathname);

  // Se NÃO logado e rota privada => vai para /login
  if (!isLogged && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Se logado e rota pública:
  if (isLogged && isPublic) {
    // Nunca bloqueie /api
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    // Permita sempre /login, /register, /forgot, /reset e /p/*
    if (isAllowedWhenLogged(pathname)) {
      return NextResponse.next();
    }
    // Demais rotas públicas, redireciona para o dashboard
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Caso contrário, deixa passar
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};