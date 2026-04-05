/** biome-ignore-all lint/a11y/noStaticElementInteractions: Modal 외부 클릭을 하였을 시 모달이 닫히도록 설정하기 위함*/
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: 버튼이 아닌 걸 클릭하게 만들면 키보드 이벤트도 추가해야 한다는 건데 추가해도 반응하지 않습니다. */
'use client';

import { type ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { default as ModalButton } from './ModalButton';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  closeOnOverlay?: boolean;
  children?: ReactNode;
  buttonVariant?: 'single' | 'double' | 'AsymmetricDouble' | 'none';
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  primaryButtonClassname?: string;
  isHighlightButton?: boolean;
}

/**
 * 범용 모달 컴포넌트
 *
 * 부모 컨테이너를 기준으로 overlay를 렌더링합니다.
 * 부모에 'position: relative와 overflow: hidden'이 필요합니다.
 *
 * 내용은 조정을 편안히 하기 위해 직접 칠드런으로 받고
 * 기본 영역은 15px, 버튼영역은 아래로 28px, 위로 18px의 패딩값을 기본적으로 가집니다.
 *
 * 버튼의 텍스트 굵기나 세부 조정이 필요할 경우 primaryButtonClassname에 추가 입력해주세요
 * onConfirm, onCancel에 버튼 작동시 필요한 기능을 넣어주시고
 * 정의되지 않을 시 기본적으로 onClose가 작동합니다 (배경 및 esc이벤트에도 마찬가지)
 *
 * 모달이 열려 있는 동안 기본 컨텐츠 스크롤이 잠기고 여러 모달 중첩시 마지막으로 닫힌 모달이
 * scroll lock을 해제합니다.
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  onConfirm,
  onCancel,
  closeOnOverlay = true,
  buttonVariant = 'single',
  primaryButtonClassname = '',
  confirmText = '확인',
  cancelText = '취소',
  isHighlightButton = false,
}: ModalProps) {
  // ESC key + scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-1000 flex animate-overlay-in items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`max-h-138.25 w-full min-w-75 animate-card-in rounded-[15px] bg-white p-3.75 shadow-[0_2px_13px_-5px_rgba(0,0,0,0.25)] sm:max-h-140`}
        onClick={(e) => e.stopPropagation()}
      >
        {children && (
          <div
            className={cn(
              'wrap-break-word max-h-79.5 overflow-y-scroll bg-amber-200 sm:max-w-auto',
              '[&::-webkit-scrollbar]:w-1.75',
              '[&::-webkit-scrollbar-thumb]:rounded-xs',
              '[&::-webkit-scrollbar-thumb]:bg-main-green',
              '[&::-webkit-scrollbar-track]:bg-transparent',
            )}
          >
            {children}
          </div>
        )}

        {buttonVariant !== 'none' && (
          <div className="flex gap-2.5 pt-4.5 pb-7">
            {(buttonVariant === 'double' ||
              buttonVariant === 'AsymmetricDouble') && (
              <ModalButton
                variant="secondary"
                onClick={onCancel ?? onClose}
                className={cn(
                  buttonVariant === 'AsymmetricDouble' ? 'flex-2' : 'flex-3',
                )}
              >
                {cancelText}
              </ModalButton>
            )}
            <ModalButton
              variant={isHighlightButton ? 'highlight' : 'primary'}
              onClick={onConfirm ?? onClose}
              className={cn(
                buttonVariant === 'single' ? 'mx-18.75' : 'flex-3',
                primaryButtonClassname,
              )}
            >
              {confirmText}
            </ModalButton>
          </div>
        )}
      </div>
    </div>
  );
}
