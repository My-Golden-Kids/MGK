'use client';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import Image from 'next/image';
import { useRef, useState } from 'react';

type OcrImageUploadPageProps = {
  title: string;
  sectionLabel: string;
  uploadAlt: string;
  missingImageMessage: string;
  onNext: (imageDataUrl: string) => void | Promise<void>;
};

export default function OcrImageUploadPage({
  title,
  sectionLabel,
  uploadAlt,
  missingImageMessage,
  onNext,
}: OcrImageUploadPageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoUploadRequest = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadMessage('');
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          setUploadMessage('사진을 불러오지 못했습니다.');
          return;
        }

        setPreviewImageUrl(reader.result);
        setUploadMessage('');
      };

      reader.onerror = () => {
        setUploadMessage('사진을 불러오지 못했습니다.');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setUploadMessage('사진을 불러오지 못했습니다.');
    } finally {
      event.target.value = '';
    }
  };

  const handleNext = async () => {
    if (!previewImageUrl || isProcessing) {
      setUploadMessage(missingImageMessage);
      return;
    }

    try {
      setIsProcessing(true);
      await onNext(previewImageUrl);
    } catch (error) {
      console.error(error);
      setUploadMessage('다음 단계로 이동하지 못했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#27312D]">
      <main className="flex flex-1 flex-col p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handlePhotoFileChange(event);
          }}
        />
        <div className="relative mb-8 flex items-center justify-center">
          <h1 className="text-center text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
            {title}
          </h1>
          <div className="-translate-y-1/2 absolute top-1/2 left-[-12]">
            <BackButton />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col gap-2">
            <h2 className="font-bold text-[#27312D] text-[18px]">
              {sectionLabel}
            </h2>
            <button
              type="button"
              onClick={handlePhotoUploadRequest}
              className="relative flex min-h-0 w-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F6F5] text-[#B4BBB8] text-[18px]"
            >
              {previewImageUrl ? (
                <Image
                  src={previewImageUrl}
                  alt={uploadAlt}
                  width={1200}
                  height={1200}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                '사진 업로드'
              )}
            </button>
            {uploadMessage ? (
              <p className="text-[#66706D] text-[16px]">{uploadMessage}</p>
            ) : null}
          </section>

          <Button
            type="button"
            onClick={() => {
              void handleNext();
            }}
            disabled={isProcessing}
            className="mt-10 w-full"
          >
            다음
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
