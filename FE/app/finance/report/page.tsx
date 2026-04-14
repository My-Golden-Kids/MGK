'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';
import {
  getFinanceRetirementReport,
  getMonthlyExpenseChart,
} from '@/features/finance/api/financeReportApi';
import type {
  FinanceRetirementReport,
  MonthlyExpenseItem,
} from '@/features/finance/types/financeReport';
import { formatMoney, formatPercent } from '@/lib/utils/formatNumber';

function createEmptyMonthlyData(): MonthlyExpenseItem[] {
  const now = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);

    return {
      month: `${date.getMonth() + 1}월`,
      amount: 0,
    };
  });
}

export default function FinanceReportPage() {
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [report, setReport] = useState<FinanceRetirementReport | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [reportResponse, chartResponse] = await Promise.all([
        getFinanceRetirementReport(),
        getMonthlyExpenseChart(),
      ]);

      setReport(reportResponse);
      setMonthlyData(chartResponse.monthlyExpenses ?? []);
      setIsLoading(false);
    };

    void fetchData();
  }, []);

  const totalPetCost = report?.totalPetCost ?? 0;
  const retirementPercent = report?.retirementPercent ?? 0;
  const averageExpense = report?.averageExpense ?? 0;
  const recommendedProduct = report?.recommendedProduct;

  const safeMonthlyData =
    monthlyData.length > 0 ? monthlyData : createEmptyMonthlyData();

  const maxAmount = useMemo(() => {
    return Math.max(...safeMonthlyData.map((item) => item.amount ?? 0), 0);
  }, [safeMonthlyData]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
        <div className="relative mx-auto w-full overflow-hidden px-8 py-6">
          <section className="relative flex justify-center">
            <Link
              href="/finance"
              className="absolute left-0 text-[20px] md:text-[24px] lg:text-[28px]"
            >
              뒤로
            </Link>

            <h1 className="font-bold text-[28px] md:text-[32px] lg:text-[36px]">
              금융 리포트
            </h1>
          </section>

          <section className="mt-3 rounded-[12px] border border-[#C4C4C4] bg-white p-3 md:mt-3.5 md:rounded-[16px] md:p-4 lg:mt-4 lg:rounded-[20px] lg:p-5">
            <h2 className="font-bold text-[20px] leading-[1.27] md:text-[24px] lg:text-[28px]">
              반려동물을 위해
              <br />
              노후자금의{' '}
              <span className="font-extrabold text-[var(--color-hana-pink)]">
                {formatPercent(retirementPercent)}
              </span>
              를 사용할 것으로 예상돼요
            </h2>

            <div className="mt-4 h-[28px] w-full rounded-full bg-[#EDEDED] md:mt-4.5 md:h-[32px] lg:mt-5 lg:h-[36px]">
              <div
                className="h-full rounded-full bg-[var(--color-main-green)]"
                style={{
                  width: `${Math.min(Math.max(retirementPercent, 0), 100)}%`,
                }}
              />
            </div>

            <p className="mt-3 text-[18px] text-black md:mt-3.5 md:text-[22px] lg:mt-4 lg:text-[26px]">
              앞으로{' '}
              <span className="font-bold">약 {formatMoney(totalPetCost)}</span>
              이 더 필요해요
            </p>
            <p className="font-light text-[10px] leading-[1.2] md:text-[14px] lg:text-[18px]">
              ※ 월 평균 지출을 기준으로 계산된 예상 비율입니다.
            </p>
          </section>

          <section className="mt-3 rounded-[12px] border border-[#C4C4C4] bg-white p-3 md:mt-3.5 md:rounded-[16px] md:p-4 lg:mt-4 lg:rounded-[20px] lg:p-5">
            <h2 className="font-bold text-[22px] text-black leading-[1.27] md:text-[26px] lg:text-[30px]">
              최근 한 달 평균
              <br />
              <span className="text-[var(--color-hana-pink)]">
                {formatMoney(averageExpense)}
              </span>{' '}
              정도 사용하고 있어요
            </h2>

            <div className="mt-6 flex items-end justify-between gap-2 md:mt-8 md:gap-2.5 lg:mt-10 lg:gap-3">
              {safeMonthlyData.map((item, index) => {
                const amount = item.amount ?? 0;
                const height =
                  maxAmount > 0 ? Math.max((amount / maxAmount) * 156, 10) : 5;
                const isActive = index === safeMonthlyData.length - 1;

                return (
                  <div
                    key={`${item.month}-${index}`}
                    className="flex flex-1 flex-col items-center"
                  >
                    <div
                      className={`w-full ${
                        isActive
                          ? 'bg-[var(--color-main-green)]'
                          : 'bg-[#EDEDED]'
                      }`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="mt-2 whitespace-nowrap font-bold text-[12px] text-black md:mt-2.5 md:text-[15px] lg:mt-3 lg:text-[18px]">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-3 grid grid-cols-2 gap-3 md:mt-3.5 md:gap-3.5 lg:mt-4 lg:gap-4">
            {recommendedProduct && (
              <article className="mt-3 rounded-[12px] border border-[#C4C4C4] bg-white p-3">
                <h2 className="font-bold text-[20px]">
                  지금 가장 잘 맞는 상품은
                  <br />
                  <span className="text-[var(--color-hana-pink)]">
                    {recommendedProduct.productName}
                  </span>
                  이에요
                </h2>

                <p className="mt-3 whitespace-pre-line text-[#555] text-[14px]">
                  {recommendedProduct.personalizedReport}
                </p>

                <Link
                  href={`/product/${recommendedProduct.productId}`}
                  className="mt-5 block text-[18px]"
                >
                  상품 보러가기 &gt;
                </Link>
              </article>
            )}

            <article className="flex h-[270px] flex-col rounded-[12px] border border-[#C4C4C4] bg-white p-3 md:h-[310px] md:rounded-[16px] md:p-4 lg:h-[350px] lg:rounded-[20px] lg:p-5">
              <h3 className="font-bold text-[20px] leading-[1.25] md:text-[24px] lg:text-[28px]">
                산책 상위{' '}
                <span className="text-[var(--color-hana-pink)]">10%</span>
              </h3>

              <div className="mt-1 flex flex-1 items-center justify-center md:mt-4 lg:mt-5">
                <svg
                  viewBox="0 0 220 220"
                  className="h-[150px] w-[130px] md:h-[170px] md:w-[150px] lg:h-[190px] lg:w-[170px]"
                  aria-hidden="true"
                >
                  <line
                    x1="15"
                    y1="80"
                    x2="205"
                    y2="80"
                    stroke="var(--color-pastel-blue)"
                    strokeWidth="2.5"
                    strokeDasharray="4 5"
                  />

                  <polygon
                    points="110,40 20,190 200,190"
                    fill="var(--color-main-green)"
                  />

                  <polygon
                    points="110,40 86,80 134,80"
                    fill="var(--color-mint-green)"
                  />
                </svg>
              </div>

              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(true)}
                className="mt-5 block w-full text-center text-[18px] md:mt-6 md:text-[22px] lg:mt-7 lg:text-[26px]"
              >
                뱃지 받기 &gt;
              </button>
            </article>
          </section>

          <Modal
            isOpen={isBadgeModalOpen}
            onClose={() => setIsBadgeModalOpen(false)}
            closeOnOverlay
            buttonVariant="none"
          >
            <div className="py-4 md:py-6 lg:py-8">
              <h2 className="text-center font-extrabold text-[32px] leading-none md:text-[36px] lg:text-[40px]">
                산책 상위{' '}
                <span className="text-[var(--color-hana-pink)]">10%</span>
              </h2>

              <p className="mt-4 text-center font-bold text-[22px] md:mt-5 md:text-[26px] lg:mt-6 lg:text-[30px]">
                우리동네 산책
                <span className="text-[var(--color-main-green)]">영웅</span>
              </p>

              <div className="relative mt-6 flex justify-center md:mt-7 lg:mt-8">
                <div className="relative h-[360px] w-[280px] md:h-[390px] md:w-[300px] lg:h-[420px] lg:w-[320px]">
                  <svg
                    viewBox="0 0 260 260"
                    className="-translate-x-1/2 absolute bottom-[10px] left-1/2 z-0 h-[320px] w-[320px] md:h-[350px] md:w-[350px] lg:h-[380px] lg:w-[380px]"
                    aria-hidden="true"
                  >
                    <line
                      x1="5"
                      y1="50"
                      x2="255"
                      y2="50"
                      stroke="var(--color-pastel-blue)"
                      strokeWidth="2.5"
                      strokeDasharray="4 5"
                    />

                    <polygon
                      points="130,10 10,250 250,250"
                      fill="var(--color-main-green)"
                    />

                    <polygon
                      points="130,10 110,50 150,50"
                      fill="var(--color-mint-green)"
                    />
                  </svg>

                  <img
                    src="/images/finance/img_walk_badge.png"
                    alt="산책 영웅 안내 이미지"
                    className="absolute bottom-[22px] left-[6px] z-10 w-[150px] object-contain md:bottom-[24px] md:w-[162px] lg:bottom-[26px] lg:w-[174px]"
                  />
                </div>
              </div>

              <p className="mt-3 text-center font-bold text-[22px] md:mt-4 md:text-[26px] lg:mt-5 lg:text-[30px]">
                당신의 성취를 공유해보세요!
              </p>

              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(false)}
                className="mx-auto mt-5 flex items-center justify-center rounded-[12px] bg-[var(--color-main-green)] px-16 py-2 font-bold text-[18px] text-white md:mt-6 md:px-18 md:py-2.5 md:text-[22px] lg:mt-7 lg:px-20 lg:py-3 lg:text-[26px]"
              >
                공유하기
              </button>
            </div>
          </Modal>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
}
