import type {
  ChangePasswordParams,
  ChangePasswordResult,
  DeleteAccountResult,
} from '@/features/settings/types/settings';
import { clientFetch } from '@/lib/auth';
import { changePasswordWithCurrentSchema } from '@/lib/validator';

export async function handleChangePassword(
  params: ChangePasswordParams,
): Promise<ChangePasswordResult> {
  const parsed = changePasswordWithCurrentSchema.safeParse(params);

  if (!parsed.success) {
    const fieldErrors: ChangePasswordResult['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (!fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const res = await clientFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      currentPassword: params.currentPassword,
      newPassword: params.newPassword,
    }),
  });

  if (res.status === 401) {
    return {
      ok: false,
      fieldErrors: { currentPassword: '현재 비밀번호가 올바르지 않습니다' },
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      errorMessage: '비밀번호 변경에 실패했어요. 다시 시도해주세요.',
    };
  }

  return { ok: true };
}

export async function handleDeleteAccount(
  password: string,
): Promise<DeleteAccountResult> {
  const res = await clientFetch('/api/auth/delete-account', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

  if (res.status === 401) {
    return { ok: false, errorMessage: '비밀번호가 올바르지 않습니다.' };
  }

  if (!res.ok) {
    return { ok: false, errorMessage: '탈퇴 처리에 실패했습니다.' };
  }

  return { ok: true };
}

