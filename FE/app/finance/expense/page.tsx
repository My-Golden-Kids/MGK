'use client';

import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import ExpenseItem, {
  type ExpenseItemProps,
} from '@/components/finance/ExpenseItem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type ExpenseGroup = {
  id: string;
  dateLabel: string;
  items: ExpenseItemProps[];
};

const RESPONSIVE_TEXT_SIZE =
  'text-[20px] sm:text-[20px] md:text-[28px] lg:text-[34px]';

const monthSummaries = [
  {
    month: '4월',
    monthlyExpense: 5_100_000,
    todayExpense: 5_050_000,
    groups: [
      {
        id: '2025-04-15',
        dateLabel: '15일 수요일',
        items: [
          {
            title: '성원동물병원',
            category: '의료비',
            amount: 5_000_000,
            type: 'medical',
          },
          {
            title: '그린마트',
            category: '식비',
            amount: 50_000,
            type: 'food',
          },
        ],
      },
      {
        id: '2025-04-04',
        dateLabel: '4일 수요일',
        items: [
          {
            title: '나이스투씨유 편의점입니다 테헤란로점',
            category: '기타',
            amount: 50_000,
            type: 'other',
          },
        ],
      },
    ] satisfies ExpenseGroup[],
  },
  {
    month: '3월',
    monthlyExpense: 1_870_000,
    todayExpense: 0,
    groups: [
      {
        id: '2025-03-28',
        dateLabel: '28일 금요일',
        items: [
          {
            title: '별빛동물메디컬센터',
            category: '의료비',
            amount: 1_200_000,
            type: 'medical',
          },
          {
            title: '펫푸드하우스',
            category: '식비',
            amount: 120_000,
            type: 'food',
          },
        ],
      },
      {
        id: '2025-03-10',
        dateLabel: '10일 월요일',
        items: [
          {
            title: '동네마트',
            category: '기타',
            amount: 550_000,
            type: 'other',
          },
        ],
      },
    ] satisfies ExpenseGroup[],
  },
];

function formatCurrency(value: number) {
  return `${value.toLocaleString()} 원`;
}

export default function FinanceExpensesPage() {
  const [monthIndex, setMonthIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const currentMonth = monthSummaries[monthIndex];
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) {
      return currentMonth.groups;
    }

    return currentMonth.groups
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
  }, [currentMonth.groups, normalizedQuery]);

  const moveMonth = (direction: -1 | 1) => {
    setMonthIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= monthSummaries.length) {
        return currentIndex;
      }

      return nextIndex;
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
              disabled={monthIndex === 0}
              aria-label="이전 달 보기"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1
              className={`${RESPONSIVE_TEXT_SIZE} font-semibold text-foreground tracking-[-0.03em]`}
            >
              {currentMonth.month}
            </h1>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="rounded-full bg-[var(--color-main-green)]/10 text-[var(--color-main-green)] hover:bg-[var(--color-main-green)]/15"
              onClick={() => moveMonth(1)}
              disabled={monthIndex === monthSummaries.length - 1}
              aria-label="다음 달 보기"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-[var(--color-main-green)] hover:bg-[var(--color-main-green)]/10 hover:text-[var(--color-main-green)]"
            aria-label="지출 추가"
          >
            <Plus className="h-8 w-8" />
          </Button>
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
              {formatCurrency(currentMonth.monthlyExpense)}
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
              {formatCurrency(currentMonth.todayExpense)}
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
          {filteredGroups.length > 0 ? (
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
