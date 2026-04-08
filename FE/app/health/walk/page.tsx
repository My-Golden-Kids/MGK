'use client';

import { BottomNavigation } from '@/components/common/BottomNavigation';
import MoneyBadge from '@/components/health/walk/MoneyBadge';
import WalkSummaryPanel from '@/components/health/walk/WalkSummaryPanel';
import PetProfileImage from '@/components/home/pet/PetProfileImage';
import { Pause, Play, Square } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const overlayLabels = ['시작', '일시정지', '정지'] as const;
const overlayIcons = [Play, Pause, Square] as const;

export default function WalkPage() {
  const [overlayLabelIndex, setOverlayLabelIndex] = useState(0);
  const overlayLabel = overlayLabels[overlayLabelIndex];
  const OverlayIcon = overlayIcons[overlayLabelIndex];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <main className="relative flex-1 overflow-hidden">
        <section className="relative">
          <Image
            src="/images/health/health_bg.png"
            alt="산책 배경"
            width={1440}
            height={720}
            priority
            sizes="100vw"
            className="h-auto w-full object-cover"
          />
          <div className="absolute top-6 right-6 z-20">
            <MoneyBadge amount={0} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-[220px] w-[220px] items-center justify-center md:h-[280px] md:w-[280px] lg:h-[320px] lg:w-[320px]">
              <div className="absolute -top-15 left-1/2 w-[200px] -translate-x-1/2 md:-top-18 lg:-top-22 md:w-[230px] lg:w-[260px]">
                <Image
                  src="/images/health/byeols.png"
                  alt=""
                  width={264}
                  height={264}
                  className="h-auto w-full object-contain"
                />
              </div>
              <div
                className="relative z-10 h-[180px] w-[180px] cursor-pointer md:h-[240px] md:w-[240px] lg:h-[280px] lg:w-[280px]"
                onClick={() =>
                  setOverlayLabelIndex((prev) =>
                    (prev + 1) % overlayLabels.length,
                  )
                }
              >
                <PetProfileImage className="h-[180px] w-[180px] cursor-pointer md:h-[240px] md:w-[240px] lg:h-[280px] lg:w-[280px]" />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/60 text-center font-bold text-white text-[28px] sm:text-[28px] md:text-[34px] lg:text-[40px]">
                  <span className="flex items-center justify-center gap-[5px] sm:gap-[5px] md:gap-[10px] lg:gap-[12px]">
                    {Array.from(overlayLabel).map((character, index) => (
                      <span key={`${character}-${index}`}>{character}</span>
                    ))}
                  </span>
                  <OverlayIcon className="mt-3 h-12 w-12 fill-white stroke-white md:h-15 md:w-15 lg:h-18 lg:w-18" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="absolute right-0 bottom-0 left-0 z-30 h-[60%] overflow-hidden sm:h-[60%] md:h-[52%] lg:h-[40%]">
          <WalkSummaryPanel />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
