'use client';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import ExpenseItem, {
  type ExpenseItemProps,
  type ExpenseType,
} from '@/components/finance/ExpenseItem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { clientFetch } from '@/lib/auth';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ExpenseGroup = {
  id: string;
  dateLabel: string;
  items: ExpenseItemProps[];
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

function formatMonthLabel(date: Date) {
  return `${date.getMonth() + 1}월`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  return `${date.getDate()}일 ${DAY_LABELS[date.getDay()]}`;
}

export default function FinanceExpensesPage() {
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseSummary, setExpenseSummary] =
    useState<FinanceExpenseSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const currentMonth = useMemo(
    () => getMonthDate(today, monthOffset),
    [monthOffset, today],
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
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
        currentGroup.items.push(mappedItem);
        continue;
      }

      groupedMap.set(groupKey, {
        id: groupKey,
        dateLabel: formatDateLabel(item.spendDate),
        items: [mappedItem],
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
  }, [currentMonth]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) {
      return groupedExpenses;
    }

    return groupedExpenses
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const title = item.title.toLowerCase();
          const category = item.category.toLowerCase();
          return (
            title.includes(normalizedQuery) ||
            category.includes(normalizedQuery)
          );
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groupedExpenses, normalizedQuery]);

  const moveMonth = (direction: -1 | 1) => {
    setMonthOffset((currentOffset) => {
      if (direction === 1 && currentOffset >= 0) {
        return currentOffset;
      }

      return currentOffset + direction;
    });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white text-foreground">
      <main className="flex-1 px-6 pb-6">
        <div className="overflow-hidden">
          <BackButton />
        </div>

        <section className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="rounded-full bg-[var(--color-main-green)]/10 text-[var(--color-main-green)] hover:bg-[var(--color-main-green)]/15"
              onClick={() => moveMonth(-1)}
              aria-label="이전 달 보기"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1
              className={`${RESPONSIVE_TEXT_SIZE} font-semibold text-foreground tracking-[-0.03em]`}
            >
              {formatMonthLabel(currentMonth)}
            </h1>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="rounded-full bg-[var(--color-main-green)]/10 text-[var(--color-main-green)] hover:bg-[var(--color-main-green)]/15"
              onClick={() => moveMonth(1)}
              disabled={monthOffset >= 0}
              aria-label="다음 달 보기"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Link href="/finance/expense/add-expense" aria-label="지출 추가">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-[var(--color-main-green)] hover:bg-[var(--color-main-green)]/10 hover:text-[var(--color-main-green)]"
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
              className="h-12 rounded-2xl border-none bg-muted pl-13 text-[16px] text-foreground placeholder:text-muted-foreground focus-visible:ring-0 sm:text-[16px] md:text-[20px] lg:text-[24px]"
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
                      key={`${group.id}-${item.title}`}
                      className="[&>div>div:first-child>div:last-child>span:first-child]:font-medium [&>div>div:first-child>div:last-child>span:first-child]:text-[20px] [&>div>div:first-child>div:last-child>span:first-child]:sm:text-[20px] [&>div>div:first-child>div:last-child>span:first-child]:md:text-[28px] [&>div>div:first-child>div:last-child>span:first-child]:lg:text-[34px] [&>div>div:first-child>div:last-child>span:last-child]:font-normal [&>div>div:first-child>div:last-child>span:last-child]:text-[20px] [&>div>div:first-child>div:last-child>span:last-child]:sm:text-[20px] [&>div>div:first-child>div:last-child>span:last-child]:md:text-[28px] [&>div>div:first-child>div:last-child>span:last-child]:lg:text-[34px] [&>div>div:last-child>span]:font-semibold [&>div>div:last-child>span]:text-[20px] [&>div>div:last-child>span]:sm:text-[20px] [&>div>div:last-child>span]:md:text-[28px] [&>div>div:last-child>span]:lg:text-[34px]"
                    >
                      <ExpenseItem {...item} />
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
    </div>
  );
}
