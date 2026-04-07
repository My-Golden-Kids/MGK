'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

import TalkBubble from '@/components/home/talk/TalkBubble';
import TalkChoiceButtons from '@/components/home/talk/TalkChoiceButtons';
import OnboardingBackground from '@/components/onboarding/OnboardingBackground';

const DEFAULT_MESSAGE = '무엇이 궁금하신가요?';
const CONFIRM_MESSAGE = '통장 화면으로 이동할까요?';
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
  const [isRecording, setIsRecording] = useState(false);
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
      isRecording ||
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
    isRecording,
    isRequesting,
    listening,
    requestedTranscript,
    shouldSubmit,
    showMoveConfirm,
    transcript,
  ]);

  const startRecording = async () => {
    if (!browserSupportsSpeechRecognition || isRecording) {
      return;
    }

    resetTranscript();
    setShowMoveConfirm(false);
    setAssistantMessage('');
    setShouldSubmit(false);
    setRequestedTranscript('');
    setIsRecording(true);

    await SpeechRecognition.startListening({
      continuous: false,
      language: 'ko-KR',
    });
  };

  const stopRecording = async () => {
    if (!isRecording) {
      return;
    }

    setIsRecording(false);
    await SpeechRecognition.stopListening();
    setShouldSubmit(true);
  };

  const toggleRecording = async () => {
    if (isRequesting) {
      return;
    }

    if (isRecording || listening) {
      await stopRecording();
      return;
    }

    await startRecording();
  };

  const bubbleMessage = !isClient
    ? DEFAULT_MESSAGE
    : browserSupportsSpeechRecognition
      ? showMoveConfirm
        ? CONFIRM_MESSAGE
        : isRequesting
          ? '답변을 준비하고 있어요.'
          : assistantMessage || DEFAULT_MESSAGE
      : '이 기기에서는 음성 인식을 사용할 수 없어요.';
  const speechBubbleMessage = transcript.trim();
  const instructionMessage = showMoveConfirm
    ? undefined
    : !speechBubbleMessage
      ? listening || isRecording
        ? '듣고 있어요.\n한 번 더 누르면 멈춰요.'
        : '별송이를 한 번 눌러\n말씀해보세요.'
      : undefined;

  return (
    <OnboardingBackground
      bubbleMessage={bubbleMessage}
      instructionMessage={instructionMessage}
    >
      <div className="pointer-events-none relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
        <button
          type="button"
          onClick={() => {
            void toggleRecording();
          }}
          onContextMenu={(event) => event.preventDefault()}
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-auto absolute top-1/2 left-1/2 z-20 h-[240px] w-[240px] rounded-full bg-transparent md:h-[280px] md:w-[280px] lg:h-[320px] lg:w-[320px]"
          aria-label={
            isRecording || listening
              ? '별송이를 눌러 음성 입력 종료'
              : '별송이를 눌러 음성 입력 시작'
          }
        />

        {!showMoveConfirm && speechBubbleMessage ? (
          <div className="pointer-events-none absolute right-6 bottom-[5.5rem] left-6 z-20 mx-auto w-[calc(100%-3rem)] max-w-[22rem] md:max-w-[24rem] lg:max-w-[26rem]">
            <TalkBubble
              message={speechBubbleMessage}
              className="w-full"
              bubbleClassName="w-full overflow-hidden rounded-[2rem] bg-[#75A39D] shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:rounded-[2.25rem] lg:rounded-[2.5rem]"
              contentClassName="px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7"
              textClassName="whitespace-pre-line break-keep text-start font-semibold text-2xl text-white leading-[1.35] md:text-3xl lg:text-4xl"
            />
          </div>
        ) : null}

        {showMoveConfirm ? (
          <div className="pointer-events-auto absolute right-0 bottom-[18%] left-0 z-20">
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
