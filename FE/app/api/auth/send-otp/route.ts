import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    // Spring AuthController: POST /api/auth/send-otp
    // Request:  { email: string }
    // Response: { token: string }
    const springRes = await fetch(`${process.env.SPRING_API_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!springRes.ok) {
      return NextResponse.json({ error: '인증 요청에 실패했습니다.' }, { status: springRes.status });
    }

    const { token } = await springRes.json();
    const magicLink = `${process.env.NEXTAUTH_URL}/login/verify?token=${token}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: '로그인 링크',
      html: `
        <p>아래 버튼을 클릭하면 로그인됩니다. 링크는 일정 시간 후 만료됩니다.</p>
        <a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#2D6A4F;color:#fff;border-radius:8px;text-decoration:none;">
          로그인하기
        </a>
        <p style="color:#888;font-size:12px;">버튼이 작동하지 않으면 아래 링크를 복사해 브라우저에 붙여넣으세요.<br/>${magicLink}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
