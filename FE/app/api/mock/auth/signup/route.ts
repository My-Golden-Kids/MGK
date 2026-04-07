import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password, accountNum } = await request.json();

  if (!email || !password || !accountNum) {
    return NextResponse.json({ message: '필수 항목을 입력해주세요' }, { status: 400 });
  }

  // 이미 가입된 이메일 시뮬레이션
  if (email === 'duplicate@test.com') {
    return NextResponse.json({ message: '이미 사용 중인 이메일입니다' }, { status: 409 });
  }

  console.log('[MOCK] 회원가입 성공:', { email, accountNum });

  return NextResponse.json({ success: true }, { status: 200 });
}
