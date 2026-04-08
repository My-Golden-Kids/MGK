'use client';

import { useRouter } from 'next/navigation';

type BackButtonProps = {
  onClick?: () => void;
  useHistory?: boolean;
};

export default function BackButton({
  onClick,
  useHistory = true,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (!useHistory && onClick) {
      onClick();
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    if (document.referrer) {
      window.location.href = document.referrer;
      return;
    }

    onClick?.();
  };

  return (
    <div className="sticky top-0 z-40">
      <button
        type="button"
        onClick={handleBack}
        className="cursor-pointer px-4 py-3 font-medium text-2xl text-black"
      >
        뒤로
      </button>
    </div>
  );
}
