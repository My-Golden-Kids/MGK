'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';

type MedicalRecordForm = {
  date: string;
  type: string;
  petName: string;
  hospitalName: string;
  details: string;
  totalAmount: string;
};

const EMPTY_MEDICAL_RECORD_FORM: MedicalRecordForm = {
  date: '',
  type: '',
  petName: '',
  hospitalName: '',
  details: '',
  totalAmount: '',
};

const MEDICAL_RECORD_IMAGE_STORAGE_KEY = 'medical-record-image-data-url';

export default function AddMedicalRecordPage() {
  const router = useRouter();
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [form, setForm] = useState<MedicalRecordForm>(
    EMPTY_MEDICAL_RECORD_FORM,
  );

  useEffect(() => {
    const storedImage = sessionStorage.getItem(
      MEDICAL_RECORD_IMAGE_STORAGE_KEY,
    );

    if (storedImage) {
      setImageDataUrl(storedImage);
    }
  }, []);

  const handleFormChange =
    (field: keyof MedicalRecordForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm({
        ...form,
        [field]: event.target.value,
      });
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
            <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F6F5] text-[#B4BBB8] text-[18px]">
              {imageDataUrl ? (
                <Image
                  src={imageDataUrl}
                  alt="업로드한 진단서(처방전)"
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
              진료/접종 날짜
            </label>
            <input
              id="medical-date"
              type="date"
              value={form.date}
              onChange={handleFormChange('date')}
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="medical-type"
              className="font-bold text-[#27312D] text-[18px]"
            >
              진료/접종 타입
            </label>
            <input
              id="medical-type"
              type="text"
              value={form.type}
              onChange={handleFormChange('type')}
              placeholder="예: 진료, 접종"
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
              value={form.petName}
              onChange={handleFormChange('petName')}
              placeholder="예: 별멩이"
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none placeholder:text-[#B4BBB8]"
            />
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
              value={form.hospitalName}
              onChange={handleFormChange('hospitalName')}
              placeholder="병원 이름을 입력해 주세요"
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
              rows={4}
              value={form.details}
              onChange={handleFormChange('details')}
              placeholder="진료 내용을 입력해 주세요"
              className="w-full rounded-[14px] bg-[#F4F6F5] px-4 py-4 text-[18px] outline-none placeholder:text-[#B4BBB8]"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="total-amount"
              className="font-bold text-[#27312D] text-[18px]"
            >
              총 진료비
            </label>
            <input
              id="total-amount"
              type="number"
              inputMode="numeric"
              value={form.totalAmount}
              onChange={handleFormChange('totalAmount')}
              placeholder="예: 78000"
              className="h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none placeholder:text-[#B4BBB8]"
            />
          </div>

          <Button
            type="button"
            onClick={() => router.push('/health/medical-records')}
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
