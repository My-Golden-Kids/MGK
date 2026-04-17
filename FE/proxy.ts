import { type NextRequest, NextResponse } from 'next/server';
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
  '/api/signup',
]);
const PUBLIC_PATH_PREFIXES = ['/api/auth'];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  console.log(pathname);
  console.log(searchParams);

  if (pathname === '/login/changepasswd' && searchParams.get('token')) {
    return NextResponse.next();
  }

  const isPublicPath =
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (isPublicPath) {
    console.log(isPublicPath);
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  
  console.log(process.env.AUTH_SECRET);

  // if (!token) {
  console.log(token);
  return NextResponse.next();
  // return NextResponse.redirect(new URL('/login', request.url));
  // }

  // return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
