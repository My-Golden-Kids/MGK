'use client';

import { useRouter } from 'next/navigation';
import OcrImageUploadPage from '@/components/common/OcrImageUploadPage';
import {
  getStoredMedicalPetId,
  MEDICAL_RECORD_IMAGE_STORAGE_KEY,
  MEDICAL_RECORD_OCR_STORAGE_KEY,
  storeSelectedPetId,
} from '@/lib/medical-record';

export default function AddMedicalRecordIntroPage() {
  const router = useRouter();
  const handleNext = async (previewImageUrl: string) => {
    sessionStorage.setItem(MEDICAL_RECORD_IMAGE_STORAGE_KEY, previewImageUrl);
    sessionStorage.removeItem(MEDICAL_RECORD_OCR_STORAGE_KEY);
    storeSelectedPetId(getStoredMedicalPetId());
    router.push('/health/medical-records/processing');
  };

  return (
    <OcrImageUploadPage
      title="진료 이력 등록"
      sectionLabel="진단서(처방전, 영수증 등)"
      uploadAlt="업로드한 진단서(처방전, 영수증 등)"
      missingImageMessage="먼저 진단서(처방전, 영수증 등) 사진을 업로드해 주세요."
      onNext={handleNext}
    />
  );
}
