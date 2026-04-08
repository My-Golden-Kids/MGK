'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const walkHistory = [
  {
    date: '2026/04/02 (목요일)',
    duration: '00시간 12분 45초',
    kcal: '124kcal',
    distance: '0.8km',
    point: '300',
  },
  {
    date: '2026/04/01 (수요일)',
    duration: '00시간 10분 18초',
    kcal: '101kcal',
    distance: '0.7km',
    point: '250',
  },
  {
    date: '2026/03/31 (화요일)',
    duration: '00시간 15분 02초',
    kcal: '136kcal',
    distance: '1.0km',
    point: '340',
  },
];

export default function WalkSummaryPanel() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="relative h-full overflow-y-auto overflow-x-hidden rounded-t-[32px] bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="bg-white">
        {walkHistory.map((record, index) => {
          const isOpen = openIndex === index;

          return (
            <div key={record.date} className="border-b border-[#D9D9D9]">
              <button
                type="button"
                onClick={() => handleToggle(index)}
                className={`flex w-full cursor-pointer items-center justify-between px-8 py-5 text-left transition-colors ${
                  isOpen ? 'bg-[#A8DCDC]' : 'bg-white hover:bg-[#F4F7F7]'
                }`}
              >
                <span className="text-[18px] text-black md:text-[20px] lg:text-[24px]">
                  {record.date}
                </span>
                <ChevronDown
                  className={`h-6 w-6 cursor-pointer text-black transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`grid overflow-hidden transition-all duration-300 ease-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0">
                  <div className="bg-[#D8ECEB] px-8 py-8 text-center">
                    <p className="text-[24px] font-bold text-[#089C92] md:text-[28px] lg:text-[34px]">
                      {record.duration}
                    </p>
                    <div className="mt-4 flex items-center justify-center text-black">
                      <span className="text-[24px] font-medium md:text-[28px]">
                        {record.kcal}
                      </span>
                      <span className="mx-4 h-8 w-px bg-[#AFC0C0]" />
                      <span className="text-[24px] font-medium md:text-[28px]">
                        {record.distance}
                      </span>
                      <span className="mx-4 h-8 w-px bg-[#AFC0C0]" />
                      <div className="flex items-center gap-2">
                        <img
                          src="/images/health/icon_hana_money.png"
                          alt="하나머니 아이콘"
                          className="h-5 w-5"
                        />
                        <span className="text-[24px] font-bold md:text-[28px]">
                          {record.point}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
