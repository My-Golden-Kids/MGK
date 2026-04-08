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

// ─── 비밀번호 변경 (매직링크 방식) ────────────────────────────────────────────

import { changePasswordSchema } from '@/lib/validator';

interface ResetPasswordByTokenParams {
  token: string;
  newPassword: string;
  passwordConfirm: string;
}

interface ResetPasswordByTokenResult {
  ok: boolean;
  fieldErrors?: Partial<Record<'newPassword' | 'passwordConfirm', string>>;
  errorMessage?: string;
}

export async function resetPasswordByToken({
  token,
  newPassword,
  passwordConfirm,
}: ResetPasswordByTokenParams): Promise<ResetPasswordByTokenResult> {
  const parsed = changePasswordSchema.safeParse({ newPassword, passwordConfirm });

  if (!parsed.success) {
    const fieldErrors: ResetPasswordByTokenResult['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  if (!token) {
    return { ok: false, errorMessage: '유효하지 않은 링크입니다.' };
  }

  const endpoint = '/api/auth/reset-password';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!res.ok) {
    return { ok: false, errorMessage: '링크가 만료되었거나 유효하지 않습니다.' };
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
