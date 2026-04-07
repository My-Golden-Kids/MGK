import { NextResponse } from 'next/server';

// send-otp mock에서 발급한 토큰과 일치해야 함
const MOCK_TOKEN = 'mock-magic-token';

export async function POST(request: Request) {
  const { token } = await request.json();

  if (token !== MOCK_TOKEN) {
    return NextResponse.json(
      { message: '유효하지 않거나 만료된 토큰입니다' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 'mock-user-id',
      email: 'test@test.com',
    },
  });
}
