import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 개발 중 인증 전체 비활성화 플래그
const DEV_BYPASS_AUTH = process.env.NODE_ENV === 'development';

// 보호할 경로 (DEV_BYPASS_AUTH가 true여도 막을 거라면 별도 관리)
const PROTECTED_PATHS = [
  '/finance',
];

// 공개 경로
const PUBLIC_PATH_PREFIXES = [
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/api/auth',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) => {
    if (prefix === '/') return pathname === '/';
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });

  if (isPublicPath) return NextResponse.next();

  // 개발 모드면 인증 스킵
  if (DEV_BYPASS_AUTH) return NextResponse.next();

  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtectedPath) return NextResponse.next();

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