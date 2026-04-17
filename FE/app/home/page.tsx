'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import HomePromptBubble from '@/components/home/HomePromptBubble';
import HomeScheduleBubble from '@/components/home/HomeScheduleBubble';
import SelectedPetProfile, {
  type Pet,
} from '@/components/home/SelectedPetProfile';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchScheduleBubbles,
  type ScheduleBubble,
} from '@/features/home/homeApi';
import { fetchPets } from '@/features/settings/api/petSettingsApi';
import { getStoredAlarmEnabled } from '@/lib/alarm-setting';
import { clientFetch } from '@/lib/client-fetch';
import {
  getStoredMedicalPetId,
  storeSelectedPetId,
} from '@/lib/medical-record';

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

function renderSavingsHint(text: string) {
  const matchedAmount = text.match(/(\d[\d,]*(?:\.\d+)?(?:원|만원|%))/);

  if (!matchedAmount || matchedAmount.index == null) {
    return text;
  }

  const startIndex = matchedAmount.index;
  const amountText = matchedAmount[0];
  const endIndex = startIndex + amountText.length;

  return (
    <>
      {text.slice(0, startIndex)}
      <span className="font-extrabold text-[#DB1F26]">{amountText}</span>
      {text.slice(endIndex)}
    </>
  );
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

      const nextPets = result.pets
        .filter((pet) => !pet.isDeath)
        .map(({ id, name, imageUrl }) => ({
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
    if (isPetsLoading) {
      return;
    }

    let isCancelled = false;

    const loadSpendingData = async () => {
      setIsSpendingLoading(true);
      setSpendingErrorMessage(null);

      try {
        const currentMonth = new Date();
        const petQuery =
          selectedPetId != null && selectedPetId > 0
            ? `&petId=${selectedPetId}`
            : '';
        const financeResponse = await clientFetch(
          `/api/account-books/home-summary?year=${currentMonth.getFullYear()}&month=${
            currentMonth.getMonth() + 1
          }${petQuery}`,
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
  }, [isPetsLoading, selectedPetId]);

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
      <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto">
        <header className="flex shrink-0 items-center justify-between px-8 pt-4">
          <Link
            href="/home/coupon"
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
            aria-label="쿠폰 페이지로 이동"
          >
            <Image
              src="/images/home/coupon.png"
              alt="쿠폰"
              fill
              sizes="40px"
              className="object-contain"
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

        <div className="flex flex-1 flex-col px-8 py-4">
          <section className="px-6 lg:min-h-[206px]">
            {(shouldShowPromptBubble || shouldShowScheduleBubble) && (
              <>
                {shouldShowPromptBubble && (
                  <HomePromptBubble
                    message={`주인님! 저에 대해\n더 알려주세요!`}
                    showAnswerButtons={true}
                    onYesClick={() => router.push('/onboarding/7')}
                    onNoClick={() => setShowBubble(false)}
                    yesLabel="O"
                    noLabel="X"
                  />
                )}
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
              </>
            )}
          </section>

          <div className="mt-auto flex flex-col gap-5 md:gap-6 lg:gap-7">
            <section>
              <SelectedPetProfile
                pets={pets}
                selectedPetId={selectedPetId}
                onChange={setSelectedPetId}
                onSelectedClick={handleTalkClick}
              />
              <div>
                {selectedPet ? (
                  <p className="text-center font-extrabold text-[28px] md:text-[32px] lg:text-[36px]">
                    {selectedPet.name}
                  </p>
                ) : isPetsLoading ? (
                  <div className="flex justify-center">
                    <Skeleton className="h-[28px] w-[120px] rounded-[8px]" />
                  </div>
                ) : null}
              </div>
              <div className={isPetsLoading ? 'min-h-[24px]' : undefined}>
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
                  <p className="text-center font-medium text-[#66706D] text-[16px] leading-snug md:text-[18px] lg:text-[20px]">
                    등록된 반려동물이 없어요.
                    <br />
                    먼저 반려동물을 추가해 주세요.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="flex justify-center">
              <div className="flex h-fit w-[200px] overflow-hidden rounded-full border-2 border-[#25C3A8] bg-white md:w-[240px] lg:w-[280px]">
                <button
                  type="button"
                  onClick={handleTalkClick}
                  className="flex flex-1 cursor-pointer items-center justify-center bg-[#25C3A8] py-1 font-bold text-[17px] text-white transition-all hover:brightness-90 md:text-[21px] lg:text-[25px]"
                >
                  말하기
                </button>
                <button
                  type="button"
                  onClick={handleDirectInputClick}
                  className="flex flex-1 cursor-pointer items-center justify-center bg-white py-1 font-bold text-[#25C3A8] text-[17px] transition-opacity hover:opacity-80 md:text-[21px] lg:text-[25px]"
                >
                  직접입력
                </button>
              </div>
            </section>

            {isSpendingLoading ? (
              <section className="rounded-[24px] border-2 border-[var(--color-main-green)] bg-white p-5 md:p-6 lg:p-7">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="font-extrabold text-[20px] text-[var(--color-main-green)] leading-tight md:text-[24px] lg:text-[28px]">
                    이번달 소비
                  </h2>
                  <Skeleton className="h-[28px] w-[108px] rounded-[8px]" />
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <Skeleton className="h-[24px] w-[88px] rounded-[8px]" />
                  <Skeleton className="h-[24px] w-[140px] rounded-[8px]" />
                </div>

                <Skeleton className="mb-5 h-[24px] w-[200px] rounded-[8px]" />

                <Skeleton className="h-[56px] w-full rounded-[12px] bg-[#25C3A8]/25" />
              </section>
            ) : spendingData ? (
              <section className="rounded-[24px] border-2 border-[var(--color-main-green)] bg-white p-5 md:p-6 lg:p-7">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h2 className="font-bold text-[20px] text-[var(--color-main-green)] leading-tight md:text-[24px] lg:text-[28px]">
                    이번달 소비
                  </h2>
                  <p className="text-right font-extrabold text-[20px] leading-tight md:text-[24px] lg:text-[28px]">
                    {spendingData.monthlyAmount}
                  </p>
                </div>

                <p className="mb-1 text-[16px] leading-tight md:text-[18px] lg:text-[20px]">
                  <span className="font-bold text-[var(--color-main-green)]">
                    {spendingData.primaryCategory}
                  </span>
                  {spendingData.summary}
                </p>

                <p className="mb-5 text-[16px] leading-tight md:text-[18px] lg:text-[20px]">
                  {renderSavingsHint(spendingData.savingsHint)}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      selectedPetId != null && selectedPetId > 0
                        ? `/finance/report?petId=${selectedPetId}`
                        : '/finance/report',
                    )
                  }
                  className="flex h-fit w-full cursor-pointer items-center justify-center rounded-[12px] bg-[var(--color-mint-green)] py-1.5 font-semibold text-[18px] text-white transition-all hover:brightness-90 md:py-2 md:text-[22px] lg:py-2.5 lg:text-[26px]"
                >
                  리포트 보러가기
                </button>
              </section>
            ) : (
              <section className="rounded-[24px] border-2 border-[var(--color-main-green)] bg-white p-5 md:p-6 lg:p-7">
                <div className="flex min-h-[170px] flex-col items-center justify-center text-center">
                  <p className="mb-5 font-bold text-[#0DA892] text-[18px] leading-tight md:text-[20px] lg:text-[22px]">
                    {spendingErrorMessage ??
                      '아직 등록된 소비 데이터가 없어요!'}
                  </p>

                  <button
                    type="button"
                    onClick={() => router.push('/finance/expense/add-image')}
                    className="flex h-fit w-full cursor-pointer items-center justify-center rounded-[12px] bg-[var(--color-mint-green)] py-1.5 font-bold text-[18px] text-white transition-all hover:brightness-90 md:py-2 md:text-[22px] lg:py-2.5 lg:text-[26px]"
                  >
                    지출 등록하기
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
