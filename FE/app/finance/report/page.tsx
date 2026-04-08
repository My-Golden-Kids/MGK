'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';

const monthlyData = [
  { label: '11월', valueLabel: '11월', heightClass: 'h-[84px]' },
  { label: '12월', valueLabel: '12월', heightClass: 'h-[44px]' },
  { label: '1월', valueLabel: '1월', heightClass: 'h-[122px]' },
  { label: '2월', valueLabel: '2월', heightClass: 'h-[95px]' },
  { label: '3월', valueLabel: '3월', heightClass: 'h-[84px]' },
  { label: '지금', valueLabel: '지금', heightClass: 'h-[156px]', active: true },
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
              className="absolute left-2 font-medium text-[18px] text-black md:text-[20px]"
            >
              뒤로
            </Link>

            <h1 className="font-bold text-[28px] text-black md:text-[32px] lg:text-[36px]">
              금융 리포트
            </h1>
          </section>

          <section className="mt-6 rounded-[20px] border border-[#BEBEBE] bg-white px-4 py-5 md:px-5 md:py-6">
            <h2 className="font-bold text-[22px] text-black leading-[1.28] md:text-[26px] lg:text-[30px]">
              반려동물을 위해
              <br />
              노후자금의 <span className="text-[#F00773]">10%</span>를 사용할
              것으로 예상돼요
            </h2>

            <div className="mt-5 h-[36px] w-full rounded-full bg-[#E9E9E9]">
              <div className="h-full w-[16%] rounded-full bg-[#4FAE99]" />
            </div>

            <p className="mt-4 font-medium text-[16px] text-black leading-[1.45] md:text-[18px]">
              앞으로 약 <span className="font-bold">1,000만원</span>이 더
              필요해요
            </p>
            <p className="mt-1 text-[#555555] text-[12px] leading-[1.35] md:text-[13px]">
              (월평균 반려동물 지출 기준 예상금액) / 전체 자산 × 100
            </p>
          </section>

          <section className="mt-4 rounded-[20px] border border-[#BEBEBE] bg-white px-4 py-5 md:px-5 md:py-6">
            <h2 className="font-bold text-[22px] text-black leading-[1.28] md:text-[26px] lg:text-[30px]">
              최근 한 달 평균
              <br />
              <span className="text-[#F00773]">100만원</span> 정도 사용하고
              있어요
            </h2>

            <div className="mt-8 flex items-end justify-between gap-3 md:gap-4">
              {monthlyData.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-1 flex-col items-center"
                >
                  <div
                    className={`w-full max-w-[58px] ${item.heightClass} ${
                      item.active ? 'bg-[#4FAE99]' : 'bg-[#E7E7E7]'
                    }`}
                  />
                  <span className="mt-4 whitespace-nowrap font-bold text-[15px] text-black md:text-[17px]">
                    {item.valueLabel}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3 md:gap-4">
            <article className="rounded-[20px] border border-[#BEBEBE] bg-white px-4 py-4">
              <h3 className="font-bold text-[18px] text-black leading-[1.25] md:text-[22px]">
                의료비 지출 <span className="text-[#F00773]">15%</span>
                <br />
                미리 대비해요
              </h3>

              <div className="mt-6 flex justify-center">
                <div className="relative h-[138px] w-[138px] rounded-full bg-[#E9E9E9]">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'conic-gradient(#63C2C1 0deg 68deg, transparent 68deg 360deg)',
                      maskImage:
                        'radial-gradient(circle, transparent 0 50px, black 51px)',
                      WebkitMaskImage:
                        'radial-gradient(circle, transparent 0 50px, black 51px)',
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="mt-7 w-full text-center font-medium text-[18px] text-black md:text-[20px]"
              >
                펫보험 알아보기 &gt;
              </button>
            </article>

            <article className="rounded-[20px] border border-[#BEBEBE] bg-white px-4 py-4">
              <h3 className="font-bold text-[18px] text-black leading-[1.25] md:text-[22px]">
                산책 상위 <span className="text-[#F00773]">10%</span>
              </h3>

              <div className="mt-8 flex justify-center">
                <div className="relative h-[170px] w-[150px]">
                  <div className="-translate-x-1/2 absolute top-[22px] left-1/2 h-0 w-[130px] border-[#7CD8D4] border-t-2 border-dotted" />
                  <div className="-translate-x-1/2 absolute bottom-0 left-1/2 h-0 w-0 border-r-[64px] border-r-transparent border-b-[#4FAE99] border-b-[124px] border-l-[64px] border-l-transparent" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(true)}
                className="mt-7 w-full text-center font-medium text-[18px] text-black md:text-[20px]"
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
                산책 상위 <span className="text-[#F00773]">10%</span>
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
