export type MedicalRecordForm = {
  date: string;
  type: string;
  petName: string;
  hospitalName: string;
  details: string;
  totalAmount: string;
};

export type OcrMedicalRecord = {
  date: string;
  time?: string;
  type: string;
  petName: string;
  hospitalName: string;
  details: string;
  totalAmount: number | null;
  rawText?: string;
};

export type MedicalRecordItemData = {
  id: number;
  petId: number;
  date: string;
  type: string;
  petName: string;
  hospitalName: string;
  details: string;
  totalAmount: number;
  imageUrl?: string | null;
};

export const EMPTY_MEDICAL_RECORD_FORM: MedicalRecordForm = {
  date: '',
  type: '',
  petName: '',
  hospitalName: '',
  details: '',
  totalAmount: '',
};

export const MEDICAL_RECORD_IMAGE_STORAGE_KEY = 'medical-record-image-data-url';
export const MEDICAL_RECORD_OCR_STORAGE_KEY = 'medical-record-ocr-result';
export const SELECTED_PET_ID_STORAGE_KEY = 'selected-pet-id';

const FALLBACK_PET_ID = 1;

export function getMedicalRecordApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SPRING_API_URL ?? process.env.SPRING_API_URL ?? ''
  );
}

export function getStoredMedicalPetId() {
  if (typeof window === 'undefined') {
    return FALLBACK_PET_ID;
  }

  const storedValue =
    window.localStorage.getItem(SELECTED_PET_ID_STORAGE_KEY) ??
    window.sessionStorage.getItem(SELECTED_PET_ID_STORAGE_KEY);
  const parsedValue = Number(storedValue);

  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return FALLBACK_PET_ID;
}

export function storeSelectedPetId(petId: number | string) {
  if (typeof window === 'undefined') {
    return;
  }

  const value = String(petId);
  window.localStorage.setItem(SELECTED_PET_ID_STORAGE_KEY, value);
  window.sessionStorage.setItem(SELECTED_PET_ID_STORAGE_KEY, value);
}

export function mapOcrResultToForm(
  result: OcrMedicalRecord,
): MedicalRecordForm {
  return {
    date: result.date ?? '',
    type: result.type ?? '',
    petName: result.petName ?? '',
    hospitalName: result.hospitalName ?? '',
    details: result.details ?? '',
    totalAmount:
      result.totalAmount === null || result.totalAmount === undefined
        ? ''
        : String(result.totalAmount),
  };
}

export function dataUrlToFile(dataUrl: string, fileName: string) {
  const [metadata, content] = dataUrl.split(',');

  if (!metadata || !content) {
    throw new Error('유효하지 않은 이미지 데이터입니다.');
  }

  const mimeMatch = metadata.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'image/png';
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType });
}
