'use client';

import { useState } from 'react';
import { cn } from '../../../lib/utils';

type ScheduleType = string;

export type ScheduleTypeDef = {
  /** schedules prop의 key와 일치해야 함 */
  type: ScheduleType;
  /** tailwind 색상 클래스 또는 hex — e.g. 'bg-mint-green' | '#5BCCE2' */
  color: string;
  /** 범례에 표시될 이름 */
  label: string;
};

type Props = {
  /** "YYYY-MM-DD" → 해당 날짜의 일정 타입 배열 */
  schedules?: Record<string, ScheduleType[]>;
  /**
   * 일정 타입 정의 목록.
   * color가 '#'으로 시작하면 인라인 스타일로, 아니면 tailwind 클래스로 처리됨.
   * @default 예방접종(파랑) + 검진(노랑)
   */
  scheduleTypes?: ScheduleTypeDef[];
  /** 일정 추가 버튼 클릭 핸들러 */
  onAddSchedule?: () => void;
  /** 날짜 클릭 핸들러 */
  onDateClick?: (date: string) => void;
  /** 월이 변경될 때 호출 (year, month) */
  onMonthChange?: (year: number, month: number) => void;
};

const DEFAULT_SCHEDULE_TYPES: ScheduleTypeDef[] = [
  { type: 'vaccine', color: '#5BCCE2', label: '예방접종' },
  { type: 'checkup', color: '#F5C842', label: '검진' },
];

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** hex 색상이면 인라인 style, tailwind 클래스면 className으로 분리 */
function resolveColor(color: string): {
  className?: string;
  style?: React.CSSProperties;
} {
  if (color.startsWith('#') || color.startsWith('rgb')) {
    return { style: { backgroundColor: color } };
  }
  return { className: color };
}

/**
 * 반려동물 예방접종·검진 일정을 표시하는 월간 캘린더 컴포넌트.
 *
 * - 날짜별로 일정 타입에 따른 색상 점을 표시합니다.
 * - 같은 날짜에 동일 타입이 여러 개 있어도 점은 타입당 1개만 렌더링됩니다.
 * - `scheduleTypes`를 통해 타입·색상·범례 이름을 동적으로 주입할 수 있습니다.
 * - 부모의 너비를 100% 따르므로, 레이아웃 제한이 필요하면 부모에서 `max-w-*`를 지정하세요.
 *
 * @example
 * // 기본 사용 (default 타입: 예방접종 + 검진)
 * <Calendar
 *   schedules={{
 *     '2026-04-08': ['vaccine', 'checkup'],
 *     '2026-04-15': ['vaccine'],
 *   }}
 * />
 *
 **/
export default function Calendar({
  schedules = {},
  scheduleTypes = DEFAULT_SCHEDULE_TYPES,
  onAddSchedule,
  onDateClick,
  onMonthChange,
}: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  const prevMonth = () => {
    const newYear = month === 1 ? year - 1 : year;
    const newMonth = month === 1 ? 12 : month - 1;
    setYear(newYear);
    setMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  };
  const nextMonth = () => {
    const newYear = month === 12 ? year + 1 : year;
    const newMonth = month === 12 ? 1 : month + 1;
    setYear(newYear);
    setMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  };

  const firstDow = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const lastDate = new Date(year, month, 0).getDate();
  const prevLastDate = new Date(year, month - 1, 0).getDate();

  // scheduleTypes를 type → def 맵으로 변환
  const typeMap = Object.fromEntries(
    scheduleTypes.map((def) => [def.type, def]),
  );

  type Cell = { day: number; type: 'prev' | 'cur' | 'next' };
  const cells: Cell[] = [];

  for (let i = startOffset - 1; i >= 0; i--)
    cells.push({ day: prevLastDate - i, type: 'prev' });
  for (let i = 1; i <= lastDate; i++) cells.push({ day: i, type: 'cur' });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, type: 'next' });

  return (
    <div className="w-full select-none rounded-2xl bg-white p-5">
      {/* 헤더 */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 text-lg transition-colors hover:bg-gray-100"
          >
            ‹
          </button>
          <span className="font-bold text-3xl">{month}월</span>
          <button
            type="button"
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 text-lg transition-colors hover:bg-gray-100"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={onAddSchedule}
          className="cursor-pointer text-gray-400 text-xl"
        >
          + 일정 추가
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS.map((d) => (
          <div
            key={d}
            className={cn(
              'py-1 text-center font-bold text-2xl',
              d === '일' && 'text-error-red',
            )}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {cells.map(({ day, type }, idx) => {
          const isToday =
            type === 'cur' &&
            year === todayY &&
            month === todayM &&
            day === todayD;
          const key = `${year}-${pad(month)}-${pad(day)}`;
          // 타입별 중복 제거 후 정의된 타입만 필터링
          const dotTypes =
            type === 'cur' && schedules[key]
              ? ([...new Set(schedules[key])] as ScheduleType[]).filter(
                  (t) => typeMap[t],
                )
              : [];
          const isSunday = idx % 7 === 6;

          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: calendar grid
              key={idx}
              type="button"
              onClick={() => type === 'cur' && onDateClick?.(key)}
              className="flex min-h-12 flex-col items-center rounded-xl pt-1.5 pb-2 transition-colors hover:bg-gray-50"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-2xl',
                  isToday
                    ? 'bg-mint-green text-white text-xl'
                    : type !== 'cur'
                      ? 'text-gray-300'
                      : isSunday
                        ? 'text-error-red'
                        : 'text-black',
                )}
              >
                {day}
              </span>

              {/* 일정 타입별 점 (타입당 1개) */}
              <div className="mt-1 flex h-1.5 items-center gap-1">
                {dotTypes.map((t) => {
                  const { className, style } = resolveColor(typeMap[t].color);
                  return (
                    <span
                      key={t}
                      className={cn('h-3 w-3 rounded-full', className)}
                      style={style}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* 범례 — scheduleTypes 기반으로 동적 렌더링 */}
      <div className="flex gap-4 border-gray-100 border-t">
        {scheduleTypes.map(({ type, color, label }) => {
          const { className, style } = resolveColor(color);
          return (
            <div
              key={type}
              className="flex items-center gap-1.5 text-gray-400 text-ls"
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  className,
                )}
                style={style}
              />
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
