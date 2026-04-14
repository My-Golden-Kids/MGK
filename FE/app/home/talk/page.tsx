'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';
import BackButton from '@/components/common/BackButton';
import { Button } from '@/components/common/Button';
import TalkBubble from '@/components/home/talk/TalkBubble';
import TalkChoiceButtons from '@/components/home/talk/TalkChoiceButtons';
import OnboardingBackground from '@/components/onboarding/OnboardingBackground';
import {
  createCalendarEvent,
  type PendingCalendarEvent,
  type PetCandidate,
  parseCalendarIntent,
} from '@/features/home/talk/calendarApi';
import { fetchPet, fetchPets } from '@/features/settings/api/petSettingsApi';
import { clientFetch } from '@/lib/auth';
import { getStoredMedicalPetId } from '@/lib/medical-record';
import { cancelTtsPlayback, playTts } from '@/lib/tts';

const DEFAULT_MESSAGE = '무엇이 궁금하신가요?';
const MAX_REQUEST_TRANSCRIPT_LENGTH = 60;
const PREPARING_MESSAGE = '답변을 준비하고 있어요.';
const REQUEST_ERROR_MESSAGE = '답변을 불러오지 못했어요.';
const DEFAULT_PET_NAME = '별송이';
const NAVIGATION_KEYWORDS = [
  '가줘',
  '이동',
  '열어줘',
  '들어가줘',
  '화면',
] as const;
const NAVIGATION_SHOW_KEYWORDS = ['보여줘', '확인해줘'] as const;
const QUERY_KEYWORDS = [
  '언제',
  '오늘',
  '했나',
  '했어',
  '갔지',
  '얼마',
  '있는지',
  '있어',
  '기록있나',
] as const;

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

function resolveCommandRoute(transcript: string) {
  const normalizedTranscript = transcript.replaceAll(' ', '');
  const hasNavigationIntent = NAVIGATION_KEYWORDS.some((keyword) =>
    normalizedTranscript.includes(keyword),
  );
  const hasNavigationShowIntent = NAVIGATION_SHOW_KEYWORDS.some((keyword) =>
    normalizedTranscript.includes(keyword),
  );
  const hasQueryIntent = QUERY_KEYWORDS.some((keyword) =>
    normalizedTranscript.includes(keyword),
  );

  if (hasQueryIntent) {
    return null;
  }

  if (!hasNavigationIntent && !hasNavigationShowIntent) {
    return null;
  }

  if (
    normalizedTranscript.includes('지출추가') ||
    normalizedTranscript.includes('지출등록')
  ) {
    return '/finance/expense/add-image';
  }

  if (normalizedTranscript.includes('리포트')) {
    return '/finance/report';
  }

  if (
    normalizedTranscript.includes('통장') ||
    normalizedTranscript.includes('잔고') ||
    normalizedTranscript.includes('재정') ||
    normalizedTranscript.includes('금융') ||
    normalizedTranscript.includes('가계부') ||
    normalizedTranscript.includes('소비') ||
    normalizedTranscript.includes('지출')
  ) {
    return '/finance';
  }

  if (normalizedTranscript.includes('산책')) {
    return '/health/walk';
  }

  if (
    normalizedTranscript.includes('접종') ||
    normalizedTranscript.includes('예방접종') ||
    normalizedTranscript.includes('백신')
  ) {
    return '/health/vaccinations';
  }

  if (
    normalizedTranscript.includes('병원기록') ||
    normalizedTranscript.includes('진료기록') ||
    normalizedTranscript.includes('의료기록')
  ) {
    return '/health/medical-records';
  }

  if (
    normalizedTranscript.includes('건강') ||
    normalizedTranscript.includes('헬스')
  ) {
    return '/health';
  }

  if (
    normalizedTranscript.includes('상품') ||
    normalizedTranscript.includes('보험') ||
    normalizedTranscript.includes('적금') ||
    normalizedTranscript.includes('구독')
  ) {
    return '/product';
  }

  if (
    normalizedTranscript.includes('설정') ||
    normalizedTranscript.includes('마이페이지')
  ) {
    return '/settings';
  }

  if (normalizedTranscript.includes('홈')) {
    return '/home';
  }

  return null;
}

function buildConfirmMessage(route: string | null) {
  switch (route) {
    case '/finance':
      return '재정 화면으로 이동할까요?';
    case '/finance/report':
      return '리포트 화면으로 이동할까요?';
    case '/finance/expense/add-image':
      return '지출 등록 화면으로 이동할까요?';
    case '/health':
      return '건강 화면으로 이동할까요?';
    case '/health/walk':
      return '산책 화면으로 이동할까요?';
    case '/health/vaccinations':
      return '접종 화면으로 이동할까요?';
    case '/health/medical-records':
      return '병원기록 화면으로 이동할까요?';
    case '/product':
      return '상품 화면으로 이동할까요?';
    case '/settings':
      return '설정 화면으로 이동할까요?';
    case '/home':
      return '홈 화면으로 이동할까요?';
    default:
      return '이동할까요?';
  }
}

function HomeTalkPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastSpokenBubbleMessageRef = useRef('');
  const hadActiveListeningRef = useRef(false);
  const [isClient, setIsClient] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [assistantMessage, setAssistantMessage] = useState('');
  const [requestedTranscript, setRequestedTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [pets, setPets] = useState<PetCandidate[]>([]);
  const [selectedPetId, setSelectedPetId] = useState(0);
  const [selectedPetName, setSelectedPetName] = useState(DEFAULT_PET_NAME);
  const [selectedPetImageUrl, setSelectedPetImageUrl] = useState<
    string | undefined
  >(undefined);
  const [pendingCalendarEvent, setPendingCalendarEvent] =
    useState<PendingCalendarEvent | null>(null);
  const isTextMode = searchParams.get('mode') === 'text';
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
    let isCancelled = false;

    const loadSelectedPet = async () => {
      const petId = getStoredMedicalPetId();
      const [result, petsResult] = await Promise.all([
        fetchPet(petId),
        fetchPets(),
      ]);

      if (isCancelled) {
        return;
      }

      const activePets = petsResult.ok
        ? (petsResult.pets ?? []).filter((pet) => !pet.isDeath)
        : [];
      const selectedPet =
        result.ok && result.pet && !result.pet.isDeath
          ? result.pet
          : (activePets[0] ?? null);

      setSelectedPetId(selectedPet ? selectedPet.id : 0);
      setSelectedPetName(selectedPet?.name ?? DEFAULT_PET_NAME);
      setSelectedPetImageUrl(selectedPet?.imageUrl ?? undefined);
      setPets(activePets);
    };

    void loadSelectedPet();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      SpeechRecognition.stopListening();
      cancelTtsPlayback();
    };
  }, []);

  useEffect(() => {
    if (isTextMode) {
      setIsRecording(false);
      hadActiveListeningRef.current = false;
      void SpeechRecognition.stopListening();
    }
  }, [isTextMode]);

  useEffect(() => {
    if (!isRecording) {
      hadActiveListeningRef.current = false;
      return;
    }

    if (listening) {
      hadActiveListeningRef.current = true;
      return;
    }

    if (!hadActiveListeningRef.current) {
      return;
    }

    hadActiveListeningRef.current = false;
    setIsRecording(false);
    setShouldSubmit(true);
  }, [isRecording, listening]);

  useEffect(() => {
    const normalizedTranscript = transcript.replaceAll(' ', '');

    if (isTextMode || showMoveConfirm || !normalizedTranscript) {
      return;
    }

    const route = resolveCommandRoute(normalizedTranscript);

    if (!route) {
      return;
    }

    setPendingRoute(route);
    setShowMoveConfirm(true);
  }, [isTextMode, showMoveConfirm, transcript]);

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

    const calendarIntent = parseCalendarIntent(
      requestTranscript,
      pets,
      selectedPetId,
      selectedPetName,
    );

    if (calendarIntent) {
      setPendingCalendarEvent(calendarIntent);
      setShowMoveConfirm(true);
      setShouldSubmit(false);
      setAssistantMessage('');
      return;
    }

    const commandRoute = resolveCommandRoute(requestTranscript);

    if (commandRoute) {
      setPendingRoute(commandRoute);
      setShowMoveConfirm(true);
      setShouldSubmit(false);
      setAssistantMessage('');
      return;
    }

    const requestTalk = async () => {
      try {
        setIsRequesting(true);
        setRequestedTranscript(requestTranscript);
        setAssistantMessage(PREPARING_MESSAGE);

        const response = await clientFetch('/api/talk', {
          method: 'POST',
          body: JSON.stringify({
            transcript: requestTranscript,
            petId: selectedPetId || null,
          }),
        });

        if (!response.ok) {
          setAssistantMessage(REQUEST_ERROR_MESSAGE);
          return;
        }

        const data = (await response.json()) as { message?: string };
        if (data.message) {
          setAssistantMessage(data.message);
        }
      } catch {
        setAssistantMessage(REQUEST_ERROR_MESSAGE);
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
    pets,
    requestedTranscript,
    selectedPetId,
    selectedPetName,
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
    cancelTtsPlayback();

    await SpeechRecognition.startListening({
      continuous: false,
      language: 'ko-KR',
    });
  };

  const stopRecording = async () => {
    if (!isRecording && !listening) {
      return;
    }

    hadActiveListeningRef.current = false;
    setIsRecording(false);
    await SpeechRecognition.stopListening();
    setShouldSubmit(true);
  };

  const submitTextInput = async () => {
    const requestTranscript = buildRequestTranscript(textInput);

    if (
      !requestTranscript ||
      isRequesting ||
      requestedTranscript === requestTranscript
    ) {
      return;
    }

    const calendarIntent = parseCalendarIntent(
      requestTranscript,
      pets,
      selectedPetId,
      selectedPetName,
    );

    if (calendarIntent) {
      setPendingCalendarEvent(calendarIntent);
      setShowMoveConfirm(true);
      setAssistantMessage('');
      return;
    }

    const commandRoute = resolveCommandRoute(requestTranscript);

    if (commandRoute) {
      setPendingRoute(commandRoute);
      setShowMoveConfirm(true);
      setAssistantMessage('');
      return;
    }

    try {
      setIsRequesting(true);
      setRequestedTranscript(requestTranscript);
      setAssistantMessage(PREPARING_MESSAGE);

      const response = await clientFetch('/api/talk', {
        method: 'POST',
        body: JSON.stringify({
          transcript: requestTranscript,
          petId: selectedPetId || null,
        }),
      });

      if (!response.ok) {
        setAssistantMessage(REQUEST_ERROR_MESSAGE);
        return;
      }

      const data = (await response.json()) as { message?: string };
      if (data.message) {
        setAssistantMessage(data.message);
      }
    } catch {
      setAssistantMessage(REQUEST_ERROR_MESSAGE);
    } finally {
      setIsRequesting(false);
    }
  };

  const toggleRecording = async () => {
    if (isRequesting || isTextMode) {
      return;
    }

    if (isRecording || listening) {
      await stopRecording();
      return;
    }

    await startRecording();
  };

  const confirmMessage = pendingCalendarEvent
    ? pendingCalendarEvent.confirmMessage
    : buildConfirmMessage(pendingRoute);
  const bubbleMessage = !isClient
    ? DEFAULT_MESSAGE
    : isTextMode
      ? showMoveConfirm
        ? confirmMessage
        : isRequesting
          ? PREPARING_MESSAGE
          : assistantMessage || DEFAULT_MESSAGE
      : browserSupportsSpeechRecognition
        ? showMoveConfirm
          ? confirmMessage
          : isRequesting
            ? '답변을 준비하고 있어요.'
            : assistantMessage || DEFAULT_MESSAGE
        : '이 기기에서는 음성 인식을 사용할 수 없어요.';
  const speechBubbleMessage = isTextMode ? textInput : transcript.trim();
  const instructionMessage = isTextMode
    ? undefined
    : showMoveConfirm
      ? undefined
      : !speechBubbleMessage
        ? listening || isRecording
          ? '듣고 있어요.\n한 번 더 누르면 멈춰요.'
          : `${selectedPetName}를 한 번 눌러\n말씀해보세요.`
        : undefined;

  useEffect(() => {
    if (
      !isClient ||
      !bubbleMessage ||
      bubbleMessage === PREPARING_MESSAGE ||
      lastSpokenBubbleMessageRef.current === bubbleMessage
    ) {
      return;
    }

    lastSpokenBubbleMessageRef.current = bubbleMessage;
    const abortController = new AbortController();

    void playTts(bubbleMessage.replaceAll('\n', ' '), {
      signal: abortController.signal,
    }).catch(() => {
      if (lastSpokenBubbleMessageRef.current === bubbleMessage) {
        lastSpokenBubbleMessageRef.current = '';
      }
    });

    return () => {
      abortController.abort();
    };
  }, [bubbleMessage, isClient]);

  return (
    <OnboardingBackground
      bubbleMessage={bubbleMessage}
      centerImageUrl={selectedPetImageUrl}
      isCenterImageInteractive={!isTextMode}
      onCenterImageClick={() => {
        void toggleRecording();
      }}
      instructionMessage={instructionMessage}
    >
      <div className="pointer-events-none relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
        <div className="pointer-events-auto absolute top-0 left-0 px-8 py-6">
          <BackButton />
        </div>
        {!showMoveConfirm && isTextMode ? (
          <form
            className="pointer-events-auto absolute right-6 bottom-[3.25rem] left-6 z-20 mx-auto w-[calc(100%-3rem)] max-w-[22rem] md:bottom-[4.25rem] md:max-w-[24rem] lg:bottom-[4rem] lg:max-w-[26rem]"
            onSubmit={async (event) => {
              event.preventDefault();
              await submitTextInput();
            }}
          >
            <p className="mb-4 text-center font-normal text-2xl text-black leading-[1.4] md:text-[1.7rem] lg:text-[1.8rem]">
              하단 말풍선에 내용을 입력해보세요.
            </p>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#75A39D] shadow-[0_10px_30px_rgba(0,0,0,0.08)] md:rounded-[2.25rem] lg:rounded-[2.5rem]">
              <textarea
                value={textInput}
                onChange={(event) => {
                  setTextInput(event.target.value);
                  setShowMoveConfirm(false);
                }}
                placeholder=""
                rows={3}
                className="scrollbar-hide w-full resize-none overflow-y-auto bg-transparent px-6 py-5 font-semibold text-2xl text-white leading-[1.35] outline-none placeholder:text-white/55 md:px-7 md:py-6 md:text-3xl lg:px-8 lg:py-7 lg:text-4xl"
              />
              <div className="absolute right-4 bottom-4 md:right-5 md:bottom-5 lg:right-6 lg:bottom-6">
                <Button
                  type="submit"
                  disabled={!textInput.trim() || isRequesting}
                  className="mx-0 h-auto rounded-[14px] bg-[#00A389] px-6 py-2.5 font-medium text-white text-xl shadow-none hover:bg-[#008f78] disabled:bg-[#9BBAB2] md:rounded-2xl md:px-8 md:py-3.5 md:text-2xl lg:rounded-3xl lg:px-10 lg:py-4 lg:text-3xl"
                >
                  전송
                </Button>
              </div>
            </div>
          </form>
        ) : !showMoveConfirm && speechBubbleMessage ? (
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
          <div className="pointer-events-auto absolute right-0 bottom-[10%] left-0 z-20 md:bottom-[8%] lg:bottom-[5%]">
            <TalkChoiceButtons
              onYesClick={async () => {
                if (pendingCalendarEvent) {
                  setShowMoveConfirm(false);
                  setIsRequesting(true);
                  const result =
                    await createCalendarEvent(pendingCalendarEvent);
                  setPendingCalendarEvent(null);
                  setIsRequesting(false);
                  setAssistantMessage(
                    result.ok
                      ? '일정이 추가되었어요.'
                      : (result.errorMessage ?? '일정 추가에 실패했어요.'),
                  );
                  return;
                }

                if (pendingRoute) {
                  router.push(pendingRoute);
                  return;
                }

                router.push('/finance');
              }}
              onNoClick={() => {
                setShowMoveConfirm(false);
                setPendingRoute(null);
                setPendingCalendarEvent(null);
                setAssistantMessage('');
                if (isTextMode) {
                  setRequestedTranscript('');
                } else {
                  resetTranscript();
                }
              }}
            />
          </div>
        ) : null}
      </div>
    </OnboardingBackground>
  );
}

export default function HomeTalkPage() {
  return (
    <Suspense fallback={null}>
      <HomeTalkPageContent />
    </Suspense>
  );
}
