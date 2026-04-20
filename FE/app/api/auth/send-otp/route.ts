import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 },
      );
    }

    const springRes = await fetch(
      `${process.env.SPRING_API_URL}/api/auth/send-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    );

    if (!springRes.ok) {
      return NextResponse.json(
        { error: '인증 요청에 실패했습니다.' },
        { status: springRes.status },
      );
    }

    const { token } = await springRes.json();

    const link =
      type === 'reset'
        ? `${process.env.AUTH_URL}/login/changepasswd?token=${token}`
        : `${process.env.AUTH_URL}/login/verify?token=${token}`;

    const isReset = type === 'reset';

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: isReset ? '비밀번호 재설정 링크' : '로그인 링크',
      html: `
        <p>${isReset ? '아래 버튼을 클릭하면 비밀번호를 재설정할 수 있습니다.' : '아래 버튼을 클릭하면 로그인됩니다.'} 링크는 일정 시간 후 만료됩니다.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2D6A4F;color:#fff;border-radius:8px;text-decoration:none;">
          ${isReset ? '비밀번호 재설정하기' : '로그인하기'}
        </a>
        <p style="color:#888;font-size:12px;">버튼이 작동하지 않으면 아래 링크를 복사해 브라우저에 붙여넣으세요.<br/>${link}</p>
      `,
    });

    if (error) {
      console.error('[Resend Error]', error);
      return NextResponse.json(
        { error: '이메일 발송에 실패했습니다.', detail: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-otp] 서버 오류:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
