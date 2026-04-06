'use client';

import { useEffect, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import OnboardingBackground from '@/components/onboarding/OnboardingBackground';

const DEFAULT_MESSAGE = '무엇이\n궁금하신가요?';

export default function HomeTalkPage() {
  const [isPressing, setIsPressing] = useState(false);
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    listening,
  } = useSpeechRecognition();

  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  const startRecording = async () => {
    if (!browserSupportsSpeechRecognition || isPressing) {
      return;
    }

    resetTranscript();
    setIsPressing(true);

    await SpeechRecognition.startListening({
      continuous: true,
      language: 'ko-KR',
    });
  };

  const stopRecording = async () => {
    if (!isPressing) {
      return;
    }

    setIsPressing(false);
    await SpeechRecognition.stopListening();
  };

  const bubbleMessage = browserSupportsSpeechRecognition
    ? transcript.trim() || DEFAULT_MESSAGE
    : '이 기기에서는\n음성 인식을 사용할 수 없어요.';

  return (
    <OnboardingBackground bubbleMessage={bubbleMessage}>
      <div className="relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
        <button
          type="button"
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerLeave={stopRecording}
          onPointerCancel={stopRecording}
          onContextMenu={(event) => event.preventDefault()}
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-20 h-[240px] w-[240px] rounded-full bg-transparent md:h-[280px] md:w-[280px] lg:h-[320px] lg:w-[320px]"
          aria-label="별송이를 길게 눌러 음성 입력"
        />

        <p className="absolute right-0 bottom-[10%] left-0 z-20 text-center text-base text-[#35534E]">
          {listening || isPressing
            ? '듣고 있어요. 손을 떼면 멈춰요.'
            : '별송이를 길게 눌러 말씀해보세요.'}
        </p>
      </div>
    </OnboardingBackground>
  );
}
