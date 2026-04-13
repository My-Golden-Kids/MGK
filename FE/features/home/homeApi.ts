import { clientFetch } from '@/lib/auth';

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────

export const WALK_BUBBLE_MESSAGE = '산책할 시간이에요!';

export const EVENT_TYPE_LABEL: Record<string, string> = {
  VACCINATION: '예방접종',
  CHECKUP: '건강검진',
};

const WALK_ALERT_KEY = 'walk-alert';
const CALENDAR_ALERT_KEY = 'calendar-alert';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

type WalkAlertState = {
  date: string;
  hour: number;
  dismissed: boolean;
};

type CalendarAlertState = {
  date: string;
  dismissedEventTypes: string[];
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

export function dismissWalkAlert(dateStr: string, hour: number): void {
  writeAlert<WalkAlertState>(WALK_ALERT_KEY, {
    date: dateStr,
    hour,
    dismissed: true,
  });
}

function isCalendarEventDismissed(dateStr: string, eventType: string): boolean {
  const state = readAlert<CalendarAlertState>(CALENDAR_ALERT_KEY);
  if (state?.date !== dateStr) return false;
  return state.dismissedEventTypes.includes(eventType);
}

export function dismissCalendarEvent(dateStr: string, eventType: string): void {
  const state = readAlert<CalendarAlertState>(CALENDAR_ALERT_KEY);
  const existing = state?.date === dateStr ? state.dismissedEventTypes : [];
  writeAlert<CalendarAlertState>(CALENDAR_ALERT_KEY, {
    date: dateStr,
    dismissedEventTypes: [...new Set([...existing, eventType])],
  });
}

// ──────────────────────────────────────────
// Walk hour calculation
// ──────────────────────────────────────────

function getMostFrequentWalkHour(
  records: Array<{ walkedAt: string | null }>,
): number | null {
  const counts: Record<number, number> = {};
  for (const r of records) {
    if (!r.walkedAt) continue;
    const h = new Date(r.walkedAt).getHours();
    counts[h] = (counts[h] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  entries.sort(([hA, cA], [hB, cB]) =>
    cB !== cA ? cB - cA : Number(hA) - Number(hB),
  );
  return Number(entries[0][0]);
}

// ──────────────────────────────────────────
// API fetch
// ──────────────────────────────────────────

export async function fetchScheduleBubbles(
  petId: number,
  todayStr: string,
  currentHour: number,
): Promise<string[]> {
  const bubbles: string[] = [];

  // ① 산책 알림 (최우선)
  try {
    const res = await clientFetch(`/api/pets/${petId}/walk-records`);
    if (res.ok) {
      const records = (await res.json()) as Array<{ walkedAt: string | null }>;
      const mostFrequentHour = getMostFrequentWalkHour(records);
      if (
        mostFrequentHour !== null &&
        currentHour === mostFrequentHour &&
        !isWalkAlertDismissed(todayStr, currentHour)
      ) {
        bubbles.push(WALK_BUBBLE_MESSAGE);
      }
    }
  } catch {}

  // ② 오늘 CalendarEvent 알림
  try {
    const [year, month] = todayStr.split('-').map(Number);
    const res = await clientFetch(
      `/api/vaccinations/schedules?year=${year}&month=${month}`,
    );
    if (res.ok) {
      const schedules = (await res.json()) as Array<{
        date: string;
        eventTypes: string[];
      }>;
      for (const s of schedules.filter((s) => s.date === todayStr)) {
        for (const et of s.eventTypes) {
          if (!isCalendarEventDismissed(todayStr, et)) {
            bubbles.push(`오늘 ${EVENT_TYPE_LABEL[et] ?? et} 일정이 있어요!`);
          }
        }
      }
    }
  } catch {}

  return bubbles;
}
