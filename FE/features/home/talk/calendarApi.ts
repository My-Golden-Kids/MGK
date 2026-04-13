import { clientFetch } from '@/lib/auth';

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
