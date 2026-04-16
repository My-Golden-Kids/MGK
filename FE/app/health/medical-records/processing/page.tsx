'use client';

import OcrProcessingPage from '@/components/common/OcrProcessingPage';
import {
  MEDICAL_RECORD_IMAGE_STORAGE_KEY,
  MEDICAL_RECORD_OCR_STORAGE_KEY,
} from '@/lib/medical-record';

export default function MedicalRecordProcessingPage() {
  return (
    <OcrProcessingPage
      imageStorageKey={MEDICAL_RECORD_IMAGE_STORAGE_KEY}
      ocrStorageKey={MEDICAL_RECORD_OCR_STORAGE_KEY}
      fileNamePrefix="medical-record"
      fallbackPath="/health/medical-records/add-image"
      successPath="/health/medical-records/add-record"
      errorPath="/health/medical-records/add-record?ocrError=1"
      uploadDir="hospital"
    />
  );
}
