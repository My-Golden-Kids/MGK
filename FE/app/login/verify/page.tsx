'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useEffect, useState } from 'react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      return;
    }

    signIn('magic-link', { token, redirect: false }).then((result) => {
      if (result?.ok) {
        router.replace('/home');
      } else {
        setStatus('error');
      }
    });
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-gray-500">
          링크가 만료되었거나 유효하지 않아요.
        </p>
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="rounded-[10px] bg-main-green px-6 py-2.5 text-white"
        >
          로그인으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6">
      <p className="text-center text-gray-500">로그인 중이에요...</p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6">
          <p className="text-center text-gray-500">로그인 중이에요...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
