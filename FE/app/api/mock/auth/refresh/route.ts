import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { refreshToken } = await request.json();

  if (refreshToken !== 'mock-refresh-token') {
    return NextResponse.json(
      { message: '유효하지 않은 리프레시 토큰입니다' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    accessToken: 'mock-access-token-refreshed',
  });
}
