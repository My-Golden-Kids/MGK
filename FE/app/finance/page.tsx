import { ChevronRight } from 'lucide-react';
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
    <main className="flex min-h-dvh flex-1 flex-col text-[#27312D]">
      <div className="flex min-h-dvh w-full flex-1 flex-col px-4 pt-7 pb-28">
        <section className="overflow-hidden rounded-[26px] border border-[#7ACFC2] bg-[#EAF8F6]">
          <div className="px-4 pt-4 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl text-[#4CAFA3]">
                  돌멍이 통장
                </p>
                <p className="-mt-1 text-[#384543] text-lg">
                  1999-9022-0000-0000
                </p>
              </div>
              <Link
                href="/finance/expense"
                className="mt-1 inline-flex items-center gap-1 text-[#55B4A6] text-lg"
              >
                내역 보기
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-9 flex items-end justify-between">
              <span className="text-2xl text-[#4CAFA3]">잔액</span>
              <span className="text-4xl text-[#212B28] leading-none">
                1,250,000 원
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 border-[#7ACFC2] border-t">
            <button className="h-16 border-[#6CC7B8] border-r bg-[#62C4B1] text-2xl text-white">
              채우기
            </button>
            <button className="h-16 bg-[#62C4B1] text-2xl text-white">
              보내기
            </button>
          </div>
        </section>

        <section className="mt-3 grid grid-cols-3 gap-2.5">
          {summaryCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[16px] border border-[#7ACFC2] bg-white px-3 py-3 text-center"
            >
              <p className="text-[#4CAFA3] text-base">{card.label}</p>
              <p
                className={`mt-1 text-2xl leading-tight ${
                  card.accent ? 'text-[#FF6F5B]' : 'text-[#2A312F]'
                }`}
              >
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-3 rounded-[24px] border border-[#7ACFC2] bg-white px-4 py-5">
          <div className="mx-auto h-44 w-44 rounded-full bg-[conic-gradient(#E5BD33_0deg_190deg,#65C9C5_190deg_260deg,#D9D9D9_260deg_360deg)]" />
          <div className="mt-5 space-y-1">
            {expenseItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-3 text-[#3D4A45] text-lg">
                  <span
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>
                <span className="text-[#2C312F] text-xl">
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="px-2 py-5 text-center">
          <p className="text-2xl text-[#58B3A6]">
            펫 케어 구독하고 지출을 <span className="text-[#FF6F5B]">10%</span>{' '}
            낮춰요
          </p>
        </section>

        <Link
          href="/finance/reports"
          className="flex h-16 items-center justify-center rounded-[16px] bg-[#57B6A7] text-2xl text-white"
        >
          리포트 보러가기
        </Link>
      </div>

      <BottomNavigation />
    </main>
  );
}
