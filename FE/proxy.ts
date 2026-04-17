import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/login/findpasswd',
  '/signup',
  '/onboarding',
  '/onboarding/1',
  '/onboarding/2',
  '/onboarding/3',
  '/onboarding/4',
  '/onboarding/5',
  '/onboarding/6',
  '/api/tts',
  '/health/walk',
]);
const PUBLIC_PATH_PREFIXES = ['/api/auth'];

export async function proxy(request: NextRequest) {
  return NextResponse.next();
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/login/changepasswd' && searchParams.get('token')) {
    return NextResponse.next();
  }

  const isPublicPath =
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
