'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  label?: string;
  shortLabel: string;
  description?: string;
  errorMessage?: string;
  isActive?: boolean;
} & React.ComponentProps<'input'>;

/**
 * 회원가입 등 단계형 화면에서 사용되는 입력 필드입니다.
 *
 * - shortLabel: isActive가 false일 시 표시됩니다.
 * - label: isActive일 시 표시됩니다.
 * - description: 추가설명
 * - errorMessage: 에러 연결
 * - isActive: default false, 활성시 입력창이 더욱 강조됩니다.
 */
export default function InputField({
  label,
  shortLabel,
  description,
  errorMessage,
  isActive = false,
  className,
  ref,
  id,
  ...props
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isError = !!errorMessage;

  return (
    <div className={cn('flex w-full flex-col')}>
      {isActive ? (
        label && (
          <label
            htmlFor={inputId}
            className="font-bold text-[22px] sm:text-[28px]"
          >
            {label}
          </label>
        )
      ) : (
        <label
          htmlFor={inputId}
          className="font-bold text-[20px] sm:text-[22px]"
        >
          {shortLabel}
        </label>
      )}

      {description && isActive && (
        <p className="text-[18px] text-gray-500 sm:text-[20px]">
          {description}
        </p>
      )}
      <input
        id={inputId}
        aria-invalid={isError}
        aria-describedby={isError ? `${inputId}-error` : undefined}
        ref={ref}
        {...props}
        className={cn(
          'w-full border-b bg-transparent outline-none transition-all duration-300',
          'pb-1.25 text-[28px] placeholder:text-gray-300',
          isActive ? 'mt-3.75 border-[#00A58C]' : 'mt-1.25 border-black',
          isError && 'border-[#DC1F1F]',
          className,
        )}
      />
      {isError && (
        <p className="mt-2.5 font-bold text-[#DC1F1F] text-[18px] sm:text-[20px]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
