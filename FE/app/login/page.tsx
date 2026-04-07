'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import ModalButton from '@/components/common/ModalButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn('email-password', {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.replace('/home');
      } else {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-white px-10 pt-10">
      <section className="flex flex-col items-center text-center">
        <h1 className="text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
          로그인
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
          className="mt-10 flex w-full max-w-auto flex-col items-center gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleLogin();
          }}
        >
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-4 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-4 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
          />
          <button
            type="button"
            onClick={() => router.push('/login/findpasswd')}
            className="cursor-pointer text-[17px] text-[#8E8E8E] transition-opacity hover:text-black sm:text-[17px] md:text-[20px] lg:text-[28px]"
          >
            비밀번호를 잊으셨나요?
          </button>
          {error && (
            <p className="text-[15px] font-medium text-red-500">{error}</p>
          )}
          <div className="mt-2 flex w-full flex-col gap-3">
            <ModalButton
              type="submit"
              disabled={isSubmitting}
              className="py-4 text-[20px] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[20px] md:text-[28px] lg:text-[34px]"
            >
              로그인
            </ModalButton>
            <ModalButton
              type="button"
              onClick={() => router.push('/signup')}
              className="bg-[#E6B319] py-4 text-[20px] text-white hover:brightness-105 sm:text-[20px] md:text-[28px] lg:text-[34px]"
            >
              회원가입
            </ModalButton>
          </div>
        </form>
      </section>
    </main>
  );
}
