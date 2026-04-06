'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import TalkChoiceButtons from '@/components/home/talk/TalkChoiceButtons';
import OnboardingBackground from '@/components/onboarding/OnboardingBackground';

const DEFAULT_MESSAGE = '무엇이\n궁금하신가요?';
const CONFIRM_MESSAGE = '통장 화면으로\n이동할까요?';
const API_BASE_URL = 'http://localhost:8080';
const MAX_REQUEST_TRANSCRIPT_LENGTH = 60;

function buildRequestTranscript(transcript: string) {
  const normalizedTranscript = transcript
    .replace(/\s+/g, ' ')
    .replace(/[.?!]+/g, '.')
    .trim();

  if (!normalizedTranscript) {
    return '';
  }

  const segments = normalizedTranscript
    .split(/[.\n]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const condensedTranscript =
    segments.length > 0 ? segments[segments.length - 1] : normalizedTranscript;

  return condensedTranscript.slice(0, MAX_REQUEST_TRANSCRIPT_LENGTH);
}

export default function HomeTalkPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [requestedTranscript, setRequestedTranscript] = useState('');
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
    listening,
  } = useSpeechRecognition();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
    };
  }, []);

  useEffect(() => {
    const normalizedTranscript = transcript.replaceAll(' ', '');

    if (showMoveConfirm || !normalizedTranscript) {
      return;
    }

    const shouldMoveFinance =
      normalizedTranscript.includes('통장') ||
      normalizedTranscript.includes('잔고');

    if (!shouldMoveFinance) {
      return;
    }

    setShowMoveConfirm(true);
  }, [showMoveConfirm, transcript]);

  useEffect(() => {
    const requestTranscript = buildRequestTranscript(transcript);

    if (
      !shouldSubmit ||
      !requestTranscript ||
      showMoveConfirm ||
      listening ||
      isPressing ||
      isRequesting ||
      requestedTranscript === requestTranscript
    ) {
      return;
    }

    const requestTalk = async () => {
      try {
        setIsRequesting(true);
        setRequestedTranscript(requestTranscript);
        setAssistantMessage('답변을 준비하고 있어요.');

        const response = await fetch(`${API_BASE_URL}/api/talk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transcript: requestTranscript,
          }),
        });

        if (!response.ok) {
          setAssistantMessage('답변을 불러오지 못했어요.');
          return;
        }

        const data = (await response.json()) as { message?: string };
        if (data.message) {
          setAssistantMessage(data.message);
        }
      } catch {
        setAssistantMessage('답변을 불러오지 못했어요.');
      } finally {
        setIsRequesting(false);
        setShouldSubmit(false);
      }
    };

    void requestTalk();
  }, [
    isPressing,
    isRequesting,
    listening,
    requestedTranscript,
    shouldSubmit,
    showMoveConfirm,
    transcript,
  ]);

  const startRecording = async () => {
    if (!browserSupportsSpeechRecognition || isPressing) {
      return;
    }

    resetTranscript();
    setShowMoveConfirm(false);
    setAssistantMessage('');
    setShouldSubmit(false);
    setRequestedTranscript('');
    setIsPressing(true);

    await SpeechRecognition.startListening({
      continuous: false,
      language: 'ko-KR',
    });
  };

  const stopRecording = async () => {
    if (!isPressing) {
      return;
    }

    setIsPressing(false);
    await SpeechRecognition.stopListening();
    setShouldSubmit(true);
  };

  const bubbleMessage = !isClient
    ? DEFAULT_MESSAGE
    : browserSupportsSpeechRecognition
    ? showMoveConfirm
      ? CONFIRM_MESSAGE
      : isRequesting
      ? '답변을\n준비하고 있어요.'
      : assistantMessage || transcript.trim() || DEFAULT_MESSAGE
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

        {!showMoveConfirm ? (
          <p className="absolute right-0 bottom-[10%] left-0 z-20 text-center text-base text-[#35534E]">
            {listening || isPressing
              ? '듣고 있어요. 손을 떼면 멈춰요.'
              : '별송이를 길게 눌러 말씀해보세요.'}
          </p>
        ) : null}

        {showMoveConfirm ? (
          <div className="absolute right-0 bottom-[18%] left-0 z-20">
            <TalkChoiceButtons
              onYesClick={() => router.push('/finance')}
              onNoClick={() => {
                setShowMoveConfirm(false);
                setAssistantMessage('');
                resetTranscript();
              }}
            />
          </div>
        ) : null}
      </div>
    </OnboardingBackground>
  );
}
