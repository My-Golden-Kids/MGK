'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { memo, useEffect, useRef, useState } from 'react';

import BackButton from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import TalkChoiceButtons from '@/components/home/talk/TalkChoiceButtons';
import OnboardingBackground from '@/components/onboarding/OnboardingBackground';

const TRANSITION_DELAY_MS = 1600;
const DISSOLVE_DURATION_MS = 1200;
const BUTTON_DISSOLVE_DURATION_MS = 0;

type OnboardingStep = {
  id: string;
  message: string;
  messageFrames?: string[];
  instruction?: string;
  showBackButton?: boolean;
  showCenterAction?: boolean;
  showChoiceButtons?: boolean;
  showStartButton?: boolean;
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
    showCenterAction: true,
  },
  {
    id: 'pet-name-confirm',
    message: '우리 아이의 이름이\n‘별멩이’가 맞나요?',
    showBackButton: true,
    showChoiceButtons: true,
  },
  {
    id: 'pet-photo-request',
    message:
      '우와, 별멩이! 정말\n예쁜 이름이네요.\n우리 별멩이 얼굴도 보고 싶은데,\n사진을 한 장 보여\n주시겠어요?',
    messageFrames: [
      '우와, 별멩이! 정말\n예쁜 이름이네요.\n우리 별멩이 얼굴도 보고 싶은데,',
      '예쁜 이름이네요.\n우리 별멩이 얼굴도 보고 싶은데,\n사진을 한 장 보여',
      '우리 별멩이 얼굴도 보고 싶은데,\n사진을 한 장 보여\n주시겠어요?',
    ],
    showBackButton: true,
    showChoiceButtons: true,
  },
  {
    id: 'pet-photo-complete',
    message: '준비가 다 됐어요!\n이제 별멩이와의 추억을\n함께 만들어가 볼까요?',
    autoAdvanceDelay: 1600,
  },
  {
    id: 'pet-chat-guide',
    message: '별멩이 사진을 누르면\n언제든 저와 대화하실\n수 있어요!',
    showStartButton: true,
  },
];

const OnboardingOverlay = memo(function OnboardingOverlay({
  step,
  isVisible,
  onBackClick,
  onYesClick,
  onStartClick,
  transitionDurationMs,
  centerImageUrl,
}: {
  step: OnboardingStep;
  isVisible: boolean;
  onBackClick?: () => void;
  onYesClick?: () => void;
  onStartClick?: () => void;
  transitionDurationMs: number;
  centerImageUrl?: string;
}) {
  const [displayMessage, setDisplayMessage] = useState(step.message);

  useEffect(() => {
    if (!step.messageFrames || !isVisible) {
      setDisplayMessage(step.message);
      return undefined;
    }

    const frames = step.messageFrames;

    setDisplayMessage(frames[0]);
    let frameIndex = 0;

    const intervalId = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      setDisplayMessage(frames[frameIndex]);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isVisible, step.message, step.messageFrames]);

  return (
    <section
      aria-hidden={!isVisible}
      className={`absolute inset-0 transition-opacity ease-in-out ${
        isVisible ? 'pointer-events-auto' : 'pointer-events-none'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${transitionDurationMs}ms` }}
    >
      <OnboardingBackground
        bubbleMessage={displayMessage}
        centerImageUrl={centerImageUrl}
        instructionMessage={step.instruction}
      >
        <div className="relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
          {step.id === 'expense-guide' ||
          step.id === 'schedule-guide' ||
          step.id === 'pet-name-guide' ? (
            <div className="absolute top-4 left-4">
              <BackButton onClick={onBackClick} />
            </div>
          ) : null}
          {step.showCenterAction ? (
            <button
              type="button"
              aria-label="다음 온보딩으로 이동"
              onClick={onYesClick}
              className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-20 h-[240px] w-[240px] cursor-pointer rounded-full md:h-[280px] md:w-[280px] lg:h-[320px] lg:w-[320px]"
            />
          ) : null}
          {step.showChoiceButtons ? (
            <div className="absolute right-0 left-0 z-20 bottom-[10%] md:bottom-[8%] lg:bottom-[5%]">
              <TalkChoiceButtons
                onYesClick={onYesClick}
                yesSymbolClassName="text-black"
              />
            </div>
          ) : step.showStartButton ? (
            <div className="absolute right-0 bottom-[9%] left-0 z-20 px-6 md:bottom-[8%] md:px-8 lg:bottom-[7%] lg:px-10">
              <Button className="mx-auto w-full" onClick={onStartClick}>
                시작하기
              </Button>
            </div>
          ) : null}
          {step.id === 'pet-name-guide' ? (
            <div className="pointer-events-none absolute top-[55%] left-[40%] z-40 h-[96px] w-[96px] translate-x-[48px] md:h-[112px] md:w-[112px] md:translate-x-[56px] lg:h-[128px] lg:w-[128px] lg:translate-x-[64px]">
              <Image
                src="/images/onboarding/hand-finger.png"
                alt=""
                width={128}
                height={128}
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  animation: 'hand-hint 1s steps(1, end) infinite',
                }}
              />
              <Image
                src="/images/onboarding/hand-click.png"
                alt=""
                width={128}
                height={128}
                className="absolute inset-0 h-full w-full object-contain"
                style={{
                  animation: 'hand-hint 1s steps(1, end) infinite',
                  animationDelay: '0.5s',
                }}
              />
            </div>
          ) : null}
        </div>
      </OnboardingBackground>
    </section>
  );
});

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nextStepIndex, setNextStepIndex] = useState<number | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [transitionDurationMs, setTransitionDurationMs] =
    useState(DISSOLVE_DURATION_MS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const advanceTimeoutRef = useRef<number | null>(null);
  const dissolveTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        window.URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

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

    if (durationMs === 0) {
      setTransitionDurationMs(0);
      setNextStepIndex(null);
      setIsDissolving(false);
      setCurrentStepIndex(targetIndex);
      return;
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
  const centerImageUrl =
    currentStep.id === 'pet-photo-complete' ||
    currentStep.id === 'pet-chat-guide'
      ? uploadedImageUrl
      : undefined;
  const nextCenterImageUrl =
    nextStep?.id === 'pet-photo-complete' || nextStep?.id === 'pet-chat-guide'
      ? uploadedImageUrl
      : undefined;
  const handlePhotoUploadRequest = () => {
    fileInputRef.current?.click();
  };
  const handlePhotoFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (uploadedImageUrl) {
      window.URL.revokeObjectURL(uploadedImageUrl);
    }

    setUploadedImageFile(file);
    setUploadedImageUrl(window.URL.createObjectURL(file));
    setIsUploadModalOpen(true);
    event.target.value = '';
  };
  const handleUploadConfirm = async () => {
    if (!uploadedImageFile || isUploading) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedImageFile);

      const response = await fetch('/api/pet-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('upload failed');
      }

      setIsUploadModalOpen(false);
      startStepTransition(
        onboardingSteps.findIndex((step) => step.id === 'pet-photo-complete'),
        BUTTON_DISSOLVE_DURATION_MS,
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };
  const getYesHandler = (
    step: OnboardingStep,
    stepIndex: number,
  ): (() => void) | undefined => {
    if (step.id === 'pet-photo-request') {
      return handlePhotoUploadRequest;
    }

    if (step.showChoiceButtons || step.showCenterAction) {
      return () =>
        startStepTransition(stepIndex + 1, BUTTON_DISSOLVE_DURATION_MS);
    }

    return undefined;
  };

  return (
    <>
      <style jsx>{`
        @keyframes hand-hint {
          0%,
          49.9% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileChange}
      />
      <div className="relative min-h-dvh overflow-hidden">
        <OnboardingOverlay
          step={currentStep}
          isVisible={!isDissolving}
          centerImageUrl={centerImageUrl}
          onBackClick={() =>
            startStepTransition(
              currentStepIndex - 1,
              BUTTON_DISSOLVE_DURATION_MS,
            )
          }
          onYesClick={getYesHandler(currentStep, currentStepIndex)}
          onStartClick={() => router.push('/home')}
          transitionDurationMs={transitionDurationMs}
        />
        <OnboardingOverlay
          step={nextStep ?? currentStep}
          isVisible={nextStep !== null && isDissolving}
          centerImageUrl={nextCenterImageUrl}
          onBackClick={undefined}
          onYesClick={
            nextStep
              ? getYesHandler(nextStep, nextStepIndex ?? currentStepIndex)
              : undefined
          }
          onStartClick={() => router.push('/home')}
          transitionDurationMs={transitionDurationMs}
        />
      </div>
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onCancel={() => setIsUploadModalOpen(false)}
        onConfirm={handleUploadConfirm}
        buttonVariant="double"
        cancelText="취소"
        confirmText={isUploading ? '업로드 중...' : '확인'}
      >
        {uploadedImageUrl ? (
          <div className="overflow-hidden rounded-[12px] border">
            <Image
              src={uploadedImageUrl}
              alt="업로드한 사진 미리보기"
              width={320}
              height={320}
              unoptimized
              className="h-auto max-h-[320px] w-full object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
