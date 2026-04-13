'use server';

import { auth, signOut } from '@/app/api/auth/[...nextauth]/route';
import { changePasswordWithCurrentSchema } from '@/lib/validator';
import { getToken } from 'next-auth/jwt';
import { headers } from 'next/headers';

const BASE_URL =
  process.env.SPRING_API_URL ?? process.env.NEXT_PUBLIC_SPRING_API_URL ?? '';

// ─── 로그아웃 ─────────────────────────────────────────────────────────────────
// events.signOut은 client-side signOut()에서 token이 전달되지 않는 beta 버그가 있어
// 서버 액션에서 직접 JWT를 읽어 Spring 로그아웃 API를 호출한 뒤 세션을 파기합니다.

export async function logout() {
  const token = await getToken({
    req: { headers: await headers() } as Parameters<typeof getToken>[0]['req'],
    secret: process.env.AUTH_SECRET!,
  });

  if (token?.refreshToken) {
    await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    }).catch(() => {});
  }

  await signOut({ redirectTo: '/login' });
}

// ─── 서버 fetch ───────────────────────────────────────────────────────────────

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

// ─── 비밀번호 변경 (기존 비밀번호 입력 방식) ─────────────────────────────────

interface ChangePasswordWithCurrentParams {
  currentPassword: string;
  newPassword: string;
  passwordConfirm: string;
}

interface ChangePasswordWithCurrentResult {
  ok: boolean;
  fieldErrors?: Partial<
    Record<'currentPassword' | 'newPassword' | 'passwordConfirm', string>
  >;
  errorMessage?: string;
}

export async function changePasswordWithCurrent({
  currentPassword,
  newPassword,
  passwordConfirm,
}: ChangePasswordWithCurrentParams): Promise<ChangePasswordWithCurrentResult> {
  const parsed = changePasswordWithCurrentSchema.safeParse({
    currentPassword,
    newPassword,
    passwordConfirm,
  });

  if (!parsed.success) {
    const fieldErrors: ChangePasswordWithCurrentResult['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const res = await serverFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (res.status === 401) {
    return {
      ok: false,
      fieldErrors: { currentPassword: '현재 비밀번호가 일치하지 않습니다.' },
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      errorMessage: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.',
    };
  }

  return { ok: true };
}
