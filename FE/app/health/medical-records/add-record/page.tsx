'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import { clientFetch } from '@/lib/client-fetch';
import { toRenderableImageSrc } from '@/lib/local-image';
import {
  EMPTY_MEDICAL_RECORD_FORM,
  getStoredMedicalPetId,
  MEDICAL_RECORD_IMAGE_STORAGE_KEY,
  MEDICAL_RECORD_OCR_STORAGE_KEY,
  type MedicalRecordForm,
  mapOcrResultToForm,
  type OcrMedicalRecord,
} from '@/lib/medical-record';

function AddMedicalRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [form, setForm] = useState<MedicalRecordForm>(
    EMPTY_MEDICAL_RECORD_FORM,
  );
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedImage = sessionStorage.getItem(
      MEDICAL_RECORD_IMAGE_STORAGE_KEY,
    );
    const storedOcrResult = sessionStorage.getItem(
      MEDICAL_RECORD_OCR_STORAGE_KEY,
    );

    if (storedImage) {
      setImageDataUrl(storedImage);
    }

    if (storedOcrResult) {
      try {
        const parsedResult = JSON.parse(storedOcrResult) as OcrMedicalRecord;
        setForm(mapOcrResultToForm(parsedResult));
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('ocrError') === '1') {
      setMessage('OCR 인식에 실패해 직접 입력 모드로 열었습니다.');
    }
  }, [searchParams]);

  const handleFormChange =
    (field: keyof MedicalRecordForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm({
        ...form,
        [field]: event.target.value,
      });
    };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (
      !form.date ||
      !form.type ||
      !form.petName ||
      !form.hospitalName ||
      !form.details ||
      !form.totalAmount
    ) {
      setMessage('모든 항목을 입력해 주세요.');
      return;
    }

    try {
      setIsSaving(true);
      setMessage('');

      let imageUrl = '';
      if (imageDataUrl.startsWith('/')) {
        imageUrl = imageDataUrl;
      } else if (imageDataUrl) {
        const uploadFormData = new FormData();
        uploadFormData.append(
          'file',
          await fetch(imageDataUrl)
            .then((response) => response.blob())
            .then(
              (blob) =>
                new File([blob], `medical-record-${Date.now()}.png`, {
                  type: blob.type || 'image/png',
                }),
            ),
        );

        const uploadResponse = await fetch('/api/medical-record-upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }

        const uploadResult = (await uploadResponse.json()) as { path?: string };
        imageUrl = uploadResult.path ?? '';
      }

      const saveResponse = await clientFetch('/api/medical-records', {
        method: 'POST',
        body: JSON.stringify({
          petId: getStoredMedicalPetId(),
          date: form.date,
          type: form.type,
          petName: form.petName,
          hospitalName: form.hospitalName,
          details: form.details,
          totalAmount: Number(form.totalAmount),
          imageUrl,
        }),
      });

      // const saveResponse = await fetch(
      //   `${getMedicalRecordApiBaseUrl()}/api/medical-records`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //     },
      //     body: JSON.stringify({
      //       petId: getStoredMedicalPetId(),
      //       date: form.date,
      //       type: form.type,
      //       petName: form.petName,
      //       hospitalName: form.hospitalName,
      //       details: form.details,
      //       totalAmount: Number(form.totalAmount),
      //       imageUrl,
      //     }),
      //   },
      // );

      if (!saveResponse.ok) {
        const errorMessage = await saveResponse
          .json()
          .then((result: { message?: string }) => result.message)
          .catch(() => '');

        throw new Error(errorMessage || '진료 이력 저장에 실패했습니다.');
      }

      sessionStorage.removeItem(MEDICAL_RECORD_OCR_STORAGE_KEY);
      sessionStorage.removeItem(MEDICAL_RECORD_IMAGE_STORAGE_KEY);
      router.push('/health/medical-records');
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : '저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
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
            <div className="flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F6F5] text-[#B4BBB8] text-[18px]">
              {imageDataUrl ? (
                <img
                  src={toRenderableImageSrc(imageDataUrl)}
                  alt="업로드한 진단서(처방전)"
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

          {message ? (
            <p className="text-[#66706D] text-[16px]">{message}</p>
          ) : null}

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

export default function AddMedicalRecordPage() {
  return (
    <Suspense
      fallback={
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
            <div className="flex min-h-[240px] items-center justify-center text-[#66706D] text-[16px]">
              진료 이력 화면을 준비하고 있습니다.
            </div>
          </main>

          <BottomNavigation />
        </div>
      }
    >
      <AddMedicalRecordForm />
    </Suspense>
  );
}
