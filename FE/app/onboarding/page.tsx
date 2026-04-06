'use client';

import Image from 'next/image';
import { memo, useEffect, useRef, useState } from 'react';

import TalkBubble from '@/components/home/talk/TalkBubble';
import TalkChoiceButtons from '@/components/home/talk/TalkChoiceButtons';

const TRANSITION_DELAY_MS = 2000;
const DISSOLVE_DURATION_MS = 1600;

type OnboardingStep = {
  id: string;
  message: string;
  instruction?: string;
  showChoiceButtons?: boolean;
  autoAdvanceDelay?: number;
};

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'intro',
    message: '안녕하세요\n저는 어르신을\n도와드릴 별송이에요!',
    instruction: '핸드폰\n옆의 버튼을 눌러\n소리를 키워주세요!',
    autoAdvanceDelay: TRANSITION_DELAY_MS,
  },
  {
    id: 'volume-guide',
    message: '제 목소리가\n잘 들리시면 동그라미\n버튼을 눌러주세요',
    showChoiceButtons: true,
  },
];

const bubbleClassName =
  'mx-0 rounded-[2rem] bg-[#75A39D] shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:rounded-[2.25rem] lg:rounded-[2.5rem]';
const bubbleTextClassName =
  'text-2xl font-semibold break-keep md:text-3xl lg:text-4xl';

const backgroundImageClassName = 'object-contain object-center opacity-90';
const characterImageClassName =
  '-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[min(23dvh,68vw)] w-auto max-w-[94vw] md:h-[min(26dvh,72vw)] lg:h-[min(30dvh,76vw)]';

const OnboardingOverlay = memo(function OnboardingOverlay({
  step,
  isVisible,
}: {
  step: OnboardingStep;
  isVisible: boolean;
}) {
  return (
    <section
      aria-hidden={!isVisible}
      className={`absolute inset-0 transition-opacity duration-[450ms] ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
        <div className="">
          <TalkBubble
            message={step.message}
            bubbleClassName={bubbleClassName}
            textClassName={bubbleTextClassName}
          />
        </div>
        {step.showChoiceButtons ? (
          <div className="-translate-x-1/2 absolute right-auto bottom-[9%] left-1/2 w-full max-w-[24rem] md:bottom-[8%] md:max-w-[26rem] lg:bottom-[7%] lg:max-w-[30rem]">
            <TalkChoiceButtons yesSymbolClassName="text-black" />
          </div>
        ) : step.instruction ? (
          <p className="-translate-x-1/2 absolute bottom-[10%] left-1/2 whitespace-pre-line text-center font-normal text-2xl text-black leading-[1.4] md:bottom-[9%] md:text-[1.7rem] lg:bottom-[8%] lg:text-[1.9rem]">
            {step.instruction}
          </p>
        ) : null}
      </div>
    </section>
  );
});

export default function OnboardingPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nextStepIndex, setNextStepIndex] = useState<number | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const advanceTimeoutRef = useRef<number | null>(null);
  const dissolveTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const currentStep = onboardingSteps[currentStepIndex];

    if (
      currentStep.autoAdvanceDelay === undefined ||
      currentStepIndex >= onboardingSteps.length - 1
    ) {
      return undefined;
    }

    advanceTimeoutRef.current = window.setTimeout(() => {
      setNextStepIndex(currentStepIndex + 1);
      animationFrameRef.current = window.requestAnimationFrame(() => {
        setIsDissolving(true);
      });

      dissolveTimeoutRef.current = window.setTimeout(() => {
        setCurrentStepIndex((prevIndex) =>
          Math.min(prevIndex + 1, onboardingSteps.length - 1),
        );
        setNextStepIndex(null);
        setIsDissolving(false);
      }, DISSOLVE_DURATION_MS);
    }, currentStep.autoAdvanceDelay);

    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }

      if (dissolveTimeoutRef.current !== null) {
        window.clearTimeout(dissolveTimeoutRef.current);
      }

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentStepIndex]);

  const currentStep = onboardingSteps[currentStepIndex];
  const nextStep =
    nextStepIndex !== null ? onboardingSteps[nextStepIndex] : null;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#A7E9E1]">
      <div className="pointer-events-none absolute inset-0 animate-breathing-circle">
        <Image
          src="/images/onboarding/circle2.png"
          alt=""
          fill
          priority
          className={backgroundImageClassName}
        />
      </div>
      <Image
        src="/images/onboarding/byeolsong.png"
        alt="Byeolsong"
        width={1035}
        height={1035}
        priority
        className={characterImageClassName}
      />
      <OnboardingOverlay step={currentStep} isVisible={!isDissolving} />
      <OnboardingOverlay
        step={nextStep ?? currentStep}
        isVisible={nextStep !== null && isDissolving}
      />
    </main>
  );
}
