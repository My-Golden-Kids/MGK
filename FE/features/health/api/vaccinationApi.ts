import { clientFetch } from '@/lib/auth';
import type {
  CreateScheduleRequest,
  ScheduleCalendarEntry,
  VaccinationPetSummaryResponse,
} from '../types/vaccination';

export async function getSchedules(
  year: number,
  month: number,
): Promise<ScheduleCalendarEntry[]> {
  const res = await clientFetch(
    `/api/vaccinations/schedules?year=${year}&month=${month}`,
  );

  if (!res.ok) {
    throw new Error(`일정 조회 실패: ${res.status}`);
  }

  return res.json();
}

export async function createSchedule(
  request: CreateScheduleRequest,
): Promise<void> {
  const res = await clientFetch('/api/vaccinations/schedules', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  console.log(res);
  if (!res.ok) {
    throw new Error(`일정 추가 실패: ${res.status}`);
  }
}

export async function getVaccinationSummary(): Promise<
  VaccinationPetSummaryResponse[]
> {
  const res = await clientFetch('/api/vaccinations/summary');
  console.log(res);
  if (!res.ok) {
    throw new Error(`접종 현황 조회 실패: ${res.status}`);
  }

  return res.json();
}
