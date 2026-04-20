'use client';

import { useRouter } from 'next/navigation';
import OcrImageUploadPage from '@/components/common/OcrImageUploadPage';
import {
  EXPENSE_RECEIPT_IMAGE_STORAGE_KEY,
  EXPENSE_RECEIPT_OCR_STORAGE_KEY,
} from '@/lib/expense-receipt';

export default function AddExpenseImagePage() {
  const router = useRouter();

  const handleNext = async (previewImageUrl: string) => {
    sessionStorage.setItem(EXPENSE_RECEIPT_IMAGE_STORAGE_KEY, previewImageUrl);
    sessionStorage.removeItem(EXPENSE_RECEIPT_OCR_STORAGE_KEY);
    router.push('/finance/expense/processing');
  };

  return (
    <OcrImageUploadPage
      title="지출 추가"
      sectionLabel="영수증"
      uploadAlt="업로드한 영수증"
      missingImageMessage="먼저 영수증 사진을 업로드해 주세요."
      onNext={handleNext}
    />
  );
}
