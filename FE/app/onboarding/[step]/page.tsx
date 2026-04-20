import { redirect } from 'next/navigation';

import OnboardingStepPage from '@/components/onboarding/OnboardingStepPage';
import { LAST_ONBOARDING_STEP } from '@/components/onboarding/onboardingSteps';

type OnboardingStepRouteProps = {
  params: Promise<{
    step: string;
  }>;
};

export default async function OnboardingStepRoute({
  params,
}: OnboardingStepRouteProps) {
  const { step } = await params;
  const stepNumber = Number(step);

  if (
    !Number.isInteger(stepNumber) ||
    stepNumber < 1 ||
    stepNumber > LAST_ONBOARDING_STEP
  ) {
    redirect('/onboarding/1');
  }

  return <OnboardingStepPage stepNumber={stepNumber} />;
}
