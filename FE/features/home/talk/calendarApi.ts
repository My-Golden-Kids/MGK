import { clientFetch } from '@/lib/client-fetch';

export interface PetCandidate {
  id: number;
  name: string;
}

export interface PendingCalendarEvent {
  petId: number;
  eventType: string;
  date: string;
  name: string;
  confirmMessage: string;
}

export interface PendingFeedingAlarm {
  targets: { petId: number; petName: string }[]; // 1개면 특정 펫, 2개 이상이면 전체
  firstFeedTime: string; // "HH:mm:ss"
  mealsPerDay: number;
  customAmountG: number | null;
  confirmMessage: string;
  isUpdate?: boolean; // true면 PUT(수정), undefined/false면 POST(신규)
}

// 조회 의도가 명확한 키워드 — 과거형/존재 여부 질문
const QUERY_GUARD_KEYWORDS = ['했나', '했어', '기록있나', '있나', '있어', '있는지', '갔지'];

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

function findPetInTranscript(
  normalized: string,
  pets: PetCandidate[],
): PetCandidate | null {
  for (const pet of pets) {
    const normalizedName = pet.name.replaceAll(' ', '');
    if (normalizedName && normalized.includes(normalizedName)) {
      return pet;
    }
  }
  return null;
}

export function parseCalendarIntent(
  transcript: string,
  pets: PetCandidate[],
  fallbackPetId: number,
  fallbackPetName: string,
): PendingCalendarEvent | null {
  const normalized = transcript.replaceAll(' ', '');

  // 쿼리 의도(과거형·존재 여부)가 있으면 일정 추가로 분류하지 않음
  const hasQueryIntent = QUERY_GUARD_KEYWORDS.some((k) => normalized.includes(k));
  if (hasQueryIntent) return null;

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

  const matchedPet = findPetInTranscript(normalized, pets);
  const petId = matchedPet ? matchedPet.id : fallbackPetId;
  const petName = matchedPet ? matchedPet.name : fallbackPetName;

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

// ---------------------------------------------------------------------------
// 사료 알람 intent 파싱
// ---------------------------------------------------------------------------

function parseTimeFromTranscript(normalized: string): string | null {
  // 오후 N시 M분
  const pmMinMatch = normalized.match(/오후(\d{1,2})시(\d{1,2})분/);
  if (pmMinMatch) {
    const h = parseInt(pmMinMatch[1], 10);
    const m = parseInt(pmMinMatch[2], 10);
    const hour = h >= 13 ? h : h === 12 ? 12 : h + 12;
    return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  // 오후 N시 (반 포함)
  const pmMatch = normalized.match(/오후(\d{1,2})시/);
  if (pmMatch) {
    const h = parseInt(pmMatch[1], 10);
    const hour = h >= 13 ? h : h === 12 ? 12 : h + 12;
    const half = normalized.includes(`오후${pmMatch[1]}시반`);
    return `${String(hour).padStart(2, '0')}:${half ? '30' : '00'}:00`;
  }

  // N시 M분
  const hourMinMatch = normalized.match(/(\d{1,2})시(\d{1,2})분/);
  if (hourMinMatch) {
    const h = parseInt(hourMinMatch[1], 10);
    const m = parseInt(hourMinMatch[2], 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  // N시 (반 포함)
  const hourMatch = normalized.match(/(\d{1,2})시/);
  if (hourMatch) {
    const h = parseInt(hourMatch[1], 10);
    const half = normalized.includes(`${hourMatch[1]}시반`);
    return `${String(h).padStart(2, '0')}:${half ? '30' : '00'}:00`;
  }

  return null;
}

function parseMealsPerDay(normalized: string): number | null {
  // 숫자 + 끼 / 번
  const digitMatch = normalized.match(/([2-4])(끼|번)/);
  if (digitMatch) return parseInt(digitMatch[1], 10);

  // 한글 + 끼 / 번
  if (normalized.includes('두끼') || normalized.includes('두번')) return 2;
  if (normalized.includes('세끼') || normalized.includes('세번')) return 3;
  if (normalized.includes('네끼') || normalized.includes('네번')) return 4;

  return null;
}

function parseAmountG(normalized: string): number | null {
  const match = normalized.match(/(\d+)(그람|그램|g|G)/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseFeedingIntent(
  transcript: string,
  pets: PetCandidate[],
): PendingFeedingAlarm | null {
  const normalized = transcript.replaceAll(' ', '');

  const hasFeedingKeyword =
    normalized.includes('사료') ||
    normalized.includes('밥') ||
    normalized.includes('먹이') ||
    normalized.includes('급여') ||
    /[2-4](끼|번)/.test(normalized) ||
    ['두끼', '세끼', '네끼', '두번', '세번', '네번'].some((k) =>
      normalized.includes(k),
    );
  const hasUpdateIntent =
    normalized.includes('변경해줘') ||
    normalized.includes('변경해주세요') ||
    normalized.includes('수정해줘') ||
    normalized.includes('수정해주세요');

  const hasAddIntent =
    hasUpdateIntent ||
    normalized.includes('추가해줘') ||
    normalized.includes('등록해줘') ||
    normalized.includes('추가해주세요') ||
    normalized.includes('등록해주세요') ||
    normalized.includes('알람추가') ||
    normalized.includes('알람등록') ||
    normalized.includes('설정해줘') ||
    normalized.includes('설정해주세요');

  if (!hasFeedingKeyword || !hasAddIntent) return null;

  const firstFeedTime = parseTimeFromTranscript(normalized);
  if (!firstFeedTime) return null;

  const mealsPerDay = parseMealsPerDay(normalized);
  if (!mealsPerDay) return null;

  const customAmountG = parseAmountG(normalized);

  const matchedPet = findPetInTranscript(normalized, pets);
  const targets = matchedPet
    ? [{ petId: matchedPet.id, petName: matchedPet.name }]
    : pets.map((p) => ({ petId: p.id, petName: p.name }));

  if (targets.length === 0) return null;

  const [h, m] = firstFeedTime.split(':');
  const displayTime = `${parseInt(h, 10)}시${m !== '00' ? ` ${m}분` : ''}`;
  const amountText = customAmountG ? ` ${customAmountG}g` : '';
  const petDisplay =
    targets.length === 1 ? targets[0]!.petName : '모든 반려동물';

  const verb = hasUpdateIntent ? '변경' : '등록';

  return {
    targets,
    firstFeedTime,
    mealsPerDay,
    customAmountG,
    isUpdate: hasUpdateIntent,
    confirmMessage: `${petDisplay} 사료 알람을 ${displayTime} 시작 ${mealsPerDay}끼${amountText}로 ${verb}할까요?`,
  };
}

interface FeedingAlarmResult {
  ok: boolean;
  conflictTargets?: { petId: number; petName: string }[];
  errorMessage?: string;
}

export async function createFeedingAlarm(
  params: PendingFeedingAlarm,
): Promise<FeedingAlarmResult> {
  const body = JSON.stringify({
    firstFeedTime: params.firstFeedTime,
    mealsPerDay: params.mealsPerDay,
    customAmountG: params.customAmountG,
  });

  try {
    const results = await Promise.all(
      params.targets.map(async ({ petId, petName }) => ({
        petId,
        petName,
        res: await clientFetch(`/api/feeding-schedules/${petId}`, {
          method: 'POST',
          body,
        }),
      })),
    );

    const conflicts = results.filter((r) => r.res.status === 409);
    const errors = results.filter((r) => !r.res.ok && r.res.status !== 409);

    if (errors.length > 0) {
      return { ok: false, errorMessage: '사료 알람 등록에 실패했어요.' };
    }

    if (conflicts.length > 0) {
      return {
        ok: false,
        conflictTargets: conflicts.map((c) => ({
          petId: c.petId,
          petName: c.petName,
        })),
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}

export async function updateFeedingAlarm(
  params: PendingFeedingAlarm,
): Promise<FeedingAlarmResult> {
  const body = JSON.stringify({
    firstFeedTime: params.firstFeedTime,
    mealsPerDay: params.mealsPerDay,
    customAmountG: params.customAmountG,
  });

  try {
    const results = await Promise.all(
      params.targets.map(({ petId }) =>
        clientFetch(`/api/feeding-schedules/${petId}`, {
          method: 'PUT',
          body,
        }),
      ),
    );

    if (results.some((r) => !r.ok)) {
      return { ok: false, errorMessage: '사료 알람 변경에 실패했어요.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, errorMessage: '네트워크 오류가 발생했어요.' };
  }
}
