'use client';

import { BottomNavigation } from '@/components/common/BottomNavigation';
import { TypeSelect } from '@/components/common/TypeSelect';
import MedicalRecordItem from '@/components/health/medical/MedicalRecordItem';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const tabs = ['진료', '접종'] as const;
type MedicalRecordTab = (typeof tabs)[number];

const medicalRecords = [
  {
    category: '정기검진' as const,
    date: '2026-04-03',
    hospitalName: '튼튼동물메디컬센터',
    totalAmount: 78000,
    variant: 'green' as const,
    records: [
      { petName: '돌멩이', details: '정기 건강검진 및 피부 상태 확인' },
      { petName: '돔망이', details: '예방접종 상담과 체중 점검' },
    ],
  },
  {
    category: '응급' as const,
    date: '2026-03-18',
    hospitalName: '24시 해피동물병원',
    totalAmount: 42000,
    variant: 'mint' as const,
    records: [{ petName: '이멩돌', details: '소화 불편 증상 진료 및 약 처방' }],
  },
  {
    category: '진료' as const,
    date: '2026-02-27',
    hospitalName: '우리동네동물의원',
    totalAmount: 95000,
    variant: 'green' as const,
    records: [
      { petName: '멩도리', details: '슬개골 경과 확인과 진통제 처방' },
      { petName: '망둘이', details: '귀 세정 및 외이염 검사' },
    ],
  },
];

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<MedicalRecordTab>(tabs[0]);
  const filteredRecords = medicalRecords.filter(
    (record) => record.category === selectedTab,
  );

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#27312D]">
      <main className="flex-1 p-10">
        <div className="relative mb-4 flex items-center justify-center">
          <h1 className="text-center text-[28px] leading-none sm:text-[28px] md:text-[34px] lg:text-[40px]">
            진료 이력
          </h1>
          <button
            type="button"
            onClick={() => router.push('/health/medical-records/add-image')}
            className="-translate-y-1/2 absolute top-1/2 right-0 cursor-pointer px-4 py-3 font-medium text-2xl text-[#00A58C]"
          >
            추가
          </button>
        </div>

        <section className="my-10">
          <TypeSelect
            options={tabs}
            value={selectedTab}
            onValueChange={(value) => setSelectedTab(value as MedicalRecordTab)}
            variant="tabs"
          />
        </section>

        <section className="mt-4 space-y-4">
          {filteredRecords.map((record) => (
            <MedicalRecordItem
              key={`${record.date}-${record.hospitalName}`}
              date={record.date}
              hospitalName={record.hospitalName}
              records={record.records}
              totalAmount={record.totalAmount}
              variant={record.variant}
            />
          ))}
          {filteredRecords.length === 0 ? (
            <div className="rounded-[24px] bg-[#F4F6F5] px-5 py-10 text-center">
              <p className="font-medium text-[#66706D] text-[18px]">
                해당 탭의 병원기록이 아직 없어요.
              </p>
            </div>
          ) : null}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
