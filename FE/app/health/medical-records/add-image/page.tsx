'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import {
  getStoredMedicalPetId,
  MEDICAL_RECORD_IMAGE_STORAGE_KEY,
  MEDICAL_RECORD_OCR_STORAGE_KEY,
  storeSelectedPetId,
} from '@/lib/medical-record';

export default function AddMedicalRecordIntroPage() {
  const router = useRouter();
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
      setUploadMessage(
        '먼저 진단서(처방전, 영수증 등) 사진을 업로드해 주세요.',
      );
      return;
    }

    setIsProcessing(true);
    sessionStorage.setItem(MEDICAL_RECORD_IMAGE_STORAGE_KEY, previewImageUrl);
    sessionStorage.removeItem(MEDICAL_RECORD_OCR_STORAGE_KEY);
    storeSelectedPetId(getStoredMedicalPetId());
    router.push('/health/medical-records/processing');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#27312D]">
      <main className="flex flex-1 flex-col p-10">
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
            진료 이력 등록
          </h1>
          <div className="-translate-y-1/2 absolute top-1/2 left-0">
            <BackButton />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col gap-2">
            <h2 className="font-bold text-[#27312D] text-[18px]">
              진단서(처방전, 영수증 등)
            </h2>
            <button
              type="button"
              onClick={handlePhotoUploadRequest}
              className="relative flex min-h-0 w-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F6F5] text-[#B4BBB8] text-[18px]"
            >
              {previewImageUrl ? (
                <Image
                  src={previewImageUrl}
                  alt="업로드한 진단서(처방전, 영수증 등)"
                  width={1200}
                  height={1200}
                  className="absolute inset-0 h-full w-full object-cover"
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
