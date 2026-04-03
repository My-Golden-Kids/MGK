'use client';

import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  isChecked: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * 체크 상태와 레이블을 함께 표시하는 버튼 컴포넌트
 *
 * 체크 아이콘(좌측), 텍스트 레이블(중앙), 화살표 아이콘(우측)으로 구성되며,
 * 체크 상태에 따라 아이콘 색상이 변경됩니다.
 *
 * @component
 * @example
 * <CheckboxButton
 *   title="약관 동의"
 *   isChecked={true}
 *   onClick={() => handleToggle()}
 * />
 *
 * @param {string} title - 버튼에 표시될 레이블 텍스트
 * @param {boolean} isChecked - 체크 상태 여부 (true: 활성화 색상, false: 비활성화 색상)
 * @param {string} [className] - 추가 Tailwind 클래스
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props - 기타 button 네이티브 속성
 */
export default function CheckboxButton({
  title,
  isChecked,
  type = 'button',
  className,
  ...props
}: Props) {
  return (
    <button
      type={type}
      title={title}
      aria-pressed={isChecked}
      className={cn('flex items-center justify-start', className)}
      {...props}
    >
      <div
        className={cn(
          'rounded-[5px] p-0.75',
          isChecked
            ? 'bg-[#00A58C] text-white'
            : 'bg-gray-300 text-transparent',
        )}
      >
        <Check size={24} />
      </div>
      <span className="mr-5.75 ml-4.25 items-center font-bold text-[18px] sm:mr-10 sm:text-[20px]">
        {title}
      </span>
      <ChevronRight size={15} />
    </button>
  );
}
