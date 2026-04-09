'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';

const monthlyData = [
  { label: '5월', valueLabel: '5월', heightClass: 'h-[84px]' },
  { label: '6월', valueLabel: '6월', heightClass: 'h-[44px]' },
  { label: '7월', valueLabel: '7월', heightClass: 'h-[122px]' },
  { label: '8월', valueLabel: '8월', heightClass: 'h-[95px]' },
  { label: '9월', valueLabel: '9월', heightClass: 'h-[84px]' },
  { label: '10월', valueLabel: '10월', heightClass: 'h-[156px]' },
  { label: '11월', valueLabel: '11월', heightClass: 'h-[84px]' },
  { label: '12월', valueLabel: '12월', heightClass: 'h-[44px]' },
  { label: '1월', valueLabel: '1월', heightClass: 'h-[122px]' },
  { label: '2월', valueLabel: '2월', heightClass: 'h-[95px]' },
  { label: '3월', valueLabel: '3월', heightClass: 'h-[84px]' },
  { label: '지금', valueLabel: '4월', heightClass: 'h-[156px]', active: true },
];

export default function FinanceReportPage() {
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  return (
    <div className="min-h-dvh">
      <main>
        <div className="relative mx-auto w-full overflow-hidden px-5 py-5 md:px-6 lg:px-7">
          <section className="relative flex items-center justify-center">
            <Link
              href="/finance"
              className="absolute left-2 text-[20px] md:text-[24px] lg:text-[28px]"
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
                5%
              </span>
              를 사용할 것으로 예상돼요
            </h2>

            <div className="mt-4 h-[28px] w-full rounded-full bg-[#EDEDED] md:mt-4.5 md:h-[32px] lg:mt-5 lg:h-[36px]">
              <div className="h-full w-[10%] rounded-full bg-[var(--color-main-green)]" />
            </div>

            <p className="mt-3 text-[18px] text-black md:mt-3.5 md:text-[22px] lg:mt-4 lg:text-[26px]">
              앞으로 <span className="font-bold">약 1,000만원</span>이 더
              필요해요
            </p>
            <p className="font-light text-[10px] leading-[1.2] md:text-[14px] lg:text-[18px]">
              ※ 월 평균 지출을 기준으로 계산된 예상 비율입니다.
            </p>
          </section>

          <section className="mt-3 rounded-[12px] border border-[#C4C4C4] bg-white p-3 md:mt-3.5 md:rounded-[16px] md:p-4 lg:mt-4 lg:rounded-[20px] lg:p-5">
            <h2 className="font-bold text-[22px] text-black leading-[1.27] md:text-[26px] lg:text-[30px]">
              최근 한 달 평균
              <br />
              <span className="text-[var(--color-hana-pink)]">35만원</span> 정도
              사용하고 있어요
            </h2>

            <div className="mt-5 flex items-end justify-between gap-2 md:mt-6 md:gap-2.5 lg:mt-7 lg:gap-3">
              {monthlyData.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-1 flex-col items-center"
                >
                  <div
                    className={`w-full ${item.heightClass} ${
                      item.active
                        ? 'bg-[var(--color-main-green)]'
                        : 'bg-[#EDEDED]'
                    }`}
                  />
                  <span className="mt-2 whitespace-nowrap font-bold text-[12px] text-black md:mt-2.5 md:text-[15px] lg:mt-3 lg:text-[18px]">
                    {item.valueLabel}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-3 grid grid-cols-2 gap-3 md:mt-3.5 md:gap-4 lg:mt-4">
            <article className="rounded-[12px] border border-[#C4C4C4] bg-white p-3 md:rounded-[16px] md:p-4 lg:rounded-[20px] lg:p-5">
              <h3 className="font-bold text-[20px] leading-[1.25] md:text-[24px] lg:text-[28px]">
                의료비 지출{' '}
                <span className="text-[var(--color-hana-pink)]">25%</span>
                <br />
                미리 대비해요
              </h3>

              <div className="mt-5 flex justify-center md:mt-6 lg:mt-7">
                <div className="relative h-[110px] w-[110px] rounded-full bg-[#EDEDED] bg-[conic-gradient(#4BC0BE_0deg_90deg,#EDEDED_90deg_360deg)] md:h-[130px] md:w-[130px] lg:h-[150px] lg:w-[150px]" />
              </div>

              <Link
                href="/product/1"
                className="mt-5 block w-full text-center text-[18px] md:mt-6 md:text-[22px] lg:mt-7 lg:text-[26px]"
              >
                펫보험 알아보기 &gt;
              </Link>
            </article>

            <article className="flex flex-col rounded-[12px] border border-[#C4C4C4] bg-white p-3 md:rounded-[16px] md:p-4 lg:rounded-[20px] lg:p-5">
              <h3 className="font-bold text-[20px] md:text-[24px] lg:text-[28px]">
                산책 상위{' '}
                <span className="text-[var(--color-hana-pink)]">10%</span>
              </h3>

              <div className="mt-6 flex flex-1 items-center justify-center md:mt-7 lg:mt-8">
                <div className="relative h-[180px] w-[150px] md:h-[210px] md:w-[170px] lg:h-[240px] lg:w-[190px]">
                  <div className="-translate-x-1/2 absolute top-[18px] left-1/2 h-0 w-[120px] border-[#7CD8D4] border-t-2 border-dotted md:top-[20px] md:w-[136px] lg:top-[22px] lg:w-[150px]" />

                  <div className="-translate-x-1/2 absolute bottom-0 left-1/2 h-0 w-0 border-r-[60px] border-r-transparent border-b-[#4FAE99] border-b-[110px] border-l-[60px] border-l-transparent md:border-r-[70px] md:border-b-[130px] md:border-l-[70px] lg:border-r-[80px] lg:border-b-[150px] lg:border-l-[80px]" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(true)}
                className="mt-5 w-full text-center text-[18px] md:mt-6 md:text-[22px] lg:mt-7 lg:text-[26px]"
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
            <div className="px-1 pt-2">
              <h2 className="text-center font-bold text-[28px] text-black leading-none md:text-[32px]">
                산책 상위{' '}
                <span className="text-[var(--color-hana-pink)]">10%</span>
              </h2>

              <p className="mt-8 text-center font-bold text-[20px] text-black md:text-[24px]">
                우리동네 산책<span className="text-[#4FAE99]">영웅</span>
              </p>

              <div className="relative mt-8 flex justify-center">
                <div className="absolute top-[40px] h-0 w-[230px] border-[#7CD8D4] border-t-2 border-dotted md:w-[260px]" />

                <div className="relative h-[270px] w-[230px] md:h-[300px] md:w-[260px]">
                  <div className="-translate-x-1/2 absolute bottom-0 left-1/2 h-0 w-0 border-r-[100px] border-r-transparent border-b-[#4FAE99] border-b-[185px] border-l-[100px] border-l-transparent md:border-r-[112px] md:border-b-[215px] md:border-l-[112px]" />

                  <img
                    src="/images/finance/img_walk_badge.png"
                    alt="산책 영웅 안내 이미지"
                    className="absolute bottom-0 left-[4px] w-[118px] object-contain md:w-[132px]"
                  />
                </div>
              </div>

              <p className="mt-5 text-center font-bold text-[18px] text-black md:text-[22px]">
                당신의 성취를 공유해보세요!
              </p>

              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(false)}
                className="mx-auto mt-8 flex h-[58px] w-[180px] items-center justify-center rounded-[12px] bg-[#63D0BE] font-bold text-[18px] text-white md:h-[64px] md:w-[200px] md:text-[20px]"
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
