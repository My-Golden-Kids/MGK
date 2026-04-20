'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';

import PetProfileImage from '@/components/home/pet/PetProfileImage';
import TalkBubble from '@/components/home/talk/TalkBubble';

type OnboardingBackgroundProps = {
  bubbleMessage?: string;
  bubbleMessageFrames?: string[];
  children?: ReactNode;
  centerImageUrl?: string;
  isCenterImageInteractive?: boolean;
  onCenterImageClick?: () => void;
  instructionMessage?: string;
};

export default function OnboardingBackground({
  bubbleMessage,
  bubbleMessageFrames,
  children,
  centerImageUrl,
  isCenterImageInteractive = false,
  onCenterImageClick,
  instructionMessage,
}: OnboardingBackgroundProps) {
  const centerMediaClassName = centerImageUrl
    ? 'h-[220px] w-[220px] md:h-[260px] md:w-[260px] lg:h-[300px] lg:w-[300px]'
    : 'h-[180px] w-[180px] md:h-[240px] md:w-[240px] lg:h-[280px] lg:w-[280px]';

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#A7E9E1]">
      <div
        className={`-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 ${centerMediaClassName} animate-ripple-circle`}
      >
        <Image
          src="/images/onboarding/circle2.png"
          alt=""
          width={300}
          height={300}
          priority
          className="h-full w-full object-contain opacity-80"
        />
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
        <PetProfileImage
          imageUrl={centerImageUrl}
          onClick={isCenterImageInteractive ? onCenterImageClick : undefined}
          className={`${centerMediaClassName} ${
            isCenterImageInteractive ? '' : 'cursor-default'
          }`}
          aria-label="Onboarding pet profile"
        />
      </div>
      {bubbleMessage ? (
        <div className="-translate-x-1/2 absolute top-[5.5rem] left-1/2 z-10 flex w-[calc(100%-3rem)] max-w-[22rem] flex-col items-center md:max-w-[24rem] lg:max-w-[26rem]">
          <TalkBubble
            message={bubbleMessage}
            messageFrames={bubbleMessageFrames}
            className="w-full"
            bubbleClassName="w-full overflow-hidden rounded-[2rem] bg-[#75A39D] shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:rounded-[2.25rem] lg:rounded-[2.5rem]"
            contentClassName="px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7"
            textClassName="whitespace-pre-line break-keep text-start font-semibold text-2xl text-white leading-[1.35] md:text-3xl lg:text-4xl"
          />
        </div>
      ) : null}
      {instructionMessage ? (
        <p className="-translate-x-1/2 absolute bottom-[10%] left-1/2 z-10 whitespace-pre-line text-center font-normal text-2xl text-black leading-[1.4] md:bottom-[9%] md:text-[1.7rem] lg:bottom-[8%] lg:text-[1.9rem]">
          {instructionMessage}
        </p>
      ) : null}
      {children}
    </div>
  );
}
