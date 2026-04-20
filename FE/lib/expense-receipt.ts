import type { OcrMedicalRecord } from '@/lib/medical-record';

export const EXPENSE_RECEIPT_IMAGE_STORAGE_KEY =
  'expense-receipt-image-data-url';
export const EXPENSE_RECEIPT_OCR_STORAGE_KEY = 'expense-receipt-ocr-result';

export type ExpenseReceiptDraft = {
  amount: string;
  title: string;
  category: 'Food' | 'Hospital' | 'Etc';
  rawText: string;
  spendDate: string;
};

export function mapOcrResultToExpenseDraft(
  result: OcrMedicalRecord,
): ExpenseReceiptDraft {
  const derivedTitle = deriveExpenseTitle(result);
  const derivedCategory = deriveExpenseCategory(result);

  return {
    amount:
      result.totalAmount === null || result.totalAmount === undefined
        ? ''
        : String(result.totalAmount),
    title: derivedTitle,
    category: derivedCategory,
    rawText: result.rawText ?? '',
    spendDate: deriveExpenseSpendDate(result.date, result.time),
  };
}

function deriveExpenseTitle(result: OcrMedicalRecord) {
  if (result.hospitalName?.trim()) {
    return result.hospitalName.trim();
  }

  if (result.details?.trim()) {
    return result.details.split('/')[0]?.trim() ?? '';
  }

  return '';
}

function deriveExpenseCategory(
  result: OcrMedicalRecord,
): 'Food' | 'Hospital' | 'Etc' {
  const sourceText = [
    result.type,
    result.hospitalName,
    result.details,
    result.rawText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const hospitalKeywords = [
    '병원',
    '의원',
    '메디컬',
    '진료',
    '접종',
    '백신',
    '예방',
    '처방',
    '검사',
    '의료',
  ];
  const foodKeywords = [
    '식당',
    '카페',
    '커피',
    '베이커리',
    '음료',
    '푸드',
    '치킨',
    '피자',
    '버거',
    '분식',
    '식사',
    '배달',
    '디저트',
  ];

  if (hospitalKeywords.some((keyword) => sourceText.includes(keyword))) {
    return 'Hospital';
  }

  if (foodKeywords.some((keyword) => sourceText.includes(keyword))) {
    return 'Food';
  }

  return 'Etc';
}

function deriveExpenseSpendDate(date: string, time?: string) {
  if (!date?.trim()) {
    return '';
  }

  const normalizedTime = normalizeExpenseTime(time);
  return `${date.trim()}T${normalizedTime}`;
}

function normalizeExpenseTime(time?: string) {
  if (!time?.trim()) {
    return '12:00';
  }

  const matchedTime = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!matchedTime) {
    return '12:00';
  }

  const hour = Number(matchedTime[1]);
  const minute = Number(matchedTime[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return '12:00';
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
