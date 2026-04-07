'use client';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const categoryOptions = ['정기검진', '진료', '응급'] as const;
const MEDICAL_RECORD_IMAGE_STORAGE_KEY = 'medical-record-image-data-url';

export default function AddMedicalRecordPage() {
  const router = useRouter();
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedImageDataUrl = sessionStorage.getItem(
      MEDICAL_RECORD_IMAGE_STORAGE_KEY,
    );

    if (storedImageDataUrl) {
      setImageDataUrl(storedImageDataUrl);
    }
  }, []);

  const handleSave = async () => {
    if (!imageDataUrl || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const imageResponse = await fetch(imageDataUrl);
      const imageBlob = await imageResponse.blob();
      const formData = new FormData();
      formData.append('file', imageBlob, 'medical-record.png');

      const response = await fetch('/api/medical-record-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('upload failed');
      }

      sessionStorage.removeItem(MEDICAL_RECORD_IMAGE_STORAGE_KEY);
      router.push('/health/medical-records');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#27312D]">
      <main className="flex-1 p-10">
        <div className="relative mb-8 flex items-center justify-center">
          <h1 className="text-center text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
            진료 이력 등록
          </h1>
          <div className="-translate-y-1/2 absolute top-1/2 left-0">
            <BackButton />
          </div>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-bold text-[#27312D] text-[18px]">
              진단서(처방전)
            </h2>
            <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F6F5] text-[18px] text-[#B4BBB8]">
              {imageDataUrl ? (
                <Image
                  src={imageDataUrl}
                  alt="업로드할 진단서(처방전)"
                  width={1200}
                  height={1200}
                  className="h-full w-full object-cover"
                />
              ) : (
                '등록된 사진이 없습니다.'
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="medical-date"
              className="font-bold text-[#27312D] text-[18px]"
            >
              진료 날짜
            </label>
            <input
              id="medical-date"
              type="date"
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="medical-category"
              className="font-bold text-[#27312D] text-[18px]"
            >
              구분
            </label>
            <select
              id="medical-category"
              defaultValue={categoryOptions[0]}
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="hospital-name"
              className="font-bold text-[#27312D] text-[18px]"
            >
              병원명
            </label>
            <input
              id="hospital-name"
              type="text"
              placeholder="병원 이름을 입력해 주세요"
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none placeholder:text-[#B4BBB8]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pet-name"
              className="font-bold text-[#27312D] text-[18px]"
            >
              반려동물 이름
            </label>
            <input
              id="pet-name"
              type="text"
              placeholder="누가 진료를 받았나요?"
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none placeholder:text-[#B4BBB8]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="medical-details"
              className="font-bold text-[#27312D] text-[18px]"
            >
              진료 내용
            </label>
            <textarea
              id="medical-details"
              rows={5}
              placeholder="진료 내용을 입력해 주세요"
              className="w-full rounded-[14px] bg-[#F4F6F5] px-4 py-4 text-[18px] outline-none placeholder:text-[#B4BBB8]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="medical-amount"
              className="font-bold text-[#27312D] text-[18px]"
            >
              진료 금액
            </label>
            <input
              id="medical-amount"
              type="number"
              inputMode="numeric"
              placeholder="예: 78000"
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none placeholder:text-[#B4BBB8]"
            />
          </div>

          <Button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={isSaving}
            className="mt-6 w-full"
          >
            저장
          </Button>
        </form>
      </main>

      <BottomNavigation />
    </div>
  );
}
