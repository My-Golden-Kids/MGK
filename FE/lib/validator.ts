import { compare, hash } from 'bcryptjs';
import { z } from 'zod';

export const encryptPasswd = async (plainPasswd: string) =>
  hash(plainPasswd, 10);

export const comparePassword = async (plainPasswd: string, encPasswd: string) =>
  compare(plainPasswd, encPasswd);

export type ValidError = {
  error: Record<string, string | undefined>;
  data: Record<string, string | undefined | null>;
};

export const signupSchema = z.object({
  email: z.email('유효하지 않은 이메일 형식입니다').min(1, '입력해주세요'),
  password: z
    .string()
    .min(8, '8글자 이상 입력해주세요')
    .regex(/[a-zA-Z]/, '영문자를 포함해주세요')
    .regex(/[\^!*-]/, '특수기호(^!*-)를 포함해주세요'),
  passwordConfirm: z.string().min(1, '입력해주세요'),
  accountNum: z
    .string()
    .min(5, '5자리 이상 입력해주세요')
    .regex(/^\d+$/, '숫자만 입력해주세요'),
});

export type SignupValues = z.infer<typeof signupSchema>;

/**
 * 회원가입 단계별 단일 필드 검증 함수
 *
 * @param key - signupSchema의 필드명
 * @param value - 검증할 입력값
 * @param ctx - passwordConfirm 검증 시 비교할 password 값
 * @returns 에러 메시지 문자열 (유효하면 빈 문자열)
 */
// ─── 비밀번호 변경 스키마 ────────────────────────────────────────────────────

const newPasswordField = z
  .string()
  .min(8, '8글자 이상 입력해주세요')
  .regex(/[a-zA-Z]/, '영문자를 포함해주세요')
  .regex(/[\^!*-]/, '특수기호(^!*-)를 포함해주세요');

/** 매직링크 방식: 새 비밀번호 + 확인 */
export const changePasswordSchema = z
  .object({
    newPassword: newPasswordField,
    passwordConfirm: z.string().min(1, '입력해주세요'),
  })
  .refine((d) => d.newPassword === d.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  });

/** 기존 비밀번호 입력 방식: 현재 비밀번호 + 새 비밀번호 + 확인 */
export const changePasswordWithCurrentSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: newPasswordField,
    passwordConfirm: z.string().min(1, '입력해주세요'),
  })
  .refine((d) => d.newPassword === d.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['passwordConfirm'],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: '현재 비밀번호와 다른 비밀번호를 입력해주세요',
    path: ['newPassword'],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type ChangePasswordWithCurrentValues = z.infer<typeof changePasswordWithCurrentSchema>;

/**
 * 비밀번호 변경 필드별 단일 검증 함수
 *
 * @param key - 검증할 필드명
 * @param value - 검증할 값
 * @param ctx - passwordConfirm 검증 시 비교용 / newPassword 중복 체크용
 */
export function validateChangePasswordField(
  key: keyof ChangePasswordWithCurrentValues,
  value: string,
  ctx?: { newPassword?: string; currentPassword?: string },
): string {
  if (key === 'passwordConfirm') {
    if (!value.trim()) return '입력해주세요';
    return value === ctx?.newPassword ? '' : '비밀번호가 일치하지 않습니다';
  }

  if (key === 'newPassword' && ctx?.currentPassword) {
    const baseResult = newPasswordField.safeParse(value);
    if (!baseResult.success) return baseResult.error.issues[0]?.message ?? '입력값이 올바르지 않습니다';
    if (value === ctx.currentPassword) return '현재 비밀번호와 다른 비밀번호를 입력해주세요';
    return '';
  }

  if (key === 'currentPassword') {
    return value.trim() ? '' : '현재 비밀번호를 입력해주세요';
  }

  const result = newPasswordField.safeParse(value);
  return result.success
    ? ''
    : (result.error.issues[0]?.message ?? '입력값이 올바르지 않습니다');
}

export function validateSignupField(
  key: keyof SignupValues,
  value: string,
  ctx?: { password?: string },
): string {
  if (key === 'passwordConfirm') {
    if (!value.trim()) return '입력해주세요';
    return value === ctx?.password ? '' : '비밀번호가 일치하지 않습니다';
  }

  const result = signupSchema.shape[key].safeParse(value);
  return result.success
    ? ''
    : (result.error.issues[0]?.message ?? '입력값이 올바르지 않습니다');
}
