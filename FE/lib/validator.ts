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
