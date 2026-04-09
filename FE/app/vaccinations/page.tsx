'use client';

import { useEffect, useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';
import { TypeSelect } from '@/components/common/TypeSelect';
import Calendar from '@/components/health/vaccination/Calendar';
import ScheduleInput from '@/components/health/vaccination/ScheduleInput';
import VaccinationListSection from '@/components/health/vaccination/VaccinationListSection';
import {
  createSchedule,
  getSchedules,
  getVaccinationSummary,
} from '@/features/health/api/vaccinationApi';
import {
  EVENT_TYPE_MAP,
  type VaccinationPetSummaryResponse,
  type VisitType,
} from '@/features/health/types/vaccination';

const VISIT_TYPE_OPTIONS = [
  { label: '접종', value: 'VACCINATION' as VisitType },
  { label: '진료', value: 'CHECKUP' as VisitType },
] as const;

type FormState = {
  petId: number | null;
  visitType: VisitType;
  date: string;
  title: string;
  memo: string;
};

const INITIAL_FORM: FormState = {
  petId: null,
  visitType: 'VACCINATION',
  date: '',
  title: '',
  memo: '',
};

export default function VaccinationPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [schedules, setSchedules] = useState<Record<string, string[]>>({});
  const [petSummaries, setPetSummaries] = useState<
    VaccinationPetSummaryResponse[]
  >([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    getVaccinationSummary()
      .then((summaries) => {
        setPetSummaries(summaries);
        if (summaries.length > 0 && form.petId === null) {
          setForm((prev) => ({ ...prev, petId: summaries[0].petId }));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    getSchedules(year, month)
      .then((entries) => {
        const record: Record<string, string[]> = {};
        for (const entry of entries) {
          record[entry.date] = entry.eventTypes.map(
            (t) => EVENT_TYPE_MAP[t] ?? t,
          );
        }
        setSchedules(record);
      })
      .catch(console.error);
  }, [year, month]);

  const petOptions = petSummaries.map((s) => ({
    label: s.petName,
    value: String(s.petId),
  }));

  const handleChange = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setForm((prev) => ({ ...INITIAL_FORM, petId: prev.petId }));
  };

  const handleSubmit = async () => {
    if (!form.petId || !form.date || !form.title) return;

    await createSchedule({
      petId: form.petId,
      eventType: form.visitType,
      date: form.date,
      name: form.title,
      memo: form.memo,
    });

    handleClose();
    // 현재 월 일정 + 접종 현황 새로고침
    Promise.all([getSchedules(year, month), getVaccinationSummary()])
      .then(([entries, summaries]) => {
        const record: Record<string, string[]> = {};
        for (const entry of entries) {
          record[entry.date] = entry.eventTypes.map(
            (t) => EVENT_TYPE_MAP[t] ?? t,
          );
        }
        setSchedules(record);
        setPetSummaries(summaries);
      })
      .catch(console.error);
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto p-4.25">
        <Calendar
          schedules={schedules}
          scheduleTypes={[
            { type: 'vaccine', color: 'bg-mint-green', label: '예방접종' },
            { type: 'checkup', color: 'bg-main-yellow', label: '검진' },
          ]}
          onAddSchedule={() => setIsModalOpen(true)}
          onMonthChange={handleMonthChange}
        />
        <div className="flex flex-col gap-2.5">
          {petSummaries.map((summary) => (
            <VaccinationListSection
              key={summary.petId}
              petName={summary.petName}
              petImageUrl={summary.petImageUrl ?? undefined}
              latestScheduleLabel={summary.latestScheduleLabel}
              vaccinationItems={summary.vaccinationItems}
            />
          ))}
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
              options={petOptions}
              value={form.petId !== null ? String(form.petId) : ''}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, petId: Number(v) }))
              }
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
              className="w-full rounded-[10px] border-2 border-gray-400 px-4 py-3 text-[22px] transition-colors placeholder:text-gray-400 focus:border-gray-500 sm:text-[28px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
