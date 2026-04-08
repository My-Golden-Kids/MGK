export const TRANSITION_DELAY_MS = 3000;

export type OnboardingStep = {
  id: string;
  message: string;
  messageFrames?: string[];
  instruction?: string;
  showCenterAction?: boolean;
  showChoiceButtons?: boolean;
  showStartButton?: boolean;
  autoAdvanceDelay?: number;
};

export const RETRY_PET_NAME_MESSAGE = '다시 한 번 더\n말씀해주세요!';
export const SKIP_PHOTO_CHAT_GUIDE_MESSAGE =
  '저를 누르면\n언제든 저와 대화하실\n수 있어요!';

export const onboardingSteps: OnboardingStep[] = [
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
    showChoiceButtons: true,
  },
  {
    id: 'pet-photo-skip-info',
    message: '걱정 마세요! 별멩이\n사진은 나중에 또 선택\n하실 수 있어요',
    autoAdvanceDelay: TRANSITION_DELAY_MS,
  },
  {
    id: 'pet-photo-complete',
    message: '준비가 다 됐어요!\n이제 별멩이와의 추억을\n함께 만들어가 볼까요?',
    autoAdvanceDelay: TRANSITION_DELAY_MS,
  },
  {
    id: 'pet-chat-guide',
    message: '별멩이 사진을 누르면\n언제든 저와 대화하실\n수 있어요!',
    showStartButton: true,
  },
];

export const LAST_ONBOARDING_STEP = onboardingSteps.length;

export function getOnboardingStep(stepNumber: number) {
  return onboardingSteps[stepNumber - 1];
}

export const BACK_BUTTON_STEP_IDS = new Set([
  'expense-guide',
  'schedule-guide',
  'pet-name-guide',
]);

export const CENTER_IMAGE_STEP_IDS = new Set([
  'pet-photo-complete',
  'pet-chat-guide',
]);
