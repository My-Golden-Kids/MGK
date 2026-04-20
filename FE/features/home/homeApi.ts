import { clientFetch } from '@/lib/client-fetch';

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────

export const WALK_BUBBLE_MESSAGE = '산책할 시간이에요!';

const EVENT_TYPE_LABEL: Record<string, string> = {
  VACCINATION: '예방접종',
  CHECKUP: '건강검진',
};

const ALERT_STORE_KEY = 'home-alert-store';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export type ScheduleBubble = {
  message: string;
  onDismiss: () => void;
};

type AlertStore = {
  alarmHash: string;
  dismissed: string[]; // "walk:{hour}" | "calendar:{petId}:{eventType}" | "feeding:{HH:mm}"
};

type TodayCalendarEvent = {
  petId: number;
  petName: string;
  name: string;
  eventType: string;
};

type FeedingAlarm = {
  petId: number;
  petName: string;
  feedTime: string; // "HH:mm:ss" (LocalTime)
  amountGram: number | null; // null = species/age 정보 부족으로 계산 불가 → g 표시 생략
};

type AlarmResponse = {
  mostFrequentWalkHour: number | null;
  todayEvents: TodayCalendarEvent[];
  feedingAlarms: FeedingAlarm[];
};

// ──────────────────────────────────────────
// Feeding alarm helpers
// ──────────────────────────────────────────

// "HH:mm:ss" → hour(number)
function feedTimeHour(feedTime: string): number {
  return parseInt(feedTime.split(':')[0] ?? '0', 10);
}

// "HH:mm:ss" → "HH:mm"
function feedTimeLabel(feedTime: string): string {
  const parts = feedTime.split(':');
  return `${parts[0]}:${parts[1]}`;
}

function buildFeedingMessage(pets: FeedingAlarm[]): string {
  const timeLabel = feedTimeLabel(pets[0]!.feedTime);
  const petNames = pets.map((p) => p.petName).join(', ');

  const amounts = pets.map((p) => p.amountGram).filter((a) => a !== null);
  const allSameAmount =
    amounts.length === pets.length && amounts.every((a) => a === amounts[0]);

  if (allSameAmount && amounts[0] != null) {
    return `${timeLabel} ${petNames} 밥 줄 시간이에요.\n${amounts[0]}g 주세요`;
  }

  return `${timeLabel} ${petNames} 밥 줄 시간이에요.`;
}

// ──────────────────────────────────────────
// Hash
// ──────────────────────────────────────────

function hashAlarm(todayStr: string, alarm: AlarmResponse): string {
  const raw = JSON.stringify({
    date: todayStr,
    walkHour: alarm.mostFrequentWalkHour,
    events: alarm.todayEvents.map((e) => `${e.petId}:${e.eventType}`).sort(),
    feeding: (alarm.feedingAlarms ?? [])
      .map((f) => `${f.petId}:${f.feedTime}`)
      .sort(),
  });

  // djb2
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = Math.imul(h << 5, h) + raw.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

// ──────────────────────────────────────────
// Alert store helpers
// ──────────────────────────────────────────

function readStore(): AlertStore | null {
  try {
    const raw = localStorage.getItem(ALERT_STORE_KEY);
    return raw ? (JSON.parse(raw) as AlertStore) : null;
  } catch {
    return null;
  }
}

function writeStore(store: AlertStore): void {
  try {
    localStorage.setItem(ALERT_STORE_KEY, JSON.stringify(store));
  } catch {}
}

function resolveStore(currentHash: string): AlertStore {
  const stored = readStore();
  // 해시가 다르면 (날짜 변경 or 알람 내용 변경) dismissed 리셋
  if (stored?.alarmHash === currentHash) return stored;
  return { alarmHash: currentHash, dismissed: [] };
}

function addDismissed(id: string): void {
  const stored = readStore();
  if (!stored) return;
  if (stored.dismissed.includes(id)) return;
  writeStore({ ...stored, dismissed: [...stored.dismissed, id] });
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
    const hash = hashAlarm(todayStr, alarm);
    const store = resolveStore(hash);

    // 최신 hash로 store 초기화 (dismissed 리셋 포함)
    writeStore(store);

    // ① 산책 알림 (최우선)
    if (
      alarm.mostFrequentWalkHour !== null &&
      currentHour === alarm.mostFrequentWalkHour
    ) {
      const id = `walk:${currentHour}`;
      if (!store.dismissed.includes(id)) {
        bubbles.push({
          message: WALK_BUBBLE_MESSAGE,
          onDismiss: () => addDismissed(id),
        });
      }
    }

    // ② 오늘 CalendarEvent 알림 (펫별·이벤트별 독립 dismiss)
    for (const event of alarm.todayEvents) {
      const id = `calendar:${event.petId}:${event.eventType}`;
      if (!store.dismissed.includes(id)) {
        const label = EVENT_TYPE_LABEL[event.eventType] ?? event.eventType;
        bubbles.push({
          message: `${event.petName}의 ${label} 일정이 오늘이에요!`,
          onDismiss: () => addDismissed(id),
        });
      }
    }

    // ③ 밥먹기 알림 (현재 시간과 일치하는 급여 시간, feedTime 단위로 그룹화)
    const feedingAlarms = alarm.feedingAlarms ?? [];
    const feedingByTime = new Map<string, FeedingAlarm[]>();

    for (const feeding of feedingAlarms) {
      const hour = feedTimeHour(feeding.feedTime);

      if (hour !== currentHour) continue;
      const key = feedTimeLabel(feeding.feedTime);
      const group = feedingByTime.get(key) ?? [];
      group.push(feeding);
      feedingByTime.set(key, group);
    }

    for (const [timeKey, group] of feedingByTime) {
      const id = `feeding:${timeKey}`;
      if (!store.dismissed.includes(id)) {
        bubbles.push({
          message: buildFeedingMessage(group),
          onDismiss: () => addDismissed(id),
        });
      }
    }
  } catch (e) {
    console.error('[alarm] error:', e);
  }

  return bubbles;
}
