'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { TypeSelect } from '@/components/common/TypeSelect';
import MedicalRecordItem from '@/components/health/medical/MedicalRecordItem';
import {
  getMedicalRecordApiBaseUrl,
  getStoredMedicalPetId,
  type MedicalRecordItemData,
} from '@/lib/medical-record';

const tabs = ['진료', '접종'] as const;
type MedicalRecordTab = (typeof tabs)[number];

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<MedicalRecordTab>(tabs[0]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordItemData[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const fetchMedicalRecords = async () => {
      try {
        setIsLoading(true);
        setMessage('');

        const query = new URLSearchParams({
          petId: String(getStoredMedicalPetId()),
          type: selectedTab,
        });

        const response = await fetch(
          `${getMedicalRecordApiBaseUrl()}/api/medical-records?${query.toString()}`,
        );

        if (!response.ok) {
          throw new Error('진료 이력 조회에 실패했습니다.');
        }

        const data = (await response.json()) as MedicalRecordItemData[];
        if (!isCancelled) {
          setMedicalRecords(data);
        }
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          setMedicalRecords([]);
          setMessage('진료 이력을 불러오지 못했습니다.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchMedicalRecords();

    return () => {
      isCancelled = true;
    };
  }, [selectedTab]);

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
          {medicalRecords.map((record) => (
            <MedicalRecordItem
              key={record.id}
              date={record.date}
              hospitalName={record.hospitalName}
              records={[
                {
                  petName: record.petName,
                  details: record.details,
                },
              ]}
              totalAmount={record.totalAmount}
              variant={selectedTab === '접종' ? 'mint' : 'green'}
            />
          ))}
          {isLoading ? (
            <div className="rounded-[24px] bg-[#F4F6F5] px-5 py-10 text-center">
              <p className="font-medium text-[#66706D] text-[18px]">
                진료 이력을 불러오는 중입니다.
              </p>
            </div>
          ) : null}
          {!isLoading && message ? (
            <div className="rounded-[24px] bg-[#F4F6F5] px-5 py-10 text-center">
              <p className="font-medium text-[#66706D] text-[18px]">
                {message}
              </p>
            </div>
          ) : null}
          {!isLoading && !message && medicalRecords.length === 0 ? (
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
