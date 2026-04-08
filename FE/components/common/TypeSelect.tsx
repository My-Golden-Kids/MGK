'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';

export type SelectOption = string | { label: string; value: string };
type TypeSelectVariant = 'select' | 'tabs';

// Use `options={['A', 'B', 'C']}` or
// `options={[{ label: '전체', value: 'all' }, { label: '완료', value: 'done' }]}`
// so each page can decide its own labels and item count.
interface TypeSelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'children' | 'value'
  > {
  options: readonly SelectOption[];
  value: string;
  onValueChange?: (value: string) => void;
  variant?: TypeSelectVariant;
  tabListClassName?: string;
  tabButtonClassName?: string;
  activeTabButtonClassName?: string;
  inactiveTabButtonClassName?: string;
}

export function TypeSelect({
  activeTabButtonClassName,
  className,
  inactiveTabButtonClassName,
  onChange,
  onValueChange,
  options,
  tabButtonClassName,
  tabListClassName,
  value,
  variant = 'select',
  ...props
}: TypeSelectProps) {
  const normalizedOptions = options.map((option) =>
    typeof option === 'string'
      ? { label: option, value: option }
      : option,
  );
  const tabColumnCount = Math.max(normalizedOptions.length, 1);

  if (variant === 'tabs') {
    return (
      <div className={cn('rounded-full bg-[#D9D9D9] p-1', className)}>
        <div
          className={cn(
            'grid gap-1',
            tabListClassName,
          )}
          style={{ gridTemplateColumns: `repeat(${tabColumnCount}, minmax(0, 1fr))` }}
        >
          {normalizedOptions.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onValueChange?.(option.value)}
                className={cn(
                  'flex h-[44px] min-w-0 cursor-pointer items-center justify-center rounded-full text-[22px] transition-colors',
                  tabButtonClassName,
                  isActive
                    ? 'border-[#1F2A27] bg-white font-bold text-[#1F2A27] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                    : 'border-transparent font-normal text-[#1F2A27]',
                  isActive
                    ? activeTabButtonClassName
                    : inactiveTabButtonClassName,
                )}
              >
                <span className="truncate px-2">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <select
      value={value}
      className={cn(
        'h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none',
        className,
      )}
      onChange={(event) => {
        onValueChange?.(event.target.value);
        onChange?.(event);
      }}
      {...props}
    >
      {normalizedOptions.map((option) => {
        return (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        );
      })}
    </select>
  );
}
