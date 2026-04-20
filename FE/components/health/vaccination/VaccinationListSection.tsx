'use client';

import { ChevronUp } from 'lucide-react';
import { useState } from 'react';
import PetProfileImage from '@/components/home/pet/PetProfileImage';
import VaccinationItem from './VaccinationItem';

type VaccinationHistoryItem = {
  date: string;
  completed?: boolean;
};

type VaccinationCardItem = {
  id: number | string;
  title: string;
  totalCount: number;
  lastDate: string;
  nextDate: string;
  history: VaccinationHistoryItem[];
};

type VaccinationListSectionProps = {
  petName: string;
  petImageUrl?: string;
  latestScheduleLabel: string;
  vaccinationItems?: VaccinationCardItem[];
  defaultOpen?: boolean;
};

export default function VaccinationListSection({
  petName,
  petImageUrl,
  latestScheduleLabel,
  vaccinationItems = [],
  defaultOpen = false,
}: VaccinationListSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const hasItems = vaccinationItems.length > 0;

  return (
    <section className="w-full overflow-hidden rounded-[18px] border-1 border-[#018D70] bg-white md:rounded-[22px] lg:rounded-[26px]">
      <div className="flex items-center gap-4 px-4 py-4 md:px-5 md:py-5 lg:px-6 lg:py-6">
        <PetProfileImage
          imageUrl={petImageUrl}
          className="h-[88px] w-[88px] border-[#018D70] md:h-[100px] md:w-[100px] lg:h-[112px] lg:w-[112px]"
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-extrabold text-[22px] text-black md:text-[26px] lg:text-[30px]">
            {petName}
          </h3>

          <p className="font-bold text-[18px] text-black md:text-[22px] lg:text-[26px]">
            최신 일정
          </p>

          <p className="text-[18px] text-black leading-none md:text-[22px] lg:text-[26px]">
            {latestScheduleLabel}
          </p>
        </div>

        {isOpen && (
          <button
            aria-label="접종기록 접기"
            type="button"
            onClick={() => setIsOpen(false)}
            className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full active:bg-black/10 md:h-12 md:w-12 lg:h-14 lg:w-14"
          >
            <ChevronUp className="h-6 w-6 text-main-green md:h-7 md:w-7 lg:h-8 lg:w-8" />
          </button>
        )}
      </div>

      {isOpen && hasItems && (
        <div className="border-[#029B78] border-t bg-[#A7E9E1] px-3 py-3 md:px-4 md:py-4 lg:px-5 lg:py-5">
          <div className="flex flex-col gap-3 md:gap-4 lg:gap-5">
            {vaccinationItems.map((item) => (
              <VaccinationItem
                key={item.id}
                title={item.title}
                totalCount={item.totalCount}
                lastDate={item.lastDate}
                nextDate={item.nextDate}
                history={item.history}
              />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => hasItems && setIsOpen((prev) => !prev)}
        disabled={!hasItems}
        className="flex w-full items-center justify-center border-[#018D70] border-t bg-[#25C8A8] py-2 text-[18px] text-white leading-none disabled:cursor-default disabled:opacity-40 md:py-2.5 md:text-[22px] lg:py-3 lg:text-[26px]"
      >
        {isOpen ? '접종기록 접기' : '접종기록 전체보기'}
      </button>
    </section>
  );
}
