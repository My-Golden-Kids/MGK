'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleDeleteAccountSuccess = () => {
    console.log('회원탈퇴 처리');
  };

  const handleDeleteAccount = () => {
    const trimmedPassword = password.trim();

    if (!trimmedPassword || trimmedPassword !== '1234') {
      setErrorMessage('비밀번호가 일치하지 않습니다');
      return;
    }

    setErrorMessage('');
    handleDeleteAccountSuccess();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F8F8F6]">
      <main className="flex flex-1 flex-col px-5 pt-8 sm:px-6 sm:pt-10 md:px-8 md:pt-12 lg:px-10 lg:pt-14">
        <header className="pb-16 md:pb-20 lg:pb-24">
          <h1 className="font-bold text-[#111111] text-[2rem] md:text-[2.4rem] lg:text-[2.8rem]">
            탈퇴
          </h1>
        </header>

        <section className="mx-auto flex w-full max-w-[340px] flex-1 flex-col pb-8 md:max-w-[400px] md:pb-10 lg:max-w-[460px] lg:pb-12">
          <div className="mb-16 text-center md:mb-20 lg:mb-24">
            <h2 className="font-extrabold text-[#111111] text-[2.05rem] md:text-[2.45rem] lg:text-[2.8rem]">
              탈퇴 전 확인하세요
            </h2>
            <p className="mt-5 font-semibold text-[#FF4C41] text-[1.4rem] leading-snug md:mt-6 md:text-[1.7rem] lg:text-[1.95rem]">
              탈퇴 시 모든 개인정보는
              <br />
              삭제되며 복구할 수 없습니다.
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-4 block font-medium text-[#1C1C1C] text-[1.7rem] md:text-[1.95rem] lg:text-[2.2rem]"
            >
              비밀번호를 입력해주세요
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => handlePasswordChange(event.target.value)}
              placeholder="******"
              className="w-full border-[#43C2C6] border-b-2 bg-transparent pb-3 font-medium text-[#222222] text-[2rem] tracking-[0.08em] outline-none placeholder:text-[#B4B4B4] md:text-[2.25rem] lg:text-[2.5rem]"
            />
            <p className="mt-4 min-h-[2rem] font-semibold text-[#FF3B30] text-[1.35rem] md:text-[1.55rem] lg:text-[1.75rem]">
              {errorMessage}
            </p>

            <div className="mt-8 flex gap-4 md:mt-10 md:gap-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-auto flex-1 rounded-[18px] border-[#B9B9B9] bg-white py-4 font-semibold text-[#222222] text-[1.7rem] hover:bg-[#F6F6F6] md:rounded-[20px] md:py-5 md:text-[2rem] lg:text-[2.25rem]"
              >
                취소하기
              </Button>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                className="h-auto flex-1 rounded-[18px] bg-[#F02222] py-4 font-semibold text-[1.7rem] text-white hover:bg-[#db1b1b] md:rounded-[20px] md:py-5 md:text-[2rem] lg:text-[2.25rem]"
              >
                탈퇴
              </Button>
            </div>
          </div>

          <div className="flex-1" />
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
