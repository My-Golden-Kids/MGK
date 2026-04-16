'use client';

import OcrProcessingPage from '@/components/common/OcrProcessingPage';
import {
  EXPENSE_RECEIPT_IMAGE_STORAGE_KEY,
  EXPENSE_RECEIPT_OCR_STORAGE_KEY,
} from '@/lib/expense-receipt';

export default function ExpenseProcessingPage() {
  return (
    <OcrProcessingPage
      imageStorageKey={EXPENSE_RECEIPT_IMAGE_STORAGE_KEY}
      ocrStorageKey={EXPENSE_RECEIPT_OCR_STORAGE_KEY}
      fileNamePrefix="expense-receipt"
      fallbackPath="/finance/expense/add-image"
      successPath="/finance/expense/add-expense"
      errorPath="/finance/expense/add-expense?ocrError=1"
      uploadDir="expense"
    />
  );
}
