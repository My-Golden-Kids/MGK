'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import { handleDeleteAccount } from '@/features/settings/api/settingApi';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    const trimmedPassword = password.trim();

    if (!trimmedPassword) {
      setErrorMessage('비밀번호를 입력해주세요');
      return;
    }

    const email = session?.user?.email;
    if (!email) {
      setErrorMessage('로그인 정보를 확인할 수 없습니다');
      return;
    }

    setIsLoading(true);
    const result = await handleDeleteAccount(email);
    setIsLoading(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage ?? '탈퇴 처리에 실패했습니다');
      return;
    }

    await signOut({ callbackUrl: '/login' });
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

            <div className="mt-10 flex gap-3 sm:mt-12 sm:gap-4 md:mt-14 md:gap-6 lg:mt-16 lg:gap-7">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-auto min-h-[58px] flex-[2] rounded-[16px] border-[#B9B9B9] bg-white py-3.5 font-semibold text-[#222222] text-[1.45rem] hover:bg-[#F6F6F6] sm:min-h-[68px] sm:rounded-[18px] sm:py-4 sm:text-[1.7rem] md:min-h-[84px] md:rounded-[22px] md:py-5.5 md:text-[2.2rem] lg:min-h-[96px] lg:rounded-[24px] lg:py-6.5 lg:text-[2.55rem]"
              >
                취소하기
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="h-auto min-h-[58px] flex-1 rounded-[16px] bg-[#F02222] py-3.5 font-semibold text-[1.45rem] text-white hover:bg-[#db1b1b] disabled:opacity-60 sm:min-h-[68px] sm:rounded-[18px] sm:py-4 sm:text-[1.7rem] md:min-h-[84px] md:rounded-[22px] md:py-5.5 md:text-[2.2rem] lg:min-h-[96px] lg:rounded-[24px] lg:py-6.5 lg:text-[2.55rem]"
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
