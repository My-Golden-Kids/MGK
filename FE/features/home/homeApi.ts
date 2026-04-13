import { clientFetch } from '@/lib/auth';

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────

export const WALK_BUBBLE_MESSAGE = '산책할 시간이에요!';

const EVENT_TYPE_LABEL: Record<string, string> = {
  VACCINATION: '예방접종',
  CHECKUP: '건강검진',
};

const WALK_ALERT_KEY = 'walk-alert';
const CALENDAR_ALERT_KEY = 'calendar-alert';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export type ScheduleBubble = {
  message: string;
  onDismiss: () => void;
};

type WalkAlertState = {
  date: string;
  hour: number;
  dismissed: boolean;
};

type CalendarAlertState = {
  date: string;
  dismissed: Array<{ petId: number; eventType: string }>;
};

type TodayCalendarEvent = {
  petId: number;
  petName: string;
  name: string;
  eventType: string;
};

type AlarmResponse = {
  mostFrequentWalkHour: number | null;
  todayEvents: TodayCalendarEvent[];
};

// ──────────────────────────────────────────
// localStorage helpers
// ──────────────────────────────────────────

function readAlert<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeAlert<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function isWalkAlertDismissed(dateStr: string, hour: number): boolean {
  const state = readAlert<WalkAlertState>(WALK_ALERT_KEY);
  return (
    state?.date === dateStr && state?.hour === hour && state?.dismissed === true
  );
}

function dismissWalkAlert(dateStr: string, hour: number): void {
  writeAlert<WalkAlertState>(WALK_ALERT_KEY, {
    date: dateStr,
    hour,
    dismissed: true,
  });
}

function isCalendarEventDismissed(
  dateStr: string,
  petId: number,
  eventType: string,
): boolean {
  const state = readAlert<CalendarAlertState>(CALENDAR_ALERT_KEY);
  if (state?.date !== dateStr) return false;
  return state.dismissed.some(
    (d) => d.petId === petId && d.eventType === eventType,
  );
}

function dismissCalendarEvent(
  dateStr: string,
  petId: number,
  eventType: string,
): void {
  const state = readAlert<CalendarAlertState>(CALENDAR_ALERT_KEY);
  const existing = state?.date === dateStr ? state.dismissed : [];
  if (existing.some((d) => d.petId === petId && d.eventType === eventType)) {
    return;
  }
  writeAlert<CalendarAlertState>(CALENDAR_ALERT_KEY, {
    date: dateStr,
    dismissed: [...existing, { petId, eventType }],
  });
}

// ──────────────────────────────────────────
// API fetch
// ──────────────────────────────────────────

export async function fetchScheduleBubbles(
  todayStr: string,
  currentHour: number,
): Promise<ScheduleBubble[]> {
  const bubbles: ScheduleBubble[] = [];

  try {
    const res = await clientFetch('/api/alarm');
    if (!res.ok) return bubbles;

    const alarm = (await res.json()) as AlarmResponse;

    // ① 산책 알림 (최우선)
    if (
      alarm.mostFrequentWalkHour !== null &&
      currentHour === alarm.mostFrequentWalkHour &&
      !isWalkAlertDismissed(todayStr, currentHour)
    ) {
      bubbles.push({
        message: WALK_BUBBLE_MESSAGE,
        onDismiss: () => dismissWalkAlert(todayStr, currentHour),
      });
    }

    // ② 오늘 CalendarEvent 알림 (펫별·이벤트별 독립 dismiss)
    for (const event of alarm.todayEvents) {
      if (!isCalendarEventDismissed(todayStr, event.petId, event.eventType)) {
        const label = EVENT_TYPE_LABEL[event.eventType] ?? event.eventType;
        bubbles.push({
          message: `${event.petName}의 ${label} 일정이 오늘이에요!`,
          onDismiss: () =>
            dismissCalendarEvent(todayStr, event.petId, event.eventType),
        });
      }
    }
  } catch {}

  return bubbles;
}
