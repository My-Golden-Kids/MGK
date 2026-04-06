import type { ReactNode } from 'react';

type OnboardingLayoutProps = {
  children: ReactNode;
};

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return <div className="min-h-dvh bg-[#A7E9E1]">{children}</div>;
}
