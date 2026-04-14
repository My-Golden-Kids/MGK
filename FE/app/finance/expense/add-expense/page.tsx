'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { TypeSelect } from '@/components/common/TypeSelect';
import { clientFetch } from '@/lib/auth';
import {
  EXPENSE_RECEIPT_IMAGE_STORAGE_KEY,
  EXPENSE_RECEIPT_OCR_STORAGE_KEY,
  mapOcrResultToExpenseDraft,
} from '@/lib/expense-receipt';
import type { OcrMedicalRecord } from '@/lib/medical-record';

const CATEGORY_OPTIONS = [
  { label: '식비', value: 'Food' },
  { label: '의료비', value: 'Hospital' },
  { label: '기타', value: 'Etc' },
] as const;

function toLocalDateTimeValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function AddExpensePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food');
  const [spendDate, setSpendDate] = useState(() =>
    toLocalDateTimeValue(new Date()),
  );
  const [memo, setMemo] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean;
    title: string;
    description: string;
    success: boolean;
  }>({
    open: false,
    title: '',
    description: '',
    success: false,
  });

  const numericAmount = useMemo(
    () => Number(amount.replaceAll(',', '').trim() || '0'),
    [amount],
  );

  useEffect(() => {
    const storedImageUrl = sessionStorage.getItem(
      EXPENSE_RECEIPT_IMAGE_STORAGE_KEY,
    );
    const storedOcrResult = sessionStorage.getItem(
      EXPENSE_RECEIPT_OCR_STORAGE_KEY,
    );

    if (storedImageUrl) {
      setReceiptImageUrl(storedImageUrl);
    }

    if (!storedOcrResult) {
      return;
    }

    try {
      const parsedResult = JSON.parse(storedOcrResult) as OcrMedicalRecord;
      const draft = mapOcrResultToExpenseDraft(parsedResult);

      if (draft.amount) {
        setAmount(Number(draft.amount).toLocaleString());
      }
      if (draft.title) {
        setTitle(draft.title);
      }
      setCategory(draft.category);
      if (draft.spendDate) {
        setSpendDate(draft.spendDate);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replaceAll(/[^0-9]/g, '');

    if (!digitsOnly) {
      setAmount('');
      return;
    }

    setAmount(Number(digitsOnly).toLocaleString());
  };

  const openModal = (
    titleText: string,
    descriptionText: string,
    success = false,
  ) => {
    setModalState({
      open: true,
      title: titleText,
      description: descriptionText,
      success,
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!numericAmount) {
      openModal('금액을 입력해주세요.', '지출 금액은 1원 이상이어야 해요.');
      return;
    }

    if (!title.trim()) {
      openModal('지출처를 입력해주세요.', '소비한 장소를 적어주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await clientFetch('/api/account-books', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          amount: numericAmount,
          category,
          memo: memo.trim(),
          spendDate,
        }),
      });

      if (!response.ok) {
        openModal('지출을 저장하지 못했어요.', '잠시 후 다시 시도해주세요.');
        return;
      }

      sessionStorage.removeItem(EXPENSE_RECEIPT_IMAGE_STORAGE_KEY);
      sessionStorage.removeItem(EXPENSE_RECEIPT_OCR_STORAGE_KEY);
      openModal('지출이 추가되었어요.', '가계부에 바로 반영됩니다.', true);
    } catch {
      openModal('지출을 저장하지 못했어요.', '네트워크 상태를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white text-[#27312D]">
      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="relative mb-8 flex items-center justify-center">
          <h1 className="text-center text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
            지출 추가하기
          </h1>
          <div className="-translate-y-1/2 absolute top-1/2 left-0">
            <BackButton />
          </div>
        </div>

        <section className="space-y-8">
          <section>
            <div>
              <span className="block font-semibold text-[18px]">
                업로드한 사진
              </span>
              <div className="mt-3 flex h-[180px] items-center justify-center overflow-hidden rounded-[14px] bg-[#F4F6F5] text-[#B4BBB8] text-[16px]">
                {receiptImageUrl ? (
                  <Image
                    src={receiptImageUrl}
                    alt="업로드한 영수증"
                    width={1200}
                    height={1200}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  '업로드한 사진이 없습니다.'
                )}
              </div>
            </div>
          </section>

          <label className="block">
            <span className="block font-semibold text-[18px]">금액</span>
            <div className="mt-2 flex items-center border-[#383838] border-b pb-2">
              <input
                value={amount}
                onChange={(event) => handleAmountChange(event.target.value)}
                inputMode="numeric"
                placeholder="0"
                className="min-w-0 flex-1 cursor-pointer bg-transparent font-semibold text-[#1A1A1A] text-[22px] outline-none placeholder:text-[#1A1A1A]"
              />
              <span className="ml-1 font-semibold text-[#1A1A1A] text-[22px]">
                원
              </span>
            </div>
          </label>

          <label className="block">
            <span className="block font-semibold text-[18px]">지출처</span>
            <div className="mt-2 border-[#383838] border-b pb-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="소비한 장소를 입력해주세요"
                className="w-full cursor-pointer bg-transparent text-[#1A1A1A] text-[18px] outline-none placeholder:text-[#CBCBCB]"
              />
            </div>
          </label>

          <div>
            <span className="block font-semibold text-[18px]">카테고리</span>
            <TypeSelect
              value={category}
              onValueChange={setCategory}
              options={CATEGORY_OPTIONS}
              variant="tabs"
              className="mt-3 rounded-[12px] bg-[#F1F3F6] p-1"
              tabButtonClassName="h-[44px] text-[18px] font-medium"
              activeTabButtonClassName="bg-white font-semibold text-[#1E2524]"
              inactiveTabButtonClassName="text-[#8B95A1]"
            />
          </div>

          <label className="block">
            <span className="block font-semibold text-[18px]">지출일시</span>
            <div className="mt-2 border-[#383838] border-b pb-2">
              <input
                type="datetime-local"
                value={spendDate}
                onChange={(event) => setSpendDate(event.target.value)}
                className="w-full cursor-pointer bg-transparent text-[#4CAFA3] text-[18px] outline-none"
              />
            </div>
          </label>

          <label className="block">
            <span className="block font-semibold text-[18px]">메모</span>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              className="mt-3 h-[124px] w-full resize-none rounded-[14px] border border-[#D5DADF] bg-white px-4 py-3 text-[17px] outline-none placeholder:text-[#B9C0C8]"
              placeholder="남길 메모를 입력해주세요"
              maxLength={1000}
            />
          </label>
        </section>

        <div className="pt-10">
          <Button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting}
            className="h-[62px] w-full rounded-[12px] bg-[#55AE9F] font-semibold text-[20px] text-white hover:bg-[#4ca496]"
          >
            {isSubmitting ? '추가 중...' : '추가'}
          </Button>
        </div>
      </main>

      <BottomNavigation />

      <Modal
        isOpen={modalState.open}
        onClose={() =>
          setModalState((current) => ({
            ...current,
            open: false,
          }))
        }
        onConfirm={() => {
          setModalState((current) => ({
            ...current,
            open: false,
          }));

          if (modalState.success) {
            router.push('/finance/expense');
          }
        }}
        buttonVariant="single"
        confirmText="확인"
        isHighlightButton={modalState.success}
      >
        <div className="px-2 py-5 text-center">
          <h2 className="font-semibold text-[#1F2524] text-[22px]">
            {modalState.title}
          </h2>
          <p className="mt-3 text-[#687076] text-[17px] leading-[1.5]">
            {modalState.description}
          </p>
        </div>
      </Modal>
    </div>
  );
}
