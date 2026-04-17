import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, accountNum } = await request.json();

    if (!email || !password || !accountNum) {
      return NextResponse.json(
        { error: '필수 값이 누락되었습니다.' },
        { status: 400 },
      );
    }

    const springRes = await fetch(
      `${process.env.SPRING_API_URL}/api/auth/signup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, accountNum }),
      },
    );

    if (!springRes.ok) {
      return NextResponse.json(
        { error: '회원가입에 실패했어요. 다시 시도해주세요.' },
        { status: springRes.status },
      );
    }

    const data = await springRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
