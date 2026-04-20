'use client';

import Image from 'next/image';
import { useState } from 'react';
import BackButton from '@/components/common/BackButton';
import ModalButton from '@/components/common/ModalButton';
import { sendOtp } from '@/lib/client-fetch';

export default function FindPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendLink = async () => {
    if (!email.trim()) {
      setStatus({ type: 'error', message: '이메일을 입력해주세요.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const result = await sendOtp({ email, type: 'reset' });

    setIsSubmitting(false);

    if (result.ok) {
      setStatus({
        type: 'success',
        message: '비밀번호 재설정 링크를 전송했어요!',
      });
    } else {
      setStatus({
        type: 'error',
        message:
          result.errorMessage ??
          '해당하는 계정이 없거나 이메일 전송에 실패했어요.',
      });
    }
  };

  return (
    <main className="min-h-dvh bg-white p-10">
      <section className="flex h-full flex-col items-center justify-between text-center">
        <div className="relative mb-8 flex w-full items-center justify-center">
          <h1 className="text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
            비밀번호 찾기
          </h1>
          <div className="-translate-y-1/2 absolute top-1/2 left-0">
            <BackButton />
          </div>
        </div>
        <Image
          src="/images/onboarding/logo.png"
          alt="MGK logo"
          width={1323}
          height={813}
          priority
          sizes="(max-width: 420px) 260px, (max-width: 768px) 420px, 480px"
          className="mb-8 h-auto w-[87%] max-w-[400px] md:w-[84%] lg:w-[75%]"
        />
        <form
          className="flex w-full max-w-auto flex-col items-center"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendLink();
          }}
        >
          <div className="flex w-full flex-col items-center gap-3">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-3 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            />
            <p className="text-center text-[#8E8E8E] text-[15px] sm:text-[15px] md:text-[18px] lg:text-[22px]">
              가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.
            </p>
          </div>

          <div className="mt-26.75 mb-36.5 flex w-full flex-col items-center gap-2">
            <div className="flex min-h-[24px] items-center justify-center sm:min-h-[24px] md:min-h-[30px] lg:min-h-[36px]">
              {status && (
                <p
                  className={`text-center font-medium text-[16px] sm:text-[16px] md:text-[20px] lg:text-[24px] ${
                    status.type === 'success'
                      ? 'text-[#34CB5F]'
                      : 'text-[#DC1F1F]'
                  }`}
                >
                  {status.message}
                </p>
              )}
            </div>
            <ModalButton
              type="submit"
              disabled={isSubmitting}
              className="py-4 text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            >
              {isSubmitting ? '전송 중...' : '링크 보내기'}
            </ModalButton>
          </div>
        </form>
      </section>
    </main>
  );
}
