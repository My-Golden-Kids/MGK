'use client';

import OnboardingBackground from '@/components/onboarding/OnboardingBackground';

export default function Onboarding2Page() {
  return (
    <OnboardingBackground bubbleMessage="온보딩 배경 테스트입니다.\n말풍선과 가운데 상태를\n함께 확인해보세요.">
      <div className="relative z-10 min-h-dvh px-6 py-10 md:px-8 md:py-12 lg:px-10 lg:py-14">
        <p className="-translate-x-1/2 absolute bottom-[10%] left-1/2 whitespace-pre-line text-center font-normal text-2xl text-black leading-[1.4] md:bottom-[9%] md:text-[1.7rem] lg:bottom-[8%] lg:text-[1.9rem]">
          {'/onboarding2 에서\n배경 컴포넌트를 확인할 수 있어요.'}
        </p>
      </div>
    </OnboardingBackground>
  );
}
