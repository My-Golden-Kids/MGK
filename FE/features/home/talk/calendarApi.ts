import { clientFetch } from '@/lib/auth';

export interface PendingCalendarEvent {
  petId: number;
  eventType: string;
  date: string;
  name: string;
  confirmMessage: string;
}

function parseDateFromTranscript(normalized: string): Date | null {
  const today = new Date();

  if (normalized.includes('오늘')) return today;

  if (normalized.includes('내일')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return d;
  }

  if (normalized.includes('모레')) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    return d;
  }

  const monthDayMatch = normalized.match(/(\d{1,2})월(\d{1,2})일/);
  if (monthDayMatch) {
    const month = parseInt(monthDayMatch[1], 10);
    const day = parseInt(monthDayMatch[2], 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const todayNorm = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      const parsed = new Date(today.getFullYear(), month - 1, day);
      if (parsed < todayNorm) {
        parsed.setFullYear(today.getFullYear() + 1);
      }
      return parsed;
    }
  }

  return null;
}

export function parseCalendarIntent(
  transcript: string,
  petId: number,
  petName: string,
): PendingCalendarEvent | null {
  const normalized = transcript.replaceAll(' ', '');

  const hasIntent =
    normalized.includes('일정추가') ||
    normalized.includes('일정등록') ||
    normalized.includes('추가해줘') ||
    normalized.includes('등록해줘') ||
    normalized.includes('추가해주세요') ||
    normalized.includes('등록해주세요');

  if (!hasIntent) return null;

  let eventType: string;
  let eventLabel: string;

  if (
    normalized.includes('접종') ||
    normalized.includes('예방접종') ||
    normalized.includes('백신')
  ) {
    eventType = 'VACCINATION';
    eventLabel = '예방접종';
  } else if (normalized.includes('검진') || normalized.includes('진료')) {
    eventType = 'CHECKUP';
    eventLabel = '검진';
  } else {
    return null;
  }

  const date = parseDateFromTranscript(normalized);
  if (!date) return null;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const isoDate = `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const displayDate = `${month}월 ${day}일`;

  return {
    petId,
    eventType,
    date: isoDate,
    name: eventLabel,
    confirmMessage: `${displayDate} ${petName} ${eventLabel} 일정을 추가할까요?`,
  };
}

interface CreateCalendarEventParams {
  petId: number;
  eventType: string;
  date: string;
  name: string;
  memo?: string;
}

interface CreateCalendarEventResult {
  ok: boolean;
  errorMessage?: string;
}

export async function createCalendarEvent(
  params: CreateCalendarEventParams,
): Promise<CreateCalendarEventResult> {
  try {
    const res = await clientFetch('/api/vaccinations/schedules', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      return { ok: false, errorMessage: '일정 추가에 실패했어요.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}
