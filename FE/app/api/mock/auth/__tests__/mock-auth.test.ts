import { describe, expect, it } from 'vitest';
import { POST as loginPOST } from '../login/route';
import { POST as refreshPOST } from '../refresh/route';
import { POST as sendOtpPOST } from '../send-otp/route';
import { POST as signupPOST } from '../signup/route';
import { POST as verifyPOST } from '../verify/route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── POST /api/mock/auth/login ───────────────────────────────────────────────

describe('POST /api/mock/auth/login', () => {
  it('올바른 자격증명으로 로그인 성공 시 accessToken, refreshToken, user 반환', async () => {
    const res = await loginPOST(
      makeRequest({ email: 'test@test.com', password: 'Test1234!' }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'mock-user-id', email: 'test@test.com' },
    });
  });

  it('비밀번호 틀리면 401 반환', async () => {
    const res = await loginPOST(
      makeRequest({ email: 'test@test.com', password: 'wrong' }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });

  it('존재하지 않는 이메일은 401 반환', async () => {
    const res = await loginPOST(
      makeRequest({ email: 'nobody@test.com', password: 'Test1234!' }),
    );
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/mock/auth/signup ──────────────────────────────────────────────

describe('POST /api/mock/auth/signup', () => {
  it('필수 항목 모두 제공 시 회원가입 성공', async () => {
    const res = await signupPOST(
      makeRequest({
        email: 'new@test.com',
        password: 'Test1234!',
        accountNum: '12345678',
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('이메일 누락 시 400 반환', async () => {
    const res = await signupPOST(
      makeRequest({ password: 'Test1234!', accountNum: '12345678' }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });

  it('비밀번호 누락 시 400 반환', async () => {
    const res = await signupPOST(
      makeRequest({ email: 'new@test.com', accountNum: '12345678' }),
    );
    expect(res.status).toBe(400);
  });

  it('계좌번호 누락 시 400 반환', async () => {
    const res = await signupPOST(
      makeRequest({ email: 'new@test.com', password: 'Test1234!' }),
    );
    expect(res.status).toBe(400);
  });

  it('중복 이메일(duplicate@test.com)은 409 반환', async () => {
    const res = await signupPOST(
      makeRequest({
        email: 'duplicate@test.com',
        password: 'Test1234!',
        accountNum: '12345678',
      }),
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });
});

// ─── POST /api/mock/auth/send-otp ────────────────────────────────────────────

describe('POST /api/mock/auth/send-otp', () => {
  it('이메일 제공 시 mock-magic-token 반환', async () => {
    const res = await sendOtpPOST(makeRequest({ email: 'user@test.com' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.token).toBe('mock-magic-token');
  });

  it('이메일 누락 시 400 반환', async () => {
    const res = await sendOtpPOST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });
});

// ─── POST /api/mock/auth/verify ──────────────────────────────────────────────

describe('POST /api/mock/auth/verify', () => {
  it('유효한 mock 토큰으로 accessToken, refreshToken, user 반환', async () => {
    const res = await verifyPOST(makeRequest({ token: 'mock-magic-token' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'mock-user-id', email: 'test@test.com' },
    });
  });

  it('잘못된 토큰은 401 반환', async () => {
    const res = await verifyPOST(makeRequest({ token: 'invalid-token' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });
});

// ─── POST /api/mock/auth/refresh ─────────────────────────────────────────────

describe('POST /api/mock/auth/refresh', () => {
  it('유효한 refreshToken으로 새 accessToken 반환', async () => {
    const res = await refreshPOST(
      makeRequest({ refreshToken: 'mock-refresh-token' }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accessToken).toBe('mock-access-token-refreshed');
  });

  it('잘못된 refreshToken은 401 반환', async () => {
    const res = await refreshPOST(
      makeRequest({ refreshToken: 'expired-token' }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });
});
