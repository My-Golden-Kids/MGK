'use client';

import { Button } from '@/components/common/Button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();

  const handleRefresh = () => {
    reset();
    router.refresh();
  };

  console.error(error);

  // throw new Error('test error'); // 50x 에러 페이지 테스트용 코드 (특정 페이지에서 return 전에 넣고 확인하시면 됩니다, 삭제하지 말아주세요)
  
  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white p-10 text-center">
      <div className="flex flex-1 flex-col items-center justify-around">
        <h1 className="text-[28px] leading-[1.9] text-[#111111] sm:text-[28px] md:text-[34px] lg:text-[40px]">
          연결이 좋지 않습니다.
          <br />
          다시 시도해 주세요.
        </h1>

        <div>
          <Image
            src="/images/error/error2.png"
            alt="연결 오류가 발생했을 때 표시되는 안내 이미지"
            width={212}
            height={221}
            priority
            className="h-auto w-[150px] sm:w-[180px] md:w-[200px] lg:w-[250px]"
          />
        </div>

        <Button type="button" onClick={handleRefresh} className="w-full">
          새로고침
        </Button>
      </div>
    </main>
  );
}
