'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { clientFetch } from '@/lib/client-fetch';

type FinanceDashboardResponse = {
  bankName: string;
  accountNumber: string;
  balance: number;
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

type ExpenseChartItem = {
  label: string;
  amount: number;
  color: string;
};

const CATEGORY_CONFIG: Record<
  FinanceExpenseItem['category'],
  ExpenseChartItem
> = {
  Food: { label: '식비', amount: 0, color: '#E5BD33' },
  Hospital: { label: '의료비', amount: 0, color: '#65C9C5' },
  Etc: { label: '기타', amount: 0, color: '#DDDDDD' },
};

function formatCurrency(value: number) {
  return value.toLocaleString();
}

function buildExpenseChartItems(
  summary: FinanceExpenseSummaryResponse | null,
): ExpenseChartItem[] {
  const totals = {
    Food: 0,
    Hospital: 0,
    Etc: 0,
  } satisfies Record<FinanceExpenseItem['category'], number>;

  for (const item of summary?.items ?? []) {
    totals[item.category] += item.amount;
  }

  return Object.entries(CATEGORY_CONFIG).map(([category, config]) => ({
    ...config,
    amount: totals[category as FinanceExpenseItem['category']],
  }));
}

function buildChartBackground(items: ExpenseChartItem[]) {
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  if (totalAmount <= 0) {
    return 'conic-gradient(#DDDDDD 0deg 360deg)';
  }

  let currentDegree = 0;
  const segments = items.map((item) => {
    const angle = (item.amount / totalAmount) * 360;
    const startDegree = currentDegree;
    const endDegree = currentDegree + angle;
    currentDegree = endDegree;

    return `${item.color} ${startDegree}deg ${endDegree}deg`;
  });

  return `conic-gradient(${segments.join(',')})`;
}

function getMonthDate(baseDate: Date, offset: number) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
}

export default function FinancePage() {
  const today = useMemo(() => new Date(), []);
  const [dashboard, setDashboard] = useState<FinanceDashboardResponse | null>(
    null,
  );
  const [currentSummary, setCurrentSummary] =
    useState<FinanceExpenseSummaryResponse | null>(null);
  const [previousSummary, setPreviousSummary] =
    useState<FinanceExpenseSummaryResponse | null>(null);

  useEffect(() => {
    const fetchFinancePageData = async () => {
      const currentMonth = getMonthDate(today, 0);
      const previousMonth = getMonthDate(today, -1);

      try {
        const [
          dashboardResponse,
          currentSummaryResponse,
          previousSummaryResponse,
        ] = await Promise.all([
          clientFetch('/api/account-books/dashboard'),
          clientFetch(
            `/api/account-books?year=${currentMonth.getFullYear()}&month=${
              currentMonth.getMonth() + 1
            }`,
          ),
          clientFetch(
            `/api/account-books?year=${previousMonth.getFullYear()}&month=${
              previousMonth.getMonth() + 1
            }`,
          ),
        ]);

        if (dashboardResponse.ok) {
          const dashboardData =
            (await dashboardResponse.json()) as FinanceDashboardResponse;
          setDashboard(dashboardData);
        } else {
          setDashboard(null);
        }

        if (currentSummaryResponse.ok) {
          const currentSummaryData =
            (await currentSummaryResponse.json()) as FinanceExpenseSummaryResponse;
          setCurrentSummary(currentSummaryData);
        } else {
          setCurrentSummary(null);
        }

        if (previousSummaryResponse.ok) {
          const previousSummaryData =
            (await previousSummaryResponse.json()) as FinanceExpenseSummaryResponse;
          setPreviousSummary(previousSummaryData);
        } else {
          setPreviousSummary(null);
        }
      } catch {
        setDashboard(null);
        setCurrentSummary(null);
        setPreviousSummary(null);
      }
    };

    void fetchFinancePageData();
  }, [today]);

  const expenseItems = useMemo(
    () => buildExpenseChartItems(currentSummary),
    [currentSummary],
  );
  const chartBackground = useMemo(
    () => buildChartBackground(expenseItems),
    [expenseItems],
  );
  const previousMonthlyExpense = previousSummary?.monthlyExpense ?? 0;
  const currentMonthlyExpense = currentSummary?.monthlyExpense ?? 0;
  const monthlyDiffValue = currentMonthlyExpense - previousMonthlyExpense;
  const monthlyDiffRate =
    previousMonthlyExpense > 0
      ? ((monthlyDiffValue / previousMonthlyExpense) * 100).toFixed(0)
      : '0';
  const summaryCards = [
    {
      label: '오늘 지출',
      value: `${formatCurrency(currentSummary?.todayExpense ?? 0)}원`,
    },
    {
      label: `${today.getMonth() + 1}월 총 지출`,
      value: `${formatCurrency(currentMonthlyExpense)}원`,
    },
    {
      label: '전월 대비',
      value: `${monthlyDiffValue >= 0 ? '+' : ''}${monthlyDiffRate}%`,
      accent: monthlyDiffValue > 0,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto p-5 md:px-7 lg:px-9">
        <section className="overflow-hidden rounded-[26px] border border-[var(--color-main-green)] bg-[#E5F9F8]">
          <div className="p-4 md:p-4.5 lg:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-[28px] text-[var(--color-main-green)] md:text-[32px] lg:text-[36px]">
                  {dashboard?.bankName
                    ? `${dashboard.bankName} 통장`
                    : '내 통장'}
                </p>
                <p className="text-[20px] leading-none md:text-[24px] lg:text-[28px]">
                  {dashboard?.accountNumber ?? '-'}
                </p>
              </div>
              <Link
                href="/finance/expense"
                className="mt-2 inline-flex items-center font-bold text-[18px] text-[var(--color-main-green)] md:mt-2.5 md:text-[24px] lg:mt-3 lg:text-[28px]"
              >
                내역 보기
              </Link>
            </div>

            <div className="mt-8 flex items-end justify-between md:mt-9 lg:mt-10">
              <span className="font-bold text-[18px] text-[var(--color-main-green)] md:text-[22px] lg:text-[26px]">
                잔액
              </span>
              <span className="text-[28px] leading-none md:text-[32px] lg:text-[36px]">
                <span className="font-bold">
                  {formatCurrency(dashboard?.balance ?? 0)}
                </span>
                <span className="ml-1.5 md:ml-2 lg:ml-2.5">원</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 border-[var(--color-main-green)] border-t">
            <button
              type="button"
              className="h-fit border-[var(--color-main-green)] border-r bg-[var(--color-mint-green)] py-2 font-bold text-[22px] text-white md:py-2.5 md:text-[26px] lg:py-3 lg:text-[30px]"
            >
              채우기
            </button>
            <button
              type="button"
              className="h-fit bg-[var(--color-mint-green)] py-2 font-bold text-[22px] text-white md:py-2.5 md:text-[26px] lg:py-3 lg:text-[30px]"
            >
              보내기
            </button>
          </div>
        </section>

        <section className="mt-2 grid grid-cols-3 gap-2 md:mt-2.5 md:gap-2.5 lg:mt-3 lg:gap-3">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[18px] border border-[var(--color-main-green)] bg-white py-3 text-center md:py-3.5 lg:py-4"
            >
              <p className="font-bold text-[18px] text-[var(--color-main-green)] md:text-[22px] lg:text-[26px]">
                {card.label}
              </p>
              <p
                className={`text-[20px] md:text-[24px] lg:text-[28px] ${
                  card.accent ? 'text-[#DB1F26]' : 'text-black'
                }`}
              >
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-2 rounded-[26px] border border-[var(--color-main-green)] bg-white px-10 py-3 md:mt-2.5 md:px-14 md:py-4 lg:mt-3 lg:px-18 lg:py-5">
          <div
            className="mx-auto h-36 w-36 rounded-full md:h-40 md:w-40 lg:h-44 lg:w-44"
            style={{ background: chartBackground }}
          />
          <div className="mt-5 md:mt-6 lg:mt-7">
            {expenseItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-1.5 text-[20px] md:text-[24px] lg:text-[28px]"
              >
                <div className="flex items-center gap-3 font-bold">
                  <span
                    className="h-5 w-5 rounded-full md:h-6 md:w-6 lg:h-7 lg:w-7"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>
                <span>{formatCurrency(item.amount)} 원</span>
              </div>
            ))}
          </div>
        </section>

        <section className="m-3 text-center md:m-3.5 lg:m-4">
          <p className="font-bold text-[18px] text-[var(--color-main-green)] md:text-[22px] lg:text-[26px]">
            펫 케어 구독하고 지출을{' '}
            <span className="font-extrabold text-[#DB1F26]">10%</span> 낮춰요
          </p>
        </section>

        <Link
          href="/finance/report"
          className="flex h-fit items-center justify-center rounded-[20px] bg-[var(--color-main-green)] p-3 font-bold text-[18px] text-white md:p-3.5 md:text-[22px] lg:p-4 lg:text-[26px]"
        >
          리포트 보러가기
        </Link>
      </main>

      <BottomNavigation />
    </div>
  );
}
