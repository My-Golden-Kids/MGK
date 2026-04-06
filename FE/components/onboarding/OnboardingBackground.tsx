import Image from 'next/image';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/common/EmptyState';

type OnboardingBackgroundProps = {
  bubbleMessage?: string;
  children: ReactNode;
};

export default function OnboardingBackground({
  bubbleMessage,
  children,
}: OnboardingBackgroundProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#A7E9E1]">
      <div className="pointer-events-none absolute inset-0 animate-breathing-circle">
        <Image
          src="/images/onboarding/circle2.png"
          alt=""
          fill
          priority
          className="object-contain object-center opacity-90"
        />
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
        <EmptyState
          size={240}
          className="md:[height:280px] md:[width:280px] lg:[height:320px] lg:[width:320px]"
        />
      </div>
      {bubbleMessage ? (
        <div className="-translate-x-1/2 absolute top-[5.5rem] left-1/2 z-10 flex w-[calc(100%-3rem)] max-w-[22rem] flex-col items-center md:top-[6.25rem] md:max-w-[24rem] lg:top-[7rem] lg:max-w-[26rem]">
          <section className="w-full">
            <div className="w-full overflow-hidden rounded-[2rem] bg-[#75A39D] shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:rounded-[2.25rem] lg:rounded-[2.5rem]">
              <div className="px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7">
                <p className="whitespace-pre-line break-keep text-start font-semibold text-2xl text-white leading-[1.35] md:text-3xl lg:text-4xl">
                  {bubbleMessage}
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {children}
    </main>
  );
}
