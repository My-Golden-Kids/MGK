'use client';

import { Button } from '@/components/common/Button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function NotFoundPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/home');
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white text-center p-10">
      <div className="flex flex-1 flex-col items-center justify-around">
        <h1 className="text-[28px] sm:text-[28px] md:text-[34px] lg:text-[40px] leading-[1.9] text-[#111111]">
          페이지를
          <br />
          찾을 수 없습니다.
        </h1>

        <div className="">
          <Image
            src="/images/error/error1.png"
            alt="페이지를 찾을 수 없을 때 표시되는 안내 이미지"
            width={212}
            height={221}
            priority
            className="h-auto w-[200px] sm:w-[200px] md:w-[250px] lg:w-[300px]"
          />
        </div>
        <Button
          type="button"
          onClick={handleGoBack}
          className="w-full"
        >
          뒤로가기
        </Button>
      </div>
    </main>
  );
}
