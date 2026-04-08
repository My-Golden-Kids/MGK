'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ROOT_EXIT_DELAY_MS = 200;
const HAND_HINT_FRAME_MS = 500;

function HandHint() {
  const [activeFrame, setActiveFrame] = useState<0 | 1>(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveFrame((currentFrame) => (currentFrame === 0 ? 1 : 0));
    }, HAND_HINT_FRAME_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute top-[55%] left-[40%] z-40 h-[96px] w-[96px] translate-x-[48px] md:h-[112px] md:w-[112px] md:translate-x-[56px] lg:h-[128px] lg:w-[128px] lg:translate-x-[64px]">
      <Image
        src="/images/onboarding/hand-finger.png"
        alt=""
        width={128}
        height={128}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-100 ${
          activeFrame === 0 ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <Image
        src="/images/onboarding/hand-click.png"
        alt=""
        width={128}
        height={128}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-100 ${
          activeFrame === 1 ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const navigationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleProtagonistClick = () => {
    if (isExiting) {
      return;
    }

    setIsExiting(true);
    navigationTimeoutRef.current = window.setTimeout(() => {
      router.push('/onboarding');
    }, ROOT_EXIT_DELAY_MS);
  };

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
        <button
          type="button"
          aria-label="온보딩 시작하기"
          onClick={handleProtagonistClick}
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-20 w-[82%] max-w-[430px] cursor-pointer md:w-[80%] lg:w-[76%]"
        >
          <Image
            src="/images/onboarding/protagonist.png"
            alt="Main character"
            width={1855}
            height={1210}
            priority
            sizes="(max-width: 420px) 320px, (max-width: 768px) 380px, 430px"
            className="h-auto w-full"
          />
        </button>
        <HandHint />
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
