'use client';

import { BottomNavigation } from '@/components/common/BottomNavigation';
import { clientFetch } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
      <main className="flex min-h-0 flex-1 flex-col justify-between px-8 py-9">
        <div className="flex flex-col gap-3.5">
          <section className="shrink-0 overflow-hidden rounded-[24px] border border-[var(--color-main-green)] bg-[#E5F9F8]">
            <div className="p-5.5 md:p-5.5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[28px] text-[var(--color-main-green)] leading-tight md:text-[32px] lg:text-[36px]">
                    {dashboard?.bankName
                      ? `${dashboard.bankName} 통장`
                      : '내 통장'}
                  </p>
                  <p className="mt-2 text-[18px] leading-none md:text-[20px] lg:text-[22px]">
                    {dashboard?.accountNumber ?? '-'}
                  </p>
                </div>
                <Link
                  href="/finance/expense"
                  className="mt-1 inline-flex shrink-0 cursor-pointer items-center font-bold text-[17px] text-[var(--color-main-green)] transition-all hover:brightness-70 md:mt-1.5 md:text-[20px] lg:text-[22px]"
                >
                  내역 보기
                </Link>
              </div>

              <div className="mt-7 flex items-end justify-between md:mt-7 lg:mt-8">
                <span className="font-bold text-[18px] text-[var(--color-main-green)] md:text-[20px] lg:text-[22px]">
                  잔액
                </span>
                <span className="text-[31px] leading-none md:text-[34px] lg:text-[38px]">
                  <span className="font-bold">
                    {formatCurrency(dashboard?.balance ?? 0)}
                  </span>
                  <span className="ml-1">원</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 border-[var(--color-main-green)] border-t">
              <button
                type="button"
                className="h-fit cursor-pointer border-[var(--color-main-green)] border-r bg-[var(--color-mint-green)] py-3.5 font-bold text-[20px] text-white transition-all hover:brightness-90 md:text-[22px] lg:text-[24px]"
              >
                채우기
              </button>
              <button
                type="button"
                className="h-fit cursor-pointer bg-[var(--color-mint-green)] py-3.5 font-bold text-[20px] text-white transition-all hover:brightness-90 md:text-[22px] lg:text-[24px]"
              >
                보내기
              </button>
            </div>
          </section>

          <section className="grid shrink-0 grid-cols-3 gap-2">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[18px] border border-[var(--color-main-green)] bg-white px-2.5 py-4 text-center md:px-3.5 md:py-4"
              >
                <p className="font-bold text-[16px] text-[var(--color-main-green)] leading-snug md:text-[18px] lg:text-[20px]">
                  {card.label}
                </p>
                <p
                  className={`mt-1.5 text-[17px] leading-tight md:text-[19px] lg:text-[21px] ${
                    card.accent ? 'text-[#DB1F26]' : 'text-black'
                  }`}
                >
                  {card.value}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-[24px] border border-[var(--color-main-green)] bg-white p-5">
            <div
              className="mx-auto h-[128px] w-[128px] rounded-full md:h-[140px] md:w-[140px] lg:h-[152px] lg:w-[152px]"
              style={{ background: chartBackground }}
            />
            <div className="mt-5 space-y-3 md:mt-5 md:space-y-3 lg:mt-4.5 lg:space-y-2">
              {expenseItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 text-[17px] md:text-[19px] lg:py-0 lg:text-[21px]"
                >
                  <div className="flex items-center gap-2.5 font-bold">
                    <span
                      className="h-[16px] w-[16px] rounded-full md:h-[18px] md:w-[18px] lg:h-[20px] lg:w-[20px]"
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
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 pt-3">
          <section className="px-2 text-center">
            <p className="font-bold text-[17px] text-[var(--color-main-green)] leading-snug md:text-[19px] lg:text-[21px]">
              펫 케어 구독하고 지출을{' '}
              <span className="font-extrabold text-[#DB1F26]">10%</span> 낮춰요
            </p>
          </section>

          <Link
            href="/finance/report"
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-[18px] bg-[var(--color-main-green)] px-4 py-4.5 font-bold text-[19px] text-white transition-all hover:brightness-90 md:text-[21px] lg:text-[23px]"
          >
            리포트 보러가기
          </Link>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
