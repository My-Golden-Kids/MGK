'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PetProfileImage from '@/components/home/pet/PetProfileImage';
import { clientFetch } from '@/lib/auth';
import { dataUrlToFile, type OcrMedicalRecord } from '@/lib/medical-record';

type OcrProcessingPageProps = {
  imageStorageKey: string;
  ocrStorageKey: string;
  fileNamePrefix: string;
  fallbackPath: string;
  successPath: string;
  errorPath: string;
};

export default function OcrProcessingPage({
  imageStorageKey,
  ocrStorageKey,
  fileNamePrefix,
  fallbackPath,
  successPath,
  errorPath,
}: OcrProcessingPageProps) {
  const centerImageClassName =
    'h-[180px] w-[180px] md:h-[240px] md:w-[240px] lg:h-[280px] lg:w-[280px]';
  const spinnerContainerClassName =
    'h-[244px] w-[244px] md:h-[324px] md:w-[324px] lg:h-[376px] lg:w-[376px]';
  const router = useRouter();

  useEffect(() => {
    const storedImage = sessionStorage.getItem(imageStorageKey);

    if (!storedImage) {
      router.replace(fallbackPath);
      return;
    }

    let isCancelled = false;

    const processOcr = async () => {
      try {
        const file = dataUrlToFile(
          storedImage,
          `${fileNamePrefix}-${Date.now()}.png`,
        );
        const formData = new FormData();
        formData.append('file', file);

        const response = await clientFetch('/api/medical-records/ocr', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('OCR 요청에 실패했습니다.');
        }

        const result = (await response.json()) as OcrMedicalRecord;
        sessionStorage.setItem(ocrStorageKey, JSON.stringify(result));

        if (!isCancelled) {
          router.replace(successPath);
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          router.replace(errorPath);
        }
      }
    };

    void processOcr();

    return () => {
      isCancelled = true;
    };
  }, [
    errorPath,
    fallbackPath,
    fileNamePrefix,
    imageStorageKey,
    ocrStorageKey,
    router,
    successPath,
  ]);

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
