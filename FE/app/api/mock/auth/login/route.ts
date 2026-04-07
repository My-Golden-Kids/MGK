import { NextResponse } from 'next/server';

// 테스트 계정
const MOCK_USER = {
  email: 'test@test.com',
  password: 'Test1234!',
};

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (email !== MOCK_USER.email || password !== MOCK_USER.password) {
    return NextResponse.json(
      { message: '이메일 또는 비밀번호가 올바르지 않습니다' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 'mock-user-id',
      email: MOCK_USER.email,
    },
  });
}
