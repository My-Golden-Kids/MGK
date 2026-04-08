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
        callbackUrl: '/home',
      });

      if (result?.error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        router.replace('/home');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-white p-10">
      <section className="flex h-full flex-col items-center justify-between text-center">
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
          className="h-auto w-[87%] max-w-100 md:w-[84%] lg:w-[75%]"
        />
        <form
          className="flex w-full max-w-auto flex-col items-center"
          onSubmit={(event) => {
            event.preventDefault();
            void handleLogin();
          }}
        >
          <div className="flex w-full flex-col gap-4">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-3 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-3 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            />
          </div>
          <button
            type="button"
            onClick={() => router.push('/login/findpasswd')}
            className="mt-3 cursor-pointer text-[#8E8E8E] text-[17px] transition-opacity hover:text-black sm:text-[17px] md:text-[20px] lg:text-[28px]"
          >
            비밀번호를 잊으셨나요?
          </button>
          {error && <p className="text-error-red">{error}</p>}
          <div className="my-15 flex w-full flex-col gap-4">
            <ModalButton
              type="submit"
              disabled={isSubmitting}
              className="text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            >
              로그인
            </ModalButton>
            <ModalButton
              type="button"
              onClick={() => router.push('/signup')}
              className="bg-[#E6B319] text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            >
              회원가입
            </ModalButton>
          </div>
        </form>
      </section>
    </main>
  );
}
