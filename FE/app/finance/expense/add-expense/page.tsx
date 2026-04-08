'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { TypeSelect } from '@/components/common/TypeSelect';
import { clientFetch } from '@/lib/auth';

const CATEGORY_OPTIONS = [
  { label: '식비', value: 'Food' },
  { label: '의료비', value: 'Hospital' },
  { label: '기타', value: 'Etc' },
] as const;

function formatSpendDateInput(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

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

      openModal('지출이 추가되었어요.', '가계부에 바로 반영됩니다.', true);
    } catch {
      openModal('지출을 저장하지 못했어요.', '네트워크 상태를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-white text-[#202625]">
      <main className="flex-1 px-6 pb-6">
        <div className="overflow-hidden">
          <BackButton />
        </div>

        <header className="pt-1 pb-6 text-center">
          <h1 className="font-bold text-[24px] tracking-[-0.04em]">
            지출 추가하기
          </h1>
        </header>

        <section className="space-y-8">
          <label className="block">
            <span className="block font-semibold text-[18px]">금액</span>
            <div className="mt-2 border-[#383838] border-b pb-2">
              <input
                value={amount}
                onChange={(event) => handleAmountChange(event.target.value)}
                inputMode="numeric"
                placeholder="0"
                className="w-full bg-transparent font-semibold text-[#1A1A1A] text-[22px] outline-none placeholder:text-[#1A1A1A]"
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
                className="w-full bg-transparent text-[#1A1A1A] text-[18px] outline-none placeholder:text-[#CBCBCB]"
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
                className="w-full bg-transparent text-[#4CAFA3] text-[18px] outline-none"
              />
            </div>
            <p className="mt-2 font-medium text-[#4CAFA3] text-[18px]">
              {formatSpendDateInput(spendDate)}
            </p>
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
