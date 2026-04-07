import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ message: '이메일을 입력해주세요' }, { status: 400 });
  }

  // 실제 이메일 발송 없이 토큰 바로 반환
  // 매직링크 테스트: http://localhost:3000/login/verify?token=mock-magic-token
  console.log(`[MOCK] 매직링크 발송 → ${email}`);
  console.log('[MOCK] 테스트 링크: http://localhost:3000/login/verify?token=mock-magic-token');

  return NextResponse.json({ token: 'mock-magic-token' });
}
