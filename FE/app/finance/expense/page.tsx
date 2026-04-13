'use client';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';
import ExpenseItem, {
  type ExpenseItemProps,
  type ExpenseType,
} from '@/components/finance/ExpenseItem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { clientFetch } from '@/lib/auth';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

type ExpenseGroup = {
  id: string;
  dateLabel: string;
  items: (ExpenseItemProps & { id: number })[];
};

type FinanceExpenseItem = {
  id: number;
  title: string;
  category: 'Food' | 'Hospital' | 'Etc';
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

const RESPONSIVE_TEXT_SIZE =
  'text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px]';

const DAY_LABELS = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
] as const;

const CATEGORY_LABEL_MAP: Record<FinanceExpenseItem['category'], string> = {
  Food: '식비',
  Hospital: '의료비',
  Etc: '기타',
};

const CATEGORY_TYPE_MAP: Record<FinanceExpenseItem['category'], ExpenseType> = {
  Food: 'food',
  Hospital: 'medical',
  Etc: 'other',
};

function formatCurrency(value: number) {
  return `${value.toLocaleString()} 원`;
}

function getMonthDate(baseDate: Date, offset: number) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatYearLabel(date: Date) {
  return `${date.getFullYear()}년`;
}

function formatMonthLabel(date: Date) {
  return `${date.getMonth() + 1}월`;
}

export default function FinanceExpensesPage() {
  const today = useMemo(() => new Date(), []);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseSummary, setExpenseSummary] =
    useState<FinanceExpenseSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedExpense, setSelectedExpense] =
    useState<FinanceExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentMonth = useMemo(
    () =>
      selectedDate
        ? new Date(`${selectedDate}T00:00:00`)
        : getMonthDate(today, monthOffset),
    [monthOffset, selectedDate, today],
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const normalizedSelectedDate = selectedDate.trim();
  const groupedExpenses = useMemo(() => {
    if (!expenseSummary) {
      return [];
    }

    const groupedMap = new Map<string, ExpenseGroup>();

    for (const item of expenseSummary.items) {
      const groupKey = item.spendDate.slice(0, 10);
      const currentGroup = groupedMap.get(groupKey);
      const mappedItem: ExpenseItemProps = {
        title: item.title,
        category: CATEGORY_LABEL_MAP[item.category],
        amount: item.amount,
        type: CATEGORY_TYPE_MAP[item.category],
      };

      if (currentGroup) {
        currentGroup.items.push({ ...mappedItem, id: item.id });
        continue;
      }

      groupedMap.set(groupKey, {
        id: groupKey,
        dateLabel: formatDateLabel(item.spendDate),
        items: [{ ...mappedItem, id: item.id }],
      });
    }

    return Array.from(groupedMap.values());
  }, [expenseSummary]);

  useEffect(() => {
    const fetchExpenses = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await clientFetch(
          `/api/account-books?year=${currentMonth.getFullYear()}&month=${
            currentMonth.getMonth() + 1
          }`,
        );

        if (!response.ok) {
          setLoadError('지출 내역을 불러오지 못했어요.');
          setExpenseSummary(null);
          return;
        }

        const data = (await response.json()) as FinanceExpenseSummaryResponse;
        setExpenseSummary(data);
      } catch {
        setLoadError('지출 내역을 불러오지 못했어요.');
        setExpenseSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchExpenses();
  }, [currentMonth, refreshKey]);

  const filteredGroups = useMemo(() => {
    return groupedExpenses
      .filter((group) =>
        normalizedSelectedDate ? group.id === normalizedSelectedDate : true,
      )
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!normalizedQuery) {
            return true;
          }
          const title = item.title.toLowerCase();
          const category = item.category.toLowerCase();
          return (
            title.includes(normalizedQuery) ||
            category.includes(normalizedQuery)
          );
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedExpenses, normalizedQuery, normalizedSelectedDate]);

  const canMoveNext = useMemo(() => {
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const viewedMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );

    return viewedMonth < todayMonth;
  }, [currentMonth, today]);

  const moveMonth = (direction: -1 | 1) => {
    if (selectedDate) {
      const baseDate = new Date(`${selectedDate}T00:00:00`);
      const nextDate = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth() + direction,
        baseDate.getDate(),
      );

      if (direction === 1 && nextDate > today) {
        return;
      }

      setSelectedDate(formatDateInputValue(nextDate));
      return;
    }

    setMonthOffset((currentOffset) => {
      if (direction === 1 && currentOffset >= 0) {
        return currentOffset;
      }

      return currentOffset + direction;
    });
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense || isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await clientFetch(
        `/api/account-books/${selectedExpense.id}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        setLoadError('지출 삭제에 실패했어요.');
        return;
      }

      setSelectedExpense(null);
      setRefreshKey((current) => current + 1);
    } catch {
      setLoadError('지출 삭제에 실패했어요.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCalendarButtonClick = () => {
    const input = dateInputRef.current;

    if (!input) {
      return;
    }

    if ('showPicker' in input) {
      input.showPicker();
      return;
    }

    input.click();
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-white text-foreground">
      <main className="flex-1 px-5 pt-3 sm:px-6 sm:pt-4 md:px-8 md:pt-5 lg:px-10 lg:pt-6">
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(event) => {
            const nextValue = event.target.value;
            setSelectedDate(nextValue);

            if (!nextValue) {
              setMonthOffset(0);
            }
          }}
          max={formatDateInputValue(today)}
          className="sr-only"
          aria-label="날짜 선택"
        />

        <div className="ml-[-12]">
          <BackButton />
        </div>

        <section className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="cursor-pointer rounded-full bg-[var(--color-main-green)]/10 text-[var(--color-main-green)] transition-all hover:bg-[var(--color-main-green)]/15 hover:brightness-95"
              onClick={() => moveMonth(-1)}
              aria-label="이전 달 보기"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="font-medium text-[20px] text-foreground md:text-[24px] lg:text-[28px]">
              {formatYearLabel(currentMonth)}
            </p>
            <h1
              className={`${RESPONSIVE_TEXT_SIZE} font-semibold text-foreground tracking-[-0.03em]`}
            >
              {formatMonthLabel(currentMonth)}
            </h1>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="cursor-pointer rounded-full bg-[var(--color-main-green)]/10 text-[var(--color-main-green)] transition-all hover:bg-[var(--color-main-green)]/15 hover:brightness-95"
              onClick={() => moveMonth(1)}
              disabled={!canMoveNext}
              aria-label="다음 달 보기"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <button
              type="button"
              onClick={handleCalendarButtonClick}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--color-main-green)]/10 text-[var(--color-main-green)] transition-all hover:bg-[var(--color-main-green)]/15 hover:brightness-95 md:h-8 md:w-8"
              aria-label="캘린더로 날짜 선택"
            >
              <CalendarDays className="h-4.5 w-4.5 md:h-5 md:w-5" />
            </button>
          </div>

          <Link
            href="/finance/expense/add-image"
            aria-label="지출 추가"
            className="cursor-pointer"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-full text-[var(--color-main-green)] transition-all hover:bg-[var(--color-main-green)]/10 hover:text-[var(--color-main-green)] hover:brightness-95"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </Link>
        </section>

        <section className="mt-6 space-y-1">
          <div className="flex items-baseline justify-between gap-4">
            <span
              className={`${RESPONSIVE_TEXT_SIZE} font-normal text-foreground tracking-[-0.02em]`}
            >
              이번달 소비
            </span>
            <span
              className={`${RESPONSIVE_TEXT_SIZE} font-semibold text-foreground tracking-[-0.03em]`}
            >
              {formatCurrency(expenseSummary?.monthlyExpense ?? 0)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span
              className={`${RESPONSIVE_TEXT_SIZE} font-normal text-foreground tracking-[-0.02em]`}
            >
              오늘 소비
            </span>
            <span
              className={`${RESPONSIVE_TEXT_SIZE} font-semibold text-foreground tracking-[-0.03em]`}
            >
              {formatCurrency(expenseSummary?.todayExpense ?? 0)}
            </span>
          </div>
        </section>

        <Card className="mt-5 border-none bg-muted shadow-none">
          <div className="relative">
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 h-6 w-6 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="검색"
              className="h-5 rounded-2xl border-none bg-muted pl-13 text-[16px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0 sm:text-[16px] md:text-[20px] lg:text-[24px]"
            />
          </div>
        </Card>

        <section className="mt-8 space-y-7">
          {isLoading ? (
            <Card className="rounded-3xl border-none bg-muted px-6 py-8 shadow-none">
              <p
                className={`${RESPONSIVE_TEXT_SIZE} text-center text-muted-foreground`}
              >
                불러오는 중이에요.
              </p>
            </Card>
          ) : loadError ? (
            <Card className="rounded-3xl border-none bg-muted px-6 py-8 shadow-none">
              <p
                className={`${RESPONSIVE_TEXT_SIZE} text-center text-muted-foreground`}
              >
                {loadError}
              </p>
            </Card>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <article key={group.id}>
                <h2
                  className={`${RESPONSIVE_TEXT_SIZE} font-semibold text-foreground tracking-[-0.03em]`}
                >
                  {group.dateLabel}
                </h2>
                <div className="mt-3">
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className="[&>div>div:first-child>div:last-child>span:first-child]:font-medium [&>div>div:first-child>div:last-child>span:first-child]:text-[20px] [&>div>div:first-child>div:last-child>span:first-child]:sm:text-[20px] [&>div>div:first-child>div:last-child>span:first-child]:md:text-[28px] [&>div>div:first-child>div:last-child>span:first-child]:lg:text-[34px] [&>div>div:first-child>div:last-child>span:last-child]:font-normal [&>div>div:first-child>div:last-child>span:last-child]:text-[20px] [&>div>div:first-child>div:last-child>span:last-child]:sm:text-[20px] [&>div>div:first-child>div:last-child>span:last-child]:md:text-[28px] [&>div>div:first-child>div:last-child>span:last-child]:lg:text-[34px] [&>div>div:last-child>span]:font-semibold [&>div>div:last-child>span]:text-[20px] [&>div>div:last-child>span]:sm:text-[20px] [&>div>div:last-child>span]:md:text-[28px] [&>div>div:last-child>span]:lg:text-[34px]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const originalItem = expenseSummary?.items.find(
                            (expense) => expense.id === item.id,
                          );

                          if (originalItem) {
                            setSelectedExpense(originalItem);
                          }
                        }}
                        className="w-full cursor-pointer text-left transition-all hover:brightness-95"
                      >
                        <ExpenseItem {...item} />
                      </button>
                      {itemIndex < group.items.length - 1 ? (
                        <Separator className="bg-border" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <Card className="rounded-3xl border-none bg-muted px-6 py-8 shadow-none">
              <p
                className={`${RESPONSIVE_TEXT_SIZE} text-center text-muted-foreground`}
              >
                검색 결과가 없습니다.
              </p>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />

      <Modal
        isOpen={selectedExpense !== null}
        onClose={() => {
          if (!isDeleting) {
            setSelectedExpense(null);
          }
        }}
        onCancel={() => setSelectedExpense(null)}
        onConfirm={() => {
          void handleDeleteExpense();
        }}
        buttonVariant="double"
        confirmText={isDeleting ? '삭제 중...' : '삭제'}
        cancelText="취소"
      >
        <div className="px-2 py-5 text-center">
          <h2 className="font-semibold text-[#1F2524] text-[22px]">
            삭제하시겠습니까?
          </h2>
          <p className="mt-3 text-[#687076] text-[17px] leading-[1.5]">
            선택한 지출 내역이 삭제됩니다.
          </p>
        </div>
      </Modal>
    </div>
  );
}
