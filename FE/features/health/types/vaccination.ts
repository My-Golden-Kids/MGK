export type VisitType = 'VACCINATION' | 'CHECKUP';

export type ScheduleCalendarEntry = {
  date: string; // YYYY-MM-DD
  eventTypes: VisitType[]; // VACCINATION | CHECKUP
};

export type CreateScheduleRequest = {
  petId: number;
  eventType: VisitType;
  date: string; // YYYY-MM-DD
  name: string;
  memo: string;
};

export type VaccinationHistoryItem = {
  date: string;
  completed: boolean;
};

export type VaccinationItemResponse = {
  id: string;
  title: string;
  totalCount: number;
  lastDate: string;
  nextDate: string;
  history: VaccinationHistoryItem[];
};

export type VaccinationPetSummaryResponse = {
  petId: number;
  petName: string;
  petImageUrl: string | null;
  latestScheduleLabel: string;
  vaccinationItems: VaccinationItemResponse[];
};

/** 백엔드 eventType → Calendar 컴포넌트 scheduleType 키 */
export const EVENT_TYPE_MAP: Record<string, string> = {
  VACCINATION: 'vaccine',
  CHECKUP: 'checkup',
};
