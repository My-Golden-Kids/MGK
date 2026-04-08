'use client';

import { cn } from '@/lib/utils';
import type * as React from 'react';

export const MEDICAL_RECORD_TYPE_OPTIONS = [
  '정기검진',
  '진료',
  '접종',
  '응급',
] as const;

export type MedicalRecordType = (typeof MEDICAL_RECORD_TYPE_OPTIONS)[number];

interface TypeSelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'children' | 'value'
  > {
  value: MedicalRecordType;
}

export function TypeSelect({
  className,
  value,
  ...props
}: TypeSelectProps) {
  return (
    <select
      value={value}
      className={cn(
        'h-[56px] w-full rounded-[14px] bg-[#F4F6F5] px-4 text-[18px] outline-none',
        className,
      )}
      {...props}
    >
      {MEDICAL_RECORD_TYPE_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
