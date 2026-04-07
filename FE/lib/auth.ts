import { getSession, signOut } from 'next-auth/react';
import { auth } from '@/app/api/auth/[...nextauth]/route';

interface SignupParams {
  email: string;
  password: string;
  accountNum: string;
}

interface SignupResult {
  ok: boolean;
  errorMessage?: string;
}

export async function signup({
  email,
  password,
  accountNum,
}: SignupParams): Promise<SignupResult> {
  // Spring AuthController: POST /api/auth/signup
  // Request:  { email: string, password: string, accountNum: string }
  // Response: 200 OK
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SPRING_API_URL}/api/auth/signup`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, accountNum }),
    },
  );

  if (!res.ok) {
    return {
      ok: false,
      errorMessage: '회원가입에 실패했어요. 다시 시도해주세요.',
    };
  }

  return { ok: true };
}

interface SendOtpParams {
  email: string;
}

interface SendOtpResult {
  ok: boolean;
  errorMessage?: string;
}

export async function sendOtp({
  email,
}: SendOtpParams): Promise<SendOtpResult> {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    return {
      ok: false,
      errorMessage: '이메일 발송에 실패했어요. 다시 시도해주세요.',
    };
  }

  return { ok: true };
}

const BASE_URL =
  process.env.SPRING_API_URL ?? process.env.NEXT_PUBLIC_SPRING_API_URL ?? '';

// ─── 서버 컴포넌트용 ────────────────────────────────────────────────────────────
// Server Component, Route Handler, Server Action에서 사용
// jwt 콜백에서 자동으로 refresh 처리됨
//
// 사용 예:
//   const res = await serverFetch('/api/pets')
//   const data = await res.json()

export async function serverFetch(path: string, init?: RequestInit) {
  const session = await auth();

  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
      Authorization: `Bearer ${session?.accessToken ?? ''}`,
    },
  });
}

// ─── 클라이언트 컴포넌트용 ──────────────────────────────────────────────────────
// 'use client' 컴포넌트에서 사용
// jwt 콜백에서 refresh를 처리하므로 getSession() 호출 시 항상 최신 토큰이 반환됨
// refresh 실패 시(RefreshTokenError) 자동 로그아웃
//
// 사용 예:
//   const res = await clientFetch('/api/pets')
//   const data = await res.json()

export async function clientFetch(path: string, init?: RequestInit) {
  const session = await getSession();

  if ((session as any)?.error === 'RefreshTokenError') {
    await signOut({ callbackUrl: '/login' });
    return new Response(null, { status: 401 });
  }

  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
      Authorization: `Bearer ${session?.accessToken ?? ''}`,
    },
  });
}
