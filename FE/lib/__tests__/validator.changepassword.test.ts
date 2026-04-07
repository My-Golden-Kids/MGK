import { describe, it, expect } from 'vitest';
import {
  changePasswordSchema,
  changePasswordWithCurrentSchema,
  validateChangePasswordField,
} from '../validator';

describe('changePasswordSchema (매직링크 방식)', () => {
  it('8자 미만 → 에러', () => {
    const r = changePasswordSchema.safeParse({ newPassword: 'Ab1!', passwordConfirm: 'Ab1!' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch('8글자');
  });

  it('영문자 없음 → 에러', () => {
    const r = changePasswordSchema.safeParse({ newPassword: '12345678!', passwordConfirm: '12345678!' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch('영문자');
  });

  it('특수기호 없음 → 에러', () => {
    const r = changePasswordSchema.safeParse({ newPassword: 'Password1', passwordConfirm: 'Password1' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch('특수기호');
  });

  it('비밀번호 불일치 → 에러', () => {
    const r = changePasswordSchema.safeParse({ newPassword: 'NewPass1!', passwordConfirm: 'Different1!' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch('일치하지 않습니다');
  });

  it('정상 케이스 → 성공', () => {
    const r = changePasswordSchema.safeParse({ newPassword: 'NewPass1!', passwordConfirm: 'NewPass1!' });
    expect(r.success).toBe(true);
  });
});

describe('changePasswordWithCurrentSchema (기존 비밀번호 방식)', () => {
  it('현재 비밀번호 빈값 → 에러', () => {
    const r = changePasswordWithCurrentSchema.safeParse({
      currentPassword: '',
      newPassword: 'NewPass1!',
      passwordConfirm: 'NewPass1!',
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch('현재 비밀번호');
  });

  it('신규 비밀번호 형식 미달 → 에러', () => {
    const r = changePasswordWithCurrentSchema.safeParse({
      currentPassword: 'Old1!',
      newPassword: 'short',
      passwordConfirm: 'short',
    });
    expect(r.success).toBe(false);
  });

  it('현재 비밀번호 = 신규 비밀번호 → 에러', () => {
    const r = changePasswordWithCurrentSchema.safeParse({
      currentPassword: 'Test1234!',
      newPassword: 'Test1234!',
      passwordConfirm: 'Test1234!',
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch('다른 비밀번호');
  });

  it('확인 불일치 → 에러', () => {
    const r = changePasswordWithCurrentSchema.safeParse({
      currentPassword: 'Test1234!',
      newPassword: 'NewPass1!',
      passwordConfirm: 'Wrong1!',
    });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toMatch('일치하지 않습니다');
  });

  it('정상 케이스 → 성공', () => {
    const r = changePasswordWithCurrentSchema.safeParse({
      currentPassword: 'Test1234!',
      newPassword: 'NewPass1!',
      passwordConfirm: 'NewPass1!',
    });
    expect(r.success).toBe(true);
  });
});

describe('validateChangePasswordField', () => {
  it('newPassword - 8자 미만 → 에러', () => {
    expect(validateChangePasswordField('newPassword', 'Ab1!')).toMatch('8글자');
  });

  it('newPassword - 현재 비번과 동일 → 에러', () => {
    const e = validateChangePasswordField('newPassword', 'SamePass1!', { currentPassword: 'SamePass1!' });
    expect(e).toMatch('다른 비밀번호');
  });

  it('newPassword - 정상 → 빈 문자열', () => {
    expect(validateChangePasswordField('newPassword', 'NewPass1!', { currentPassword: 'Old1234!' })).toBe('');
  });

  it('passwordConfirm - 불일치 → 에러', () => {
    const e = validateChangePasswordField('passwordConfirm', 'Wrong1!', { newPassword: 'NewPass1!' });
    expect(e).toMatch('일치하지 않습니다');
  });

  it('passwordConfirm - 일치 → 빈 문자열', () => {
    expect(validateChangePasswordField('passwordConfirm', 'NewPass1!', { newPassword: 'NewPass1!' })).toBe('');
  });

  it('currentPassword - 빈값 → 에러', () => {
    expect(validateChangePasswordField('currentPassword', '')).toMatch('현재 비밀번호');
  });

  it('currentPassword - 값 있음 → 빈 문자열', () => {
    expect(validateChangePasswordField('currentPassword', 'Test1234!')).toBe('');
  });
});
