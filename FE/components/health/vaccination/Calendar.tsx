'use client'

import { useState } from 'react';
import { cn } from '../../../lib/utils';

type ScheduleType = string

export type ScheduleTypeDef = {
  /** schedules prop의 key와 일치해야 함 */
  type: ScheduleType
  /** tailwind 색상 클래스 또는 hex — e.g. 'bg-mint-green' | '#5BCCE2' */
  color: string
  /** 범례에 표시될 이름 */
  label: string
}

type Props = {
  /** "YYYY-MM-DD" → 해당 날짜의 일정 타입 배열 */
  schedules?: Record<string, ScheduleType[]>
  /**
   * 일정 타입 정의 목록.
   * color가 '#'으로 시작하면 인라인 스타일로, 아니면 tailwind 클래스로 처리됨.
   * @default 예방접종(파랑) + 검진(노랑)
   */
  scheduleTypes?: ScheduleTypeDef[]
  /** 일정 추가 버튼 클릭 핸들러 */
  onAddSchedule?: () => void
  /** 날짜 클릭 핸들러 */
  onDateClick?: (date: string) => void
}

const DEFAULT_SCHEDULE_TYPES: ScheduleTypeDef[] = [
  { type: 'vaccine', color: '#5BCCE2', label: '예방접종' },
  { type: 'checkup', color: '#F5C842', label: '검진' },
]

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** hex 색상이면 인라인 style, tailwind 클래스면 className으로 분리 */
function resolveColor(color: string): {
  className?: string
  style?: React.CSSProperties
} {
  if (color.startsWith('#') || color.startsWith('rgb')) {
    return { style: { backgroundColor: color } }
  }
  return { className: color }
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
}: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const firstDow = new Date(year, month - 1, 1).getDay()
  const startOffset = firstDow === 0 ? 6 : firstDow - 1
  const lastDate = new Date(year, month, 0).getDate()
  const prevLastDate = new Date(year, month - 1, 0).getDate()

  // scheduleTypes를 type → def 맵으로 변환
  const typeMap = Object.fromEntries(scheduleTypes.map(def => [def.type, def]))

  type Cell = { day: number; type: 'prev' | 'cur' | 'next' }
  const cells: Cell[] = []

  for (let i = startOffset - 1; i >= 0; i--)
    cells.push({ day: prevLastDate - i, type: 'prev' })
  for (let i = 1; i <= lastDate; i++)
    cells.push({ day: i, type: 'cur' })
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++)
    cells.push({ day: i, type: 'next' })

  return (
    <div className="bg-white rounded-2xl p-5 w-full select-none">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors text-lg"
          >
            ‹
          </button>
          <span className="text-3xl font-bold">{month}월</span>
          <button
            type="button"
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors text-lg"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={onAddSchedule}
          className="text-xl text-gray-400 cursor-pointer"
        >
          + 일정 추가
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div
            key={d}
            className={cn("text-center text-2xl font-bold py-1", d === '일' && 'text-error-red')}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {cells.map(({ day, type }, idx) => {
          const isToday =
            type === 'cur' && year === todayY && month === todayM && day === todayD
          const key = `${year}-${pad(month)}-${pad(day)}`
          // 타입별 중복 제거 후 정의된 타입만 필터링
          const dotTypes =
            type === 'cur' && schedules[key]
              ? ([...new Set(schedules[key])] as ScheduleType[]).filter(t => typeMap[t])
              : []
          const isSunday = idx % 7 === 6

          return (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: calendar grid
              key={idx}
              type="button"
              onClick={() => type === 'cur' && onDateClick?.(key)}
              className="flex flex-col items-center pt-1.5 pb-2 rounded-xl hover:bg-gray-50 transition-colors min-h-12"
            >
              <span
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-full text-2xl',
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
              <div className="flex gap-1 mt-1 h-1.5 items-center">
                {dotTypes.map(t => {
                  const { className, style } = resolveColor(typeMap[t].color)
                  return (
                    <span
                      key={t}
                      className={cn('w-3 h-3 rounded-full', className)}
                      style={style}
                    />
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      {/* 범례 — scheduleTypes 기반으로 동적 렌더링 */}
      <div className="flex gap-4 border-t border-gray-100">
        {scheduleTypes.map(({ type, color, label }) => {
          const { className, style } = resolveColor(color)
          return (
            <div key={type} className="flex items-center gap-1.5 text-ls text-gray-400">
              <span
                className={cn('w-1.5 h-1.5 rounded-full inline-block', className)}
                style={style}
              />
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}