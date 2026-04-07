'use client';

import BackButton from '@/components/common/BackButton';
import ModalButton from '@/components/common/ModalButton';
import Image from 'next/image';
import { useState } from 'react';

export default function FindPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'notFound' | 'sendError';
    message: string;
  } | null>(null);

  const handleSendLink = () => {
    if (!email.trim()) {
      setStatus({
        type: 'notFound',
        message: '해당하는 아이디가 없습니다.',
      });
      return;
    }

    if (email.toLowerCase().includes('fail')) {
      setStatus({
        type: 'sendError',
        message: '이메일 전송 실패',
      });
      return;
    }

    setStatus({
      type: 'success',
      message: '이메일 링크 전송 완료!',
    });
  };

  return (
    <main className="relative min-h-dvh bg-white px-10 pt-10">
      <div className="absolute top-4 left-4 z-40">
        <BackButton />
      </div>
      <section className="flex flex-col items-center text-center">
        <h1 className="text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
          비밀번호 찾기
        </h1>
        <Image
          src="/images/onboarding/logo.png"
          alt="MGK logo"
          width={1323}
          height={813}
          priority
          sizes="(max-width: 420px) 260px, (max-width: 768px) 420px, 480px"
          className="mt-10 mb-6 h-auto w-[87%] max-w-[400px] md:w-[84%] lg:w-[75%]"
        />
        <form
          className="mt-10 flex w-full max-w-auto flex-col items-center"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendLink();
          }}
        >
          <div className="flex w-full flex-col items-center gap-4">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-4 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            />
            <p className="text-center text-[15px] text-[#8E8E8E] sm:text-[15px] md:text-[18px] lg:text-[22px]">
              가입한 이메일로 로그인 링크를 보내드립니다.
            </p>
          </div>

          <div className="mt-30 flex w-full flex-col items-center gap-2">
            <div className="flex min-h-[24px] items-center justify-center sm:min-h-[24px] md:min-h-[30px] lg:min-h-[36px]">
              {status && (
                <p
                  className={`text-center text-[16px] font-medium sm:text-[16px] md:text-[20px] lg:text-[24px] ${
                    status.type === 'success' ? 'text-[#34CB5F]' : 'text-[#DC1F1F]'
                  }`}
                >
                  {status.message}
                </p>
              )}
            </div>
            <ModalButton
              type="submit"
              className="py-4 text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            >
              링크 보내기
            </ModalButton>
          </div>
        </form>
      </section>
    </main>
  );
}
