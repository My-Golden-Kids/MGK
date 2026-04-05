'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/common/Modal';
import CheckboxButton from '@/components/signup/CheckboxButton';
import InputField from '@/components/signup/InputField';
import { cn } from '@/lib/utils';
import { STEPS, TERMS } from './constants';

//TODO: zod 에러 처리 로직 신경쓰고 하면서 엔터시 에러 사라지게 설정하기
//TODO: NextAuth 연동해서 로그인 처리한다음에
//TODO: 백엔드 토큰 발급해달라고 해야하니까 연동처리 고민하기

export default function Page() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTermsPhase, setIsTermsPhase] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState<Record<string, boolean>>({});
  const [openTermKey, setOpenTermKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isTermsPhase) {
      inputRef.current?.focus();
    }
  }, [step, isTermsPhase]);

  const validate = (key: string, value: string) => {
    if (!value.trim()) return '입력해주세요';
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return '유효하지 않은 이메일 형식입니다';
    }
    if (key === 'password' && value.length < 8) {
      return '8글자 이상 입력해주세요';
    }
    if (key === 'passwordConfirm' && value !== values['password']) {
      return '비밀번호가 일치하지 않습니다';
    }
    return '';
  };

  const handleConfirm = () => {
    const current = STEPS[step];
    const value = values[current.key] ?? '';
    const error = validate(current.key, value);

    if (error) {
      setErrors((prev) => ({ ...prev, [current.key]: error }));
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      setIsTermsPhase(true);
    }
  };

  const handleTermConfirm = () => {
    if (openTermKey) {
      setCheckedTerms((prev) => ({ ...prev, [openTermKey]: true }));
      setOpenTermKey(null);
    }
  };

  const handleSignup = () => {
    console.log('회원가입:', values);
  };

  const allChecked = TERMS.every((term) => checkedTerms[term.key]);
  const activeTerm = TERMS.find((t) => t.key === openTermKey);
  const visibleSteps = isTermsPhase ? STEPS : STEPS.slice(0, step + 1);

  return (
    <div className="relative flex h-dvh w-full flex-1 flex-col overflow-hidden px-6.25 sm:max-w-lg md:max-w-xl">
      <h1 className="mt-14.75 font-bold text-[28px] text-main-green sm:text-[30px]">
        회원가입
      </h1>
      <div
        className={cn(
          'mt-7.25 flex flex-1 flex-col gap-5 overflow-y-auto',
          !isTermsPhase && 'flex-col-reverse justify-end',
        )}
      >
        {visibleSteps.map((props, i) => (
          <InputField
            {...props}
            key={props.key}
            ref={!isTermsPhase && i === step ? inputRef : undefined}
            isActive={!isTermsPhase && i === step}
            value={values[props.key] ?? ''}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [props.key]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
            errorMessage={errors[props.key]}
          />
        ))}

        {isTermsPhase && (
          <div className="mt-12 mb-14 flex flex-col gap-4">
            {TERMS.map((term) => (
              <CheckboxButton
                key={term.key}
                title={term.title}
                isChecked={!!checkedTerms[term.key]}
                onClick={() => {
                  if (checkedTerms[term.key]) {
                    setCheckedTerms((prev) => ({ ...prev, [term.key]: false }));
                  } else {
                    setOpenTermKey(term.key);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={isTermsPhase ? handleSignup : handleConfirm}
        disabled={isTermsPhase && !allChecked}
        className={cn(
          'mb-26.5 w-full rounded-[10px] bg-main-green py-2.5 text-[28px] text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-300',
          isTermsPhase && 'font-bold',
        )}
      >
        {isTermsPhase
          ? '가입하기'
          : step === STEPS.length - 1
            ? '완료'
            : '확인'}
      </button>

      <Modal
        isOpen={!!openTermKey}
        onClose={() => setOpenTermKey(null)}
        onConfirm={handleTermConfirm}
        confirmText="동의"
        buttonVariant="single"
        isHighlightButton
      >
        {activeTerm && (
          <div className="rounded-[5px] bg-gray-100">
            <h2 className="font-bold text-[18px]">{activeTerm.subTitle}</h2>
            <p className="whitespace-pre-wrap indent-1 text-[18px]">
              {activeTerm.content}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
