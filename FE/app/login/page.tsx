'use client';

import ModalButton from '@/components/common/ModalButton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function extractPetsTableData(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, unknown>;

  if (Array.isArray(data.pets)) {
    return data.pets;
  }

  if (data.user && typeof data.user === 'object') {
    const user = data.user as Record<string, unknown>;

    if (Array.isArray(user.pets)) {
      return user.pets;
    }
  }

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('login failed');
      }

      const data = (await response.json()) as unknown;
      const petsTableData = extractPetsTableData(data);
      const hasNoPetData =
        Array.isArray(petsTableData) && petsTableData.length === 0;

      router.push(hasNoPetData ? '/onboarding/7' : '/home');
    } catch (error) {
      console.error(error);
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
          onSubmit={(event) => {
            event.preventDefault();
            void handleLogin();
          }}
        >
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-4 text-start text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px] text-black outline-none placeholder:text-[#C4C4C4]"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-4 text-start text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px] text-black outline-none placeholder:text-[#C4C4C4]"
          />
          <button
            type="button"
            onClick={() => router.push('/login/findpasswd')}
            className="text-[17px] sm:text-[17px] md:text-[20px] lg:text-[28px] text-[#8E8E8E] transition-opacity hover:text-black cursor-pointer"
          >
            비밀번호를 잊으셨나요?
          </button>
          <div className="mt-2 flex w-full flex-col gap-3">
            <ModalButton
              type="submit"
              disabled={isSubmitting}
              className="py-4 text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px] disabled:cursor-not-allowed disabled:opacity-60"
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
