'use server';

import { auth } from '@/app/api/auth/[...nextauth]/route';
import { changePasswordWithCurrentSchema } from '@/lib/validator';

const BASE_URL =
  process.env.SPRING_API_URL ?? process.env.NEXT_PUBLIC_SPRING_API_URL ?? '';

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
  fieldErrors?: Partial<Record<'currentPassword' | 'newPassword' | 'passwordConfirm', string>>;
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
    return { ok: false, fieldErrors: { currentPassword: '현재 비밀번호가 일치하지 않습니다.' } };
  }

  if (!res.ok) {
    return { ok: false, errorMessage: '비밀번호 변경에 실패했습니다. 다시 시도해주세요.' };
  }

  return { ok: true };
}
