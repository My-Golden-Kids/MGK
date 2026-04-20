'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ModalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'highlight';
}

const variantMap = {
  primary: 'bg-main-green text-white hover:brightness-110',
  secondary: 'bg-[#C4C4C4] text-black hover:brightness-95',
  highlight: 'bg-mint-green text-white hover:brightness-110',
};

/**

* ModalButton 컴포넌트
*
* 모달 내부에서 사용하는 버튼 UI 컴포넌트로 좌우로 늘어나는 속성을 갖고 있습니다.
*
* @param variant - 버튼 스타일 타입
* * 'primary': 기본 강조 버튼 (초록색)
* * 'secondary': 보조 버튼 (회색)
* * 'highlight': 강조된 액션 버튼 (밝은 민트색)
*
* @param children - 버튼 내부에 표시될 내용 (텍스트 또는 JSX)
*
* @param ...props - onClick, disabled 등 기본 button 속성 전달 가능
*
* @example
* <ModalButton variant="primary" onClick={handleConfirm}>
* 확인
* </ModalButton>
*/
export default function ModalButton({
  variant = 'primary',
  children,
  style,
  className,
  ...props
}: ModalButtonProps) {
  return (
    <button
      className={cn(
        'w-full cursor-pointer rounded-[10px] border-none py-3.5 font-medium text-[17px] transition-[filter,transform] duration-150 active:scale-[0.97]',
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
