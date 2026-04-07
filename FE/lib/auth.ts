import { getSession, signOut } from 'next-auth/react';

const BASE_URL =
  process.env.SPRING_API_URL ?? process.env.NEXT_PUBLIC_SPRING_API_URL ?? '';

// ─── 회원가입 ────────────────────────────────────────────────────────────────

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

// ─── OTP 전송 ────────────────────────────────────────────────────────────────

interface SendOtpParams {
  email: string;
  type: 'login' | 'reset';
}

interface SendOtpResult {
  ok: boolean;
  errorMessage?: string;
}

export async function sendOtp({
  email,
  type,
}: SendOtpParams): Promise<SendOtpResult> {
  const res = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type }),
  });

  if (!res.ok) {
    return {
      ok: false,
      errorMessage: '이메일 발송에 실패했어요. 다시 시도해주세요.',
    };
  }

  return { ok: true };
}

// ─── 클라이언트 컴포넌트용 fetch ──────────────────────────────────────────────

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
