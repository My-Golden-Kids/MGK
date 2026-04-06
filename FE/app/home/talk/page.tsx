import OnboardingBackground from '@/components/onboarding/OnboardingBackground';

export default function HomeTalkPage() {
  return (
    <OnboardingBackground
      bubbleMessage={'무엇이\n궁금하신가요?'}
      characterAlt="Byeolsong"
      characterImageSrc="/images/onboarding/byeolsong.png"
      showCharacter={false}
    />
  );
}
