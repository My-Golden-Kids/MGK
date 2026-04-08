'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PetProfileImage from '@/components/home/pet/PetProfileImage';

const MEDICAL_RECORD_IMAGE_STORAGE_KEY = 'medical-record-image-data-url';

export default function MedicalRecordProcessingPage() {
  const centerImageClassName =
    'h-[180px] w-[180px] md:h-[240px] md:w-[240px] lg:h-[280px] lg:w-[280px]';
  const spinnerContainerClassName =
    'h-[244px] w-[244px] md:h-[324px] md:w-[324px] lg:h-[376px] lg:w-[376px]';
  const router = useRouter();

  useEffect(() => {
    const storedImage = sessionStorage.getItem(
      MEDICAL_RECORD_IMAGE_STORAGE_KEY,
    );

    if (!storedImage) {
      router.replace('/health/medical-records/add-image');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace('/health/medical-records/add-record');
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6 text-[#27312D]">
      <div className="flex flex-col items-center justify-center">
        <p className="mb-8 text-center font-bold text-[#00A58C] text-[28px] leading-none sm:text-[28px] md:text-[34px] md:text-[36px] lg:text-[40px]">
          등록 중..
        </p>
        <div
          className={`relative flex items-center justify-center ${spinnerContainerClassName}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 animate-spin"
          >
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#BEEFE5"
              strokeWidth="24"
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="#25C8A8"
              strokeWidth="24"
              strokeLinecap="round"
              strokeDasharray="90 239"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <PetProfileImage
            className={`relative z-10 border-0 ${centerImageClassName}`}
          />
        </div>
      </div>
    </main>
  );
}
