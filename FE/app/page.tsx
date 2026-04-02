"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsExiting(true);
    }, 1500);

    const navigationId = window.setTimeout(() => {
      router.push("/onboarding");
    }, 1700);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(navigationId);
    };
  }, [router]);

  return (
    <main
      className={`relative h-dvh overflow-hidden bg-[#018D70] transition-opacity duration-400 ease-in-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/images/onboarding/circle.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-90"
        />
      </div>
      <div className="relative z-10 h-full px-3 py-[1vh]">
        <Image
          src="/images/onboarding/logo.png"
          alt="MGK logo"
          width={300}
          height={169}
          priority
          className="absolute top-[5%] left-1/2 h-[min(21dvh,36vw)] w-auto -translate-x-1/2 md:h-[min(24dvh,42vw)] lg:h-[min(26dvh,44vw)]"
        />
        <Image
          src="/images/onboarding/protagonist.png"
          alt="Main character"
          width={371}
          height={252}
          priority
          className="absolute top-1/2 left-1/2 h-[min(26dvh,68vw)] w-auto max-w-[94vw] -translate-x-1/2 -translate-y-1/2 md:h-[min(28dvh,78vw)] lg:h-[min(30dvh,82vw)]"
        />
        <Image
          src="/images/onboarding/characters.png"
          alt="Supporting characters"
          width={358}
          height={272}
          priority
          className="absolute bottom-[1%] left-1/2 h-[min(32dvh,72vw)] w-auto max-w-[94vw] -translate-x-1/2 md:h-[min(34dvh,82vw)] lg:h-[min(36dvh,86vw)]"
        />
      </div>
    </main>
  );
}
