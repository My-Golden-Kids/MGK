'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export type WalkHistoryRecord = {
  id?: string;
  date: string;
  duration: string;
  steps: string;
  distance: string;
  point: string;
};

type WalkSummaryPanelProps = {
  currentRecord?: WalkHistoryRecord;
  records?: WalkHistoryRecord[];
};

export default function WalkSummaryPanel({
  currentRecord,
  records: savedRecords = [],
}: WalkSummaryPanelProps) {
  const [openRecordId, setOpenRecordId] = useState<string | null>('current');
  const records = currentRecord
    ? [currentRecord, ...savedRecords]
    : savedRecords;

  useEffect(() => {
    if (currentRecord) {
      setOpenRecordId('current');
    }
  }, [currentRecord?.id]);

  const handleToggle = (recordId: string) => {
    setOpenRecordId((prev) => (prev === recordId ? null : recordId));
  };

  return (
    <section className="relative h-full overflow-y-auto overflow-x-hidden rounded-t-[32px] bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="bg-white">
        {records.length === 0 && (
          <div className="px-8 py-12 text-center text-[#6B7472]">
            저장된 산책 기록이 없습니다.
          </div>
        )}
        {records.map((record, index) => {
          const recordId = record.id ?? `${record.date}-${index}`;
          const isOpen = openRecordId === recordId;

          return (
            <div key={recordId} className="border-[#D9D9D9] border-b">
              <button
                type="button"
                onClick={() => handleToggle(recordId)}
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
                  isOpen
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0">
                  <div className="bg-[#D8ECEB] px-8 py-8 text-center">
                    <p className="font-bold text-[#089C92] text-[24px] md:text-[28px] lg:text-[34px]">
                      {record.duration}
                    </p>
                    <div className="mt-4 flex items-center justify-center text-black">
                      <span className="font-medium text-[24px] md:text-[28px]">
                        {record.steps}
                      </span>
                      <span className="mx-4 h-8 w-px bg-[#AFC0C0]" />
                      <span className="font-medium text-[24px] md:text-[28px]">
                        {record.distance}
                      </span>
                      <span className="mx-4 h-8 w-px bg-[#AFC0C0]" />
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/health/icon_hana_money.png"
                          alt="하나머니 아이콘"
                          width={20}
                          height={20}
                          className="h-5 w-5"
                        />
                        <span className="font-bold text-[24px] md:text-[28px]">
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
