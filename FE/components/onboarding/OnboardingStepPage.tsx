'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

import BackButton from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import TalkChoiceButtons from '@/components/home/talk/TalkChoiceButtons';
import OnboardingBackground from '@/components/onboarding/OnboardingBackground';
import {
  BACK_BUTTON_STEP_IDS,
  CENTER_IMAGE_STEP_IDS,
  getOnboardingStep,
  LAST_ONBOARDING_STEP,
  RETRY_PET_NAME_MESSAGE,
  SKIP_PHOTO_CHAT_GUIDE_MESSAGE,
} from '@/components/onboarding/onboardingSteps';

type OnboardingStepPageProps = {
  stepNumber: number;
};

type FlowState = {
  petImage?: string;
  photoSkipped: boolean;
  retryPetName: boolean;
};

const DISSOLVE_DURATION_MS = 0;
const ONBOARDING_INTERNAL_ENTRY_STORAGE_KEY = 'onboarding-internal-entry';
const TTS_UNLOCKED_SESSION_KEY = 'mgk-onboarding-tts-unlocked';

function HandHint() {
  return (
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
  );
}

function buildOnboardingHref(stepNumber: number, state: FlowState) {
  const params = new URLSearchParams();

  if (state.retryPetName) {
    params.set('retryPetName', '1');
  }

  if (state.photoSkipped) {
    params.set('photoSkipped', '1');
  }

  if (state.petImage) {
    params.set('petImage', state.petImage);
  }

  const query = params.toString();

  return query
    ? `/onboarding/${stepNumber}?${query}`
    : `/onboarding/${stepNumber}`;
}

export default function OnboardingStepPage({
  stepNumber,
}: OnboardingStepPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigationTimeoutRef = useRef<number | null>(null);
  const lastSpokenMessageRef = useRef('');
  const [isTtsUnlocked, setIsTtsUnlocked] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const { browserSupportsSpeechRecognition } = useSpeechRecognition();

  const step = getOnboardingStep(stepNumber);
  const retryPetName = searchParams.get('retryPetName') === '1';
  const photoSkipped = searchParams.get('photoSkipped') === '1';
  const petImage = searchParams.get('petImage') ?? '';
  const flowState: FlowState = {
    retryPetName,
    photoSkipped,
    petImage: petImage || undefined,
  };

  const markInternalEntry = (targetStep: number) => {
    sessionStorage.setItem(
      ONBOARDING_INTERNAL_ENTRY_STORAGE_KEY,
      JSON.stringify({ targetStep }),
    );
  };

  const clearInternalEntry = () => {
    sessionStorage.removeItem(ONBOARDING_INTERNAL_ENTRY_STORAGE_KEY);
  };

  const isInternalOnboardingEntry = () => {
    const storedValue = sessionStorage.getItem(
      ONBOARDING_INTERNAL_ENTRY_STORAGE_KEY,
    );

    if (!storedValue) {
      return false;
    }

    try {
      const parsedValue = JSON.parse(storedValue) as {
        targetStep?: number;
      };

      return parsedValue.targetStep === stepNumber;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.sessionStorage.getItem(TTS_UNLOCKED_SESSION_KEY) === '1') {
      setIsTtsUnlocked(true);
      return;
    }

    const unlockTts = () => {
      window.sessionStorage.setItem(TTS_UNLOCKED_SESSION_KEY, '1');
      setIsTtsUnlocked(true);
      window.removeEventListener('pointerdown', unlockTts);
    };

    window.addEventListener('pointerdown', unlockTts);

    return () => {
      window.removeEventListener('pointerdown', unlockTts);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pendingImagePreviewUrl) {
        window.URL.revokeObjectURL(pendingImagePreviewUrl);
      }
    };
  }, [pendingImagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        window.clearTimeout(navigationTimeoutRef.current);
      }

      void SpeechRecognition.stopListening();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (
      step.autoAdvanceDelay === undefined ||
      stepNumber >= LAST_ONBOARDING_STEP
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigateWithDissolve(buildOnboardingHref(stepNumber + 1, flowState));
    }, step.autoAdvanceDelay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [flowState, step.autoAdvanceDelay, stepNumber]);

  const messageOverride =
    retryPetName && step.id === 'pet-name-guide'
      ? RETRY_PET_NAME_MESSAGE
      : photoSkipped && step.id === 'pet-chat-guide'
        ? SKIP_PHOTO_CHAT_GUIDE_MESSAGE
        : undefined;
  const bubbleMessage = messageOverride ?? step.message;
  const centerImageUrl = CENTER_IMAGE_STEP_IDS.has(step.id)
    ? petImage || undefined
    : undefined;

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !isTtsUnlocked ||
      !bubbleMessage ||
      lastSpokenMessageRef.current === bubbleMessage
    ) {
      return;
    }

    const speechSynthesis = window.speechSynthesis;

    if (!speechSynthesis) {
      return;
    }

    if (browserSupportsSpeechRecognition) {
      void SpeechRecognition.stopListening();
    }

    const utterance = new SpeechSynthesisUtterance(
      bubbleMessage.replaceAll('\n', ' '),
    );
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => {
      lastSpokenMessageRef.current = bubbleMessage;
    };
    utterance.onerror = () => {
      if (lastSpokenMessageRef.current === bubbleMessage) {
        lastSpokenMessageRef.current = '';
      }
    };

    const availableVoices = speechSynthesis.getVoices();
    const koreanVoice = availableVoices.find((voice) =>
      voice.lang.toLowerCase().startsWith('ko'),
    );

    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  }, [browserSupportsSpeechRecognition, bubbleMessage, isTtsUnlocked]);

  const navigateWithDissolve = (
    href: string,
    mode: 'replace' | 'push' = 'replace',
  ) => {
    if (isLeaving) {
      return;
    }

    setIsLeaving(true);
    navigationTimeoutRef.current = window.setTimeout(() => {
      if (mode === 'push') {
        router.push(href);
        return;
      }

      router.replace(href);
    }, DISSOLVE_DURATION_MS);
  };

  const goToStep = (targetStep: number, state: FlowState) => {
    markInternalEntry(targetStep);
    navigateWithDissolve(buildOnboardingHref(targetStep, state));
  };

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

    if (pendingImagePreviewUrl) {
      window.URL.revokeObjectURL(pendingImagePreviewUrl);
    }

    setPendingImageFile(file);
    setPendingImagePreviewUrl(window.URL.createObjectURL(file));
    setIsUploadModalOpen(true);
    event.target.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!pendingImageFile || isUploading) {
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', pendingImageFile);

      const response = await fetch('/api/pet-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('upload failed');
      }

      const data = (await response.json()) as { path?: string };

      if (!data.path) {
        throw new Error('missing upload path');
      }

      setIsUploadModalOpen(false);
      setPendingImageFile(null);
      setPendingImagePreviewUrl('');
      goToStep(11, {
        petImage: data.path,
        photoSkipped: false,
        retryPetName: false,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoSkip = () => {
    setIsUploadModalOpen(false);
    setPendingImageFile(null);
    setPendingImagePreviewUrl('');
    goToStep(10, {
      ...flowState,
      photoSkipped: true,
    });
  };

  const handleBackClick = () => {
    if (!isInternalOnboardingEntry()) {
      clearInternalEntry();
      router.back();
      return;
    }

    goToStep(Math.max(1, stepNumber - 1), flowState);
  };

  const handleYesClick = () => {
    if (step.id === 'health-guide') {
      clearInternalEntry();
      navigateWithDissolve('/login', 'push');
      return;
    }

    if (step.id === 'pet-photo-request') {
      handlePhotoUploadRequest();
      return;
    }

    if (step.id === 'pet-name-guide') {
      goToStep(stepNumber + 1, {
        ...flowState,
        retryPetName: false,
      });
      return;
    }

    if (step.showChoiceButtons || step.showCenterAction) {
      goToStep(stepNumber + 1, flowState);
    }
  };

  const handleNoClick = () => {
    if (step.id === 'pet-name-confirm') {
      goToStep(7, {
        ...flowState,
        retryPetName: true,
      });
      return;
    }

    if (step.id === 'pet-photo-request') {
      handlePhotoSkip();
    }
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
      <div
        className={`relative min-h-dvh overflow-hidden bg-[#A7E9E1] transition-opacity ease-out ${
          isLeaving ? 'opacity-0' : 'animate-screen-dissolve-in opacity-100'
        }`}
        style={{ transitionDuration: `${DISSOLVE_DURATION_MS}ms` }}
      >
        <OnboardingBackground
          bubbleMessage={bubbleMessage}
          bubbleMessageFrames={messageOverride ? undefined : step.messageFrames}
          centerImageUrl={centerImageUrl}
          instructionMessage={step.instruction}
        >
          <div className="pointer-events-none relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
            {BACK_BUTTON_STEP_IDS.has(step.id) ? (
              <div className="pointer-events-auto absolute top-4 left-4">
                <BackButton onClick={handleBackClick} useHistory={false} />
              </div>
            ) : null}
            {step.showCenterAction ? (
              <button
                type="button"
                aria-label="다음 온보딩으로 이동"
                onClick={handleYesClick}
                className="-translate-x-1/2 -translate-y-1/2 pointer-events-auto absolute top-1/2 left-1/2 z-20 h-[240px] w-[240px] cursor-pointer rounded-full md:h-[280px] md:w-[280px] lg:h-[320px] lg:w-[320px]"
              />
            ) : null}
            {step.showChoiceButtons ? (
              <div className="pointer-events-auto absolute right-0 bottom-[10%] left-0 z-20 md:bottom-[8%] lg:bottom-[5%]">
                <TalkChoiceButtons
                  onNoClick={handleNoClick}
                  onYesClick={handleYesClick}
                />
              </div>
            ) : step.showStartButton ? (
              <div className="pointer-events-auto absolute right-0 bottom-[9%] left-0 z-20 px-6 md:bottom-[8%] md:px-8 lg:bottom-[7%] lg:px-10">
                <Button
                  className="mx-auto w-full"
                  onClick={() => navigateWithDissolve('/home', 'push')}
                >
                  시작하기
                </Button>
              </div>
            ) : null}
            {step.id === 'pet-name-guide' || step.id === 'pet-chat-guide' ? (
              <HandHint />
            ) : null}
          </div>
        </OnboardingBackground>
      </div>
      <Modal
        isOpen={isUploadModalOpen}
        onClose={handlePhotoSkip}
        onCancel={handlePhotoSkip}
        onConfirm={handleUploadConfirm}
        buttonVariant="double"
        cancelText="취소"
        confirmText={isUploading ? '업로드 중...' : '확인'}
      >
        {pendingImagePreviewUrl ? (
          <div className="overflow-hidden rounded-[12px] border">
            <Image
              src={pendingImagePreviewUrl}
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
