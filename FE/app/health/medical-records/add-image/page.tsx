'use client';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

const MEDICAL_RECORD_IMAGE_STORAGE_KEY = 'medical-record-image-data-url';

export default function AddMedicalRecordIntroPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

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

        sessionStorage.setItem(
          MEDICAL_RECORD_IMAGE_STORAGE_KEY,
          reader.result,
        );
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
              진단서(처방전)
            </h2>
            <button
              type="button"
              onClick={handlePhotoUploadRequest}
              className="relative flex min-h-0 flex-1 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F6F5] text-[18px] text-[#B4BBB8]"
            >
              {previewImageUrl ? (
                <Image
                  src={previewImageUrl}
                  alt="업로드한 진단서(처방전)"
                  width={1200}
                  height={1200}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                '사진 업로드'
              )}
            </button>
            {uploadMessage ? (
              <p className="text-[16px] text-[#66706D]">{uploadMessage}</p>
            ) : null}
          </section>

          <Button
            type="button"
            onClick={() => router.push('/health/medical-records/add-record')}
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
