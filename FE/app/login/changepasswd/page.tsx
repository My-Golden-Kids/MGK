'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackButton from '@/components/common/BackButton';
import ModalButton from '@/components/common/ModalButton';

function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setStatus({ type: 'error', message: '비밀번호를 입력해주세요.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: '비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (!token) {
      setStatus({ type: 'error', message: '유효하지 않은 링크입니다.' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    setIsSubmitting(false);

    if (res.ok) {
      setStatus({ type: 'success', message: '비밀번호가 변경되었어요!' });
      setTimeout(() => router.replace('/login'), 1500);
    } else {
      setStatus({
        type: 'error',
        message: '링크가 만료되었거나 유효하지 않습니다.',
      });
    }
  };

  return (
    <main className="relative min-h-dvh bg-white px-10 pt-10">
      <div className="absolute top-4 left-4 z-40">
        <BackButton />
      </div>
      <section className="flex flex-col items-center text-center">
        <h1 className="text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
          비밀번호 변경
        </h1>

        <form
          className="mt-16 flex w-full flex-col items-center gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            type="password"
            placeholder="새 비밀번호"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-4 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-[10px] bg-[#EDEDED] px-5 py-4 text-start text-[20px] text-black outline-none placeholder:text-[#C4C4C4] sm:text-[20px] md:text-[28px] lg:text-[34px]"
          />

          <div className="mt-24 flex w-full flex-col items-center gap-2">
            <div className="flex min-h-[24px] items-center justify-center">
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
              disabled={isSubmitting}
              className="py-4 text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px]"
            >
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </ModalButton>
          </div>
        </form>
      </section>
    </main>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense>
      <ChangePasswordForm />
    </Suspense>
  );
}
