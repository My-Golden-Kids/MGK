'use client';

import { BottomNavigation } from '@/components/common/BottomNavigation';
import HomePromptBubble from '@/components/home/HomePromptBubble';
import HomeScheduleBubble from '@/components/home/HomeScheduleBubble';
import SelectedPetProfile, {
  type Pet,
} from '@/components/home/SelectedPetProfile';
import {
  fetchScheduleBubbles,
  type ScheduleBubble,
} from '@/features/home/homeApi';
import { fetchPets } from '@/features/settings/api/petSettingsApi';
import { getStoredAlarmEnabled } from '@/lib/alarm-setting';
import { clientFetch } from '@/lib/auth';
import {
  getStoredMedicalPetId,
  storeSelectedPetId,
} from '@/lib/medical-record';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type HomeSpendingSummaryResponse = {
  monthlyAmount: number | string | null;
  primaryCategory: string;
  summary: string;
  savingsHint: string;
};

type SpendingData = {
  monthlyAmount: string;
  primaryCategory: string;
  summary: string;
  savingsHint: string;
};

const SPENDING_LOAD_ERROR_MESSAGE = '소비 데이터를 불러오지 못했어요.';

function formatCurrency(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `${safeValue.toLocaleString()}원`;
}

function mapHomeSpendingSummary(
  financeSummary: HomeSpendingSummaryResponse,
): SpendingData {
  return {
    monthlyAmount: formatCurrency(Number(financeSummary.monthlyAmount ?? 0)),
    primaryCategory: financeSummary.primaryCategory,
    summary: financeSummary.summary,
    savingsHint: financeSummary.savingsHint,
  };
}

export default function HomePage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [isPetsLoading, setIsPetsLoading] = useState(true);
  const [petsErrorMessage, setPetsErrorMessage] = useState<string | null>(null);
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [isSpendingLoading, setIsSpendingLoading] = useState(true);
  const [spendingErrorMessage, setSpendingErrorMessage] = useState<
    string | null
  >(null);
  const [showBubble, setShowBubble] = useState(true);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
  const [scheduleBubbles, setScheduleBubbles] = useState<ScheduleBubble[]>([]);
  const [scheduleBubbleIndex, setScheduleBubbleIndex] = useState(0);

  const shouldShowPromptBubble =
    isAlarmEnabled && !isPetsLoading && pets.length === 0 && showBubble;

  const shouldShowScheduleBubble =
    isAlarmEnabled &&
    !isPetsLoading &&
    pets.length > 0 &&
    scheduleBubbleIndex < scheduleBubbles.length;

  useEffect(() => {
    setIsAlarmEnabled(getStoredAlarmEnabled());
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadPets = async () => {
      setIsPetsLoading(true);
      setPetsErrorMessage(null);

      const result = await fetchPets();

      if (isCancelled) {
        return;
      }

      if (!result.ok || !result.pets) {
        setPets([]);
        setPetsErrorMessage(
          result.errorMessage ?? '반려동물 정보를 불러오지 못했어요.',
        );
        setIsPetsLoading(false);
        return;
      }

      const nextPets = result.pets.map(({ id, name, imageUrl }) => ({
        id,
        name,
        imageUrl,
      }));

      setPets(nextPets);
      setIsPetsLoading(false);
    };

    void loadPets();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pets.length) {
      setSelectedPetId(null);
      return;
    }

    setSelectedPetId((currentSelectedPetId) => {
      if (
        currentSelectedPetId != null &&
        pets.some((pet) => pet.id === currentSelectedPetId)
      ) {
        return currentSelectedPetId;
      }

      const storedPetId = getStoredMedicalPetId();
      const storedPet = pets.find((pet) => pet.id === storedPetId);

      if (storedPet) {
        return storedPet.id;
      }

      return pets[0].id;
    });
  }, [pets]);

  useEffect(() => {
    if (selectedPetId == null) {
      return;
    }

    storeSelectedPetId(selectedPetId);
  }, [selectedPetId]);

  useEffect(() => {
    if (!isAlarmEnabled || isPetsLoading || pets.length === 0) {
      return;
    }

    let isCancelled = false;

    const buildScheduleBubbles = async () => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const bubbles = await fetchScheduleBubbles(todayStr, now.getHours());
      if (!isCancelled) {
        setScheduleBubbles(bubbles);
        setScheduleBubbleIndex(0);
      }
    };

    void buildScheduleBubbles();

    return () => {
      isCancelled = true;
    };
  }, [isAlarmEnabled, isPetsLoading, pets.length]);

  useEffect(() => {
    let isCancelled = false;

    const loadSpendingData = async () => {
      setIsSpendingLoading(true);
      setSpendingErrorMessage(null);

      try {
        const currentMonth = new Date();
        const financeResponse = await clientFetch(
          `/api/account-books/home-summary?year=${currentMonth.getFullYear()}&month=${
            currentMonth.getMonth() + 1
          }`,
        );

        if (financeResponse.status === 204) {
          if (!isCancelled) {
            setSpendingData(null);
          }
          return;
        }

        if (!financeResponse.ok) {
          if (!isCancelled) {
            setSpendingData(null);
            setSpendingErrorMessage(SPENDING_LOAD_ERROR_MESSAGE);
          }
          return;
        }

        const financeSummary =
          (await financeResponse.json()) as HomeSpendingSummaryResponse;

        if (isCancelled) {
          return;
        }

        setSpendingData(mapHomeSpendingSummary(financeSummary));
      } catch {
        if (!isCancelled) {
          setSpendingData(null);
          setSpendingErrorMessage(SPENDING_LOAD_ERROR_MESSAGE);
        }
      } finally {
        if (!isCancelled) {
          setIsSpendingLoading(false);
        }
      }
    };

    void loadSpendingData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectedPet = useMemo(() => {
    if (!pets.length || selectedPetId == null) {
      return null;
    }

    return pets.find((pet) => pet.id === selectedPetId) ?? pets[0] ?? null;
  }, [pets, selectedPetId]);

  const handleTalkClick = () => {
    router.push('/home/talk');
  };

  const handleDirectInputClick = () => {
    router.push('/home/talk?mode=text');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#FFFFFF]">
      <main className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <header className="flex h-10 items-center justify-between">
          <Link
            href="/home/coupon"
            className="z-10 flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
            aria-label="쿠폰 페이지로 이동"
          >
            <Image
              src="/images/home/coupon.png"
              alt="쿠폰"
              width={40}
              height={40}
              priority
            />
          </Link>
          <Link
            href="/settings"
            className="z-10 inline-flex h-10 cursor-pointer items-center text-[24px] text-black leading-none transition-all hover:text-gray-500"
          >
            설정
          </Link>
        </header>

        <section className="">
          <div className={shouldShowPromptBubble ? '' : 'invisible'}>
            <HomePromptBubble
              message={`주인님! 저에 대해\n더 알려주세요!`}
              showAnswerButtons={true}
              onYesClick={() => router.push('/onboarding/7')}
              onNoClick={() => setShowBubble(false)}
              yesLabel="O"
              noLabel="X"
            />
          </div>
          {shouldShowScheduleBubble && (
            <HomeScheduleBubble
              messages={scheduleBubbles.map((b) => b.message)}
              currentIndex={scheduleBubbleIndex}
              onDismiss={() => {
                scheduleBubbles[scheduleBubbleIndex]?.onDismiss();
                setScheduleBubbleIndex((i) => i + 1);
              }}
            />
          )}
        </section>

        <section className="mb-4">
          <SelectedPetProfile
            pets={pets}
            selectedPetId={selectedPetId}
            onChange={setSelectedPetId}
            onSelectedClick={handleTalkClick}
          />
          {selectedPet ? (
            <p className="text-center font-extrabold text-[28px] text-black leading-none">
              {selectedPet.name}
            </p>
          ) : null}
          {isPetsLoading ? (
            <p className="text-center font-medium text-[#66706D] text-[16px]">
              반려동물 정보를 불러오는 중이에요.
            </p>
          ) : null}
          {!isPetsLoading && petsErrorMessage ? (
            <p className="mt-4 text-center font-medium text-[16px] text-red-500">
              {petsErrorMessage}
            </p>
          ) : null}
          {!isPetsLoading && !petsErrorMessage && pets.length === 0 ? (
            <p className="text-center font-medium text-[#66706D] text-[16px]">
              등록된 반려동물이 없어요. 먼저 반려동물을 추가해 주세요.
            </p>
          ) : null}
        </section>

        <section className="mb-6 flex justify-center">
          <div className="flex h-[50px] w-full max-w-[260px] overflow-hidden rounded-full border-2 border-[#25C3A8] bg-white">
            <button
              type="button"
              onClick={handleTalkClick}
              className="flex flex-1 cursor-pointer items-center justify-center bg-[#25C3A8] font-extrabold text-[18px] text-white transition-all hover:brightness-90"
            >
              말하기
            </button>
            <button
              type="button"
              onClick={handleDirectInputClick}
              className="flex flex-1 cursor-pointer items-center justify-center bg-white font-extrabold text-[#25C3A8] text-[18px] transition-opacity hover:opacity-80"
            >
              직접입력
            </button>
          </div>
        </section>

        {isSpendingLoading ? (
          <section className="rounded-[24px] border-2 border-[#25C3A8] bg-white py-6">
            <div className="flex min-h-[170px] flex-col items-center justify-center text-center">
              <p className="font-extrabold text-[20px] text-[rgb(13,168,146)] leading-tight">
                소비 데이터를 불러오는 중이에요.
              </p>
            </div>
          </section>
        ) : spendingData ? (
          <section className="rounded-[24px] border-2 border-[#25C3A8] bg-white px-4 py-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="font-extrabold text-[#0DA892] text-[20px] leading-tight">
                이번달 소비
              </h2>
              <p className="text-right font-extrabold text-[22px] text-black leading-tight">
                {spendingData.monthlyAmount}
              </p>
            </div>

            <p className="mb-1 font-bold text-[18px] text-black leading-snug">
              <span className="text-[#0DA892]">
                {spendingData.primaryCategory}
              </span>
              {spendingData.summary}
            </p>

            <p className="mb-5 font-bold text-[18px] text-black leading-snug">
              {spendingData.savingsHint}
            </p>

            <button
              type="button"
              onClick={() => router.push('/finance/report')}
              className="flex h-[56px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#25C3A8] font-extrabold text-[20px] text-white transition-all hover:brightness-90"
            >
              리포트 보러가기
            </button>
          </section>
        ) : (
          <section className="rounded-[24px] border-2 border-[#25C3A8] bg-white py-6">
            <div className="flex min-h-[170px] flex-col items-center justify-center text-center">
              <p className="mb-5 font-extrabold text-[#0DA892] text-[20px] leading-tight">
                {spendingErrorMessage ?? '아직 등록된 소비 데이터가 없어요!'}
              </p>

              <button
                type="button"
                onClick={() => router.push('/finance/expense/add-image')}
                className="flex h-[56px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-[12px] bg-[#25C3A8] px-4 font-extrabold text-[20px] text-white transition-all hover:brightness-90"
              >
                지출 등록하기
              </button>
            </div>
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
