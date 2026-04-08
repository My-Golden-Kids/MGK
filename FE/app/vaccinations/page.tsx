'use client';

import { useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';
import { TypeSelect } from '@/components/common/TypeSelect';
import Calendar from '@/components/health/vaccination/Calendar';
import ScheduleInput from '@/components/health/vaccination/ScheduleInput';
import VaccinationListSection from '@/components/health/vaccination/VaccinationListSection';

// TODO: API에서 반려동물 목록을 불러와 교체 — GET /api/pets
// value는 petId, label은 이름
const PET_OPTIONS = [
  { label: '멩돌쓰', value: 'pet-001' },
  { label: '멩돌투', value: 'pet-002' },
] as const;

// 백엔드 enum 값과 일치시켜 두면 그대로 전송 가능
const VISIT_TYPE_OPTIONS = [
  { label: '접종', value: 'VACCINATION' },
  { label: '진료', value: 'CHECKUP' },
] as const;

type VisitType = (typeof VISIT_TYPE_OPTIONS)[number]['value'];

// TODO: API 스펙 확정 후 타입 맞추기
type ScheduleCreatePayload = {
  petId: string;
  visitType: VisitType;
  date: string; // YYYY-MM-DD
  title: string;
  memo: string;
};

const INITIAL_FORM: ScheduleCreatePayload = {
  petId: PET_OPTIONS[0].value,
  visitType: VISIT_TYPE_OPTIONS[0].value,
  date: '',
  title: '',
  memo: '',
};

// TODO: 실제 데이터는 API에서 불러와 교체 — GET /api/pets/:petId/vaccinations
const sampleVaccinationItems = [
  {
    id: 1,
    title: '광견병',
    totalCount: 3,
    lastDate: '2024-01-01',
    nextDate: '2024-07-01',
    history: [
      { date: '2023-01-01', completed: true },
      { date: '2023-07-01', completed: true },
      { date: '2024-01-01', completed: true },
    ],
  },
  {
    id: 2,
    title: '종합백신',
    totalCount: 2,
    lastDate: '2023-12-01',
    nextDate: '2024-06-01',
    history: [
      { date: '2023-06-01', completed: true },
      { date: '2023-12-01', completed: true },
    ],
  },
];

// TODO: API에서 월별 일정 불러와 교체 — GET /api/schedules?year=&month=
const sampleSchedules: Record<string, string[]> = {
  '2026-04-08': ['vaccine', 'checkup'],
  '2026-04-07': ['vaccine'],
};

export default function VaccinationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<ScheduleCreatePayload>(INITIAL_FORM);

  const handleChange =
    (field: keyof ScheduleCreatePayload) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleClose = () => {
    setIsModalOpen(false);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = async () => {
    // TODO: API 연결 — POST /api/schedules
    // await createSchedule(form);
    console.log('일정 추가:', form);
    handleClose();
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto p-4.25">
        <Calendar
          schedules={sampleSchedules}
          scheduleTypes={[
            { type: 'vaccine', color: 'bg-mint-green', label: '예방접종' },
            { type: 'checkup', color: 'bg-main-yellow', label: '검진' },
          ]}
          onAddSchedule={() => setIsModalOpen(true)}
        />
        <div className="flex flex-col gap-2.5">
          <VaccinationListSection
            petName="돌멩쓰"
            latestScheduleLabel="켄넬코프 접종(4월 9일)"
            vaccinationItems={sampleVaccinationItems}
          />
          <VaccinationListSection
            petName="돌멩투"
            latestScheduleLabel="켄넬코프 접종(4월 9일)"
            vaccinationItems={sampleVaccinationItems}
          />
        </div>
      </div>

      <BottomNavigation />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        onConfirm={handleSubmit}
        confirmText="추가"
        buttonVariant="double"
        cancelText="취소"
      >
        <div className="flex flex-col gap-4">
          {/* 반려동물 */}
          <div className="flex flex-col gap-1.5">
            <p className="font-bold text-[22px] sm:text-[28px]">반려동물</p>
            <TypeSelect
              options={PET_OPTIONS}
              value={form.petId}
              onValueChange={handleChange('petId')}
              className="bg-gray-100 text-[22px] sm:text-[28px]"
            />
          </div>

          {/* 방문종류 */}
          <div className="flex flex-col gap-1.5">
            <p className="font-bold text-[22px] sm:text-[28px]">방문종류</p>
            <TypeSelect
              variant="tabs"
              options={VISIT_TYPE_OPTIONS}
              value={form.visitType}
              onValueChange={handleChange('visitType')}
              className="bg-gray-200"
            />
          </div>

          <ScheduleInput
            value={form.date}
            label={'날짜'}
            subLabel={'(년/월/일)'}
            type="date"
            onChange={(e) => handleChange('date')(e.target.value)}
          />

          {/* 일정 이름 */}

          <ScheduleInput
            placeholder="예: 콩이 예방접종"
            label={'일정 이름'}
            value={form.title}
            onChange={(e) => handleChange('title')(e.target.value)}
          />

          {/* 메모 */}
          <div className="flex flex-col gap-1.5">
            <p className="font-bold text-[22px] sm:text-[28px]">메모</p>
            <textarea
              placeholder="예: 케넬코프 2차"
              value={form.memo}
              onChange={(e) => handleChange('memo')(e.target.value)}
              rows={3}
              className="w-full rounded-[10px] border-2 border-gray-400 px-4 py-3 text-[22px] text-[22px] transition-colors placeholder:text-gray-400 focus:border-gray-500 sm:text-[28px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
