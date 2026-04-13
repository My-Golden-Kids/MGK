'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import HomePromptBubble from '@/components/home/HomePromptBubble';
import HomeScheduleBubble from '@/components/home/HomeScheduleBubble';
import SelectedPetProfile, {
  type Pet,
} from '@/components/home/SelectedPetProfile';
import type { Product } from '@/features/product/types/product';
import { fetchPets } from '@/features/settings/api/petSettingsApi';
import { getStoredAlarmEnabled } from '@/lib/alarm-setting';
import { clientFetch } from '@/lib/auth';
import {
  getStoredMedicalPetId,
  storeSelectedPetId,
} from '@/lib/medical-record';

type FinanceExpenseCategory = 'Food' | 'Hospital' | 'Etc';

type FinanceExpenseItem = {
  id: number;
  title: string;
  category: FinanceExpenseCategory;
  amount: number;
  memo: string | null;
  spendDate: string;
};

type FinanceExpenseSummaryResponse = {
  year: number;
  month: number;
  monthlyExpense: number;
  todayExpense: number;
  items: FinanceExpenseItem[];
};

type SpendingData = {
  monthlyAmount: string;
  primaryCategory: string;
  summary: string;
  savingsHint: string;
};

const CATEGORY_PRIORITY = [
  'Hospital',
  'Etc',
  'Food',
] as const satisfies readonly FinanceExpenseCategory[];

const CATEGORY_PRODUCT_LABEL: Record<FinanceExpenseCategory, string> = {
  Hospital: '보험',
  Etc: '적금',
  Food: '구독',
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  VACCINATION: '예방접종',
  CHECKUP: '건강검진',
};

function getMostFrequentWalkHour(
  records: Array<{ walkedAt: string | null }>,
): number | null {
  const counts: Record<number, number> = {};
  for (const r of records) {
    if (!r.walkedAt) continue;
    const h = new Date(r.walkedAt).getHours();
    counts[h] = (counts[h] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  entries.sort(([hA, cA], [hB, cB]) =>
    cB !== cA ? cB - cA : Number(hA) - Number(hB),
  );
  return Number(entries[0][0]);
}

// ──────────────────────────────────────────
// Alert localStorage helpers (user-level, 키 1개씩 고정)
// ──────────────────────────────────────────

const WALK_ALERT_KEY = 'walk-alert';
const CALENDAR_ALERT_KEY = 'calendar-alert';

type WalkAlertState = {
  date: string;
  hour: number;
  dismissed: boolean;
};

type CalendarAlertState = {
  date: string;
  dismissedEventTypes: string[];
};

function readAlert<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeAlert<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function isWalkAlertDismissed(dateStr: string, hour: number): boolean {
  const state = readAlert<WalkAlertState>(WALK_ALERT_KEY);
  return (
    state?.date === dateStr && state?.hour === hour && state?.dismissed === true
  );
}

function dismissWalkAlert(dateStr: string, hour: number): void {
  writeAlert<WalkAlertState>(WALK_ALERT_KEY, {
    date: dateStr,
    hour,
    dismissed: true,
  });
}

function isCalendarEventDismissed(dateStr: string, eventType: string): boolean {
  const state = readAlert<CalendarAlertState>(CALENDAR_ALERT_KEY);
  if (state?.date !== dateStr) return false;
  return state.dismissedEventTypes.includes(eventType);
}

function dismissCalendarEvent(dateStr: string, eventType: string): void {
  const state = readAlert<CalendarAlertState>(CALENDAR_ALERT_KEY);
  const existing =
    state?.date === dateStr ? state.dismissedEventTypes : [];
  writeAlert<CalendarAlertState>(CALENDAR_ALERT_KEY, {
    date: dateStr,
    dismissedEventTypes: [...new Set([...existing, eventType])],
  });
}

const WALK_BUBBLE_MESSAGE = '산책할 시간이에요!';

const CARD_SUMMARY_SUFFIX = '이 가장 잘 맞아요';
const DEFAULT_INSURANCE_LIMIT_COUNT = 20;
const DEFAULT_INSURANCE_BENEFIT_AMOUNT = 100000;
const DEFAULT_SUBSCRIPTION_SAVINGS_LABEL = '1.5만원';
const SPENDING_LOAD_ERROR_MESSAGE = '소비 데이터를 불러오지 못했어요.';

function formatCurrency(value: number) {
  return `${value.toLocaleString()}원`;
}

function formatNumberText(value: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatBenefitRateText(value?: number | null) {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}

function getDominantCategory(
  items: FinanceExpenseItem[],
): FinanceExpenseCategory | null {
  const totals = {
    Food: 0,
    Hospital: 0,
    Etc: 0,
  } satisfies Record<FinanceExpenseCategory, number>;

  for (const item of items) {
    totals[item.category] += item.amount;
  }

  const dominantCategory = CATEGORY_PRIORITY.reduce((currentBest, category) => {
    if (totals[category] > totals[currentBest]) {
      return category;
    }

    return currentBest;
  }, CATEGORY_PRIORITY[0]);

  return totals[dominantCategory] > 0 ? dominantCategory : null;
}

function buildSavingsHint(
  dominantCategory: FinanceExpenseCategory,
  items: FinanceExpenseItem[],
  products: Product[],
) {
  if (dominantCategory === 'Hospital') {
    const insuranceProduct = products.find(
      (product) => product.isActive && product.productType === 'INSURANCE',
    );
    const monthlyHospitalCount = items.filter(
      (item) => item.category === 'Hospital',
    ).length;
    const coveredCount = Math.min(
      monthlyHospitalCount,
      insuranceProduct?.benefitLimitCount ?? DEFAULT_INSURANCE_LIMIT_COUNT,
    );
    const benefitAmountManwon =
      Number(
        insuranceProduct?.benefitAmount ?? DEFAULT_INSURANCE_BENEFIT_AMOUNT,
      ) / 10000;
    const discountAmount = coveredCount * benefitAmountManwon;

    return `하나 펫 보험 가입하면, ${formatNumberText(discountAmount)}만원 할인 가능`;
  }

  if (dominantCategory === 'Etc') {
    const savingsProduct = products.find(
      (product) => product.isActive && product.productType === 'SAVINGS',
    );
    const benefitRateText = formatBenefitRateText(savingsProduct?.benefitRate);

    return benefitRateText
      ? `하나 펫 적금 가입하면, 연 ${benefitRateText}% 이자 가능`
      : '하나 펫 적금 가입하면, 이자 혜택 확인 가능';
  }

  return `하나 펫 구독 가입하면, ${DEFAULT_SUBSCRIPTION_SAVINGS_LABEL} 절약 가능`;
}

function buildSpendingData(
  financeSummary: FinanceExpenseSummaryResponse,
  products: Product[],
): SpendingData | null {
  const dominantCategory = getDominantCategory(financeSummary.items);

  if (!dominantCategory) {
    return null;
  }

  return {
    monthlyAmount: formatCurrency(Number(financeSummary.monthlyExpense ?? 0)),
    primaryCategory: CATEGORY_PRODUCT_LABEL[dominantCategory],
    summary: CARD_SUMMARY_SUFFIX,
    savingsHint: buildSavingsHint(
      dominantCategory,
      financeSummary.items,
      products,
    ),
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
  const [scheduleBubbles, setScheduleBubbles] = useState<string[]>([]);
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
    if (selectedPetId == null || !isAlarmEnabled) {
      return;
    }

    let isCancelled = false;

    const buildScheduleBubbles = async () => {
      const newBubbles: string[] = [];
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const currentHour = now.getHours();

      // ① 산책 알림 (최우선)
      try {
        const res = await clientFetch(
          `/api/pets/${selectedPetId}/walk-records`,
        );
        if (res.ok) {
          const records = (await res.json()) as Array<{
            walkedAt: string | null;
          }>;
          const mostFrequentHour = getMostFrequentWalkHour(records);
          if (
            mostFrequentHour !== null &&
            currentHour === mostFrequentHour &&
            !isWalkAlertDismissed(todayStr, currentHour)
          ) {
            newBubbles.push(WALK_BUBBLE_MESSAGE);
          }
        }
      } catch {}

      // ② 오늘 CalendarEvent 알림
      try {
        const res = await clientFetch(
          `/api/vaccinations/schedules?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
        );
        if (res.ok) {
          const schedules = (await res.json()) as Array<{
            date: string;
            eventTypes: string[];
          }>;
          for (const s of schedules.filter((s) => s.date === todayStr)) {
            for (const et of s.eventTypes) {
              if (!isCalendarEventDismissed(todayStr, et)) {
                newBubbles.push(
                  `오늘 ${EVENT_TYPE_LABEL[et] ?? et} 일정이 있어요!`,
                );
              }
            }
          }
        }
      } catch {}

      if (!isCancelled) {
        setScheduleBubbles(newBubbles);
        setScheduleBubbleIndex(0);
      }
    };

    void buildScheduleBubbles();

    return () => {
      isCancelled = true;
    };
  }, [selectedPetId, isAlarmEnabled]);

  useEffect(() => {
    let isCancelled = false;

    const loadSpendingData = async () => {
      setIsSpendingLoading(true);
      setSpendingErrorMessage(null);

      try {
        const currentMonth = new Date();
        const [financeResponse, productsResponse] = await Promise.all([
          clientFetch(
            `/api/account-books?year=${currentMonth.getFullYear()}&month=${
              currentMonth.getMonth() + 1
            }`,
          ),
          clientFetch('/api/products'),
        ]);

        if (!financeResponse.ok) {
          if (!isCancelled) {
            setSpendingData(null);
            setSpendingErrorMessage(SPENDING_LOAD_ERROR_MESSAGE);
          }
          return;
        }

        const financeSummary =
          (await financeResponse.json()) as FinanceExpenseSummaryResponse;
        const products = productsResponse.ok
          ? ((await productsResponse.json()) as Product[])
          : [];

        if (isCancelled) {
          return;
        }

        setSpendingData(buildSpendingData(financeSummary, products));
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
      <main className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto p-8">
        <header>
          <Link
            href="/settings"
            className="absolute top-0 right-0 z-10 cursor-pointer p-8 text-[24px] text-black leading-none transition-all hover:text-gray-500"
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
              messages={scheduleBubbles}
              currentIndex={scheduleBubbleIndex}
              onDismiss={() => {
                const dismissedMessage = scheduleBubbles[scheduleBubbleIndex];
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                if (dismissedMessage === WALK_BUBBLE_MESSAGE) {
                  dismissWalkAlert(todayStr, now.getHours());
                } else {
                  const eventType = Object.entries(EVENT_TYPE_LABEL).find(
                    ([, label]) =>
                      dismissedMessage === `오늘 ${label} 일정이 있어요!`,
                  )?.[0];
                  if (eventType) {
                    dismissCalendarEvent(todayStr, eventType);
                  }
                }

                setScheduleBubbleIndex((i) => i + 1);
              }}
            />
          )}
        </section>

        <section className="mb-6">
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
            <div className="flex min-h-[176px] flex-col items-center justify-center text-center">
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
            <div className="flex min-h-[176px] flex-col items-center justify-center text-center">
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
