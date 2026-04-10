import Link from 'next/link';
import { BottomNavigation } from '@/components/common/BottomNavigation';

const summaryCards = [
  { label: '오늘 지출', value: '58,000' },
  { label: '10월 총 지출', value: '1,800,000' },
  { label: '전월 대비', value: '+15%', accent: true },
];

const expenseItems = [
  { label: '식비', amount: '10,000 원', color: '#E5BD33' },
  { label: '의료비', amount: '10,000 원', color: '#65C9C5' },
  { label: '기타', amount: '10,000 원', color: '#DDDDDD' },
];

export default function FinancePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <main className="scrollbar-hide min-h-0 flex-1 overflow-y-auto p-5 md:px-7 lg:px-9">
        <section className="overflow-hidden rounded-[26px] border border-[var(--color-main-green)] bg-[#E5F9F8]">
          <div className="p-4 md:p-4.5 lg:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-[28px] text-[var(--color-main-green)] md:text-[32px] lg:text-[36px]">
                  됄멩이 통장
                </p>
                <p className="text-[20px] leading-none md:text-[24px] lg:text-[28px]">
                  1999-9022-0000-0000
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
                <span className="font-bold">1,250,000</span>
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
          <div className="mx-auto h-36 w-36 rounded-full bg-[conic-gradient(#E6B319_0deg_190deg,#3AC5BF_190deg_260deg,#B2B2B2_260deg_360deg)] md:h-40 md:w-40 lg:h-44 lg:w-44" />
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
                <span>{item.amount}</span>
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
