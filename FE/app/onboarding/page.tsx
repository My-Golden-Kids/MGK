'use client';

import Image from 'next/image';
import { memo, useEffect, useRef, useState } from 'react';

import BackButton from '@/components/common/BackButton';
import TalkBubble from '@/components/home/talk/TalkBubble';
import TalkChoiceButtons from '@/components/home/talk/TalkChoiceButtons';

const TRANSITION_DELAY_MS = 1600;
const DISSOLVE_DURATION_MS = 1200;
const BUTTON_DISSOLVE_DURATION_MS = 0;

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
  {
    id: 'expense-guide',
    message: '우리 아이 사료값,\n병원비,...\n일일이 적기 힘드셨죠?',
    autoAdvanceDelay: TRANSITION_DELAY_MS,
  },
  {
    id: 'memory-guide',
    message: '이제 저한테 말씀만\n하세요! 제가 다\n기억해 드릴게요.',
    showChoiceButtons: true,
  },
  {
    id: 'schedule-guide',
    message: '그리고 병원 일정이나\n약 먹을 시간도\n잊지 않게 챙겨드려요.',
    autoAdvanceDelay: TRANSITION_DELAY_MS,
  },
  {
    id: 'health-guide',
    message: '우리 아이 건강,\n저 별송이랑 함께\n지켜요!',
    showChoiceButtons: true,
  },
  {
    id: 'pet-name-guide',
    message: '그럼 이제, 함께 사는\n예쁜 아이의 이름을\n알려주시겠어요?',
    instruction: '저를 누르고\n말씀해 주세요!',
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
  onBackClick,
  onYesClick,
  transitionDurationMs,
}: {
  step: OnboardingStep;
  isVisible: boolean;
  onBackClick?: () => void;
  onYesClick?: () => void;
  transitionDurationMs: number;
}) {
  return (
    <section
      aria-hidden={!isVisible}
      className={`absolute inset-0 transition-opacity ease-in-out ${
        isVisible ? 'pointer-events-auto' : 'pointer-events-none'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${transitionDurationMs}ms` }}
    >
      <div className="relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
        {step.id === 'expense-guide' || step.id === 'schedule-guide' ? (
          <div className="absolute top-4 left-4">
            <BackButton onClick={onBackClick} />
          </div>
        ) : null}
        <div className="">
          <TalkBubble
            message={step.message}
            bubbleClassName={bubbleClassName}
            textClassName={bubbleTextClassName}
          />
        </div>
        {step.showChoiceButtons ? (
          <div className="-translate-x-1/2 absolute right-auto bottom-[9%] left-1/2 w-full max-w-[24rem] md:bottom-[8%] md:max-w-[26rem] lg:bottom-[7%] lg:max-w-[30rem] [&_button]:cursor-pointer">
            <TalkChoiceButtons
              onYesClick={onYesClick}
              yesSymbolClassName="text-black"
            />
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
  const [transitionDurationMs, setTransitionDurationMs] =
    useState(DISSOLVE_DURATION_MS);
  const advanceTimeoutRef = useRef<number | null>(null);
  const dissolveTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startStepTransition = (
    targetIndex: number,
    durationMs = DISSOLVE_DURATION_MS,
  ) => {
    if (
      isDissolving ||
      targetIndex === currentStepIndex ||
      targetIndex < 0 ||
      targetIndex >= onboardingSteps.length
    ) {
      return;
    }

    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
    }

    if (dissolveTimeoutRef.current !== null) {
      window.clearTimeout(dissolveTimeoutRef.current);
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    setTransitionDurationMs(durationMs);
    setNextStepIndex(targetIndex);
    animationFrameRef.current = window.requestAnimationFrame(() => {
      setIsDissolving(true);
    });

    dissolveTimeoutRef.current = window.setTimeout(() => {
      setCurrentStepIndex(targetIndex);
      setNextStepIndex(null);
      setIsDissolving(false);
    }, durationMs);
  };

  useEffect(() => {
    const currentStep = onboardingSteps[currentStepIndex];

    if (
      currentStep.autoAdvanceDelay === undefined ||
      currentStepIndex >= onboardingSteps.length - 1
    ) {
      return undefined;
    }

    advanceTimeoutRef.current = window.setTimeout(() => {
      startStepTransition(currentStepIndex + 1);
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
      <OnboardingOverlay
        step={currentStep}
        isVisible={!isDissolving}
        onBackClick={() =>
          startStepTransition(currentStepIndex - 1, BUTTON_DISSOLVE_DURATION_MS)
        }
        onYesClick={
          currentStep.showChoiceButtons
            ? () =>
                startStepTransition(
                  currentStepIndex + 1,
                  BUTTON_DISSOLVE_DURATION_MS,
                )
            : undefined
        }
        transitionDurationMs={transitionDurationMs}
      />
      <OnboardingOverlay
        step={nextStep ?? currentStep}
        isVisible={nextStep !== null && isDissolving}
        onBackClick={undefined}
        onYesClick={undefined}
        transitionDurationMs={transitionDurationMs}
      />
    </main>
  );
}
