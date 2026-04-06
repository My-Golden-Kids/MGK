'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsExiting(true);
    }, 1500);

    const navigationId = window.setTimeout(() => {
      router.push('/onboarding');
    }, 1700);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(navigationId);
    };
  }, [router]);

  return (
    <main
      className={`relative h-dvh overflow-hidden bg-[#018D70] transition-opacity duration-200 ease-out ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/onboarding/circle.png"
          alt=""
          fill
          priority
          sizes="(max-width: 420px) 100vw, (max-width: 768px) 500px, 640px"
          className="object-cover object-center opacity-90"
        />
      </div>
      <div className="relative z-10 h-full px-3 py-[1vh]">
        <Image
          src="/images/onboarding/logo.png"
          alt="MGK logo"
          width={1323}
          height={813}
          priority
          sizes="(max-width: 420px) 360px, (max-width: 768px) 420px, 480px"
          className="-translate-x-1/2 absolute top-[4%] left-1/2 h-auto w-[87%] max-w-[480px] md:w-[84%] lg:w-[75%]"
        />
        <Image
          src="/images/onboarding/protagonist.png"
          alt="Main character"
          width={1855}
          height={1210}
          priority
          sizes="(max-width: 420px) 320px, (max-width: 768px) 380px, 430px"
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-auto w-[82%] max-w-[430px] md:w-[80%] lg:w-[76%]"
        />
        <Image
          src="/images/onboarding/characters.png"
          alt="Supporting characters"
          width={1940}
          height={1460}
          priority
          sizes="(max-width: 420px) 350px, (max-width: 768px) 420px, 440px"
          className="-translate-x-1/2 absolute bottom-[1%] left-1/2 h-auto w-[90%] max-w-[500px] md:w-[88%] lg:w-[74%]"
        />
      </div>
    </main>
  );
}
