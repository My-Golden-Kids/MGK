'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/common/Modal';
import CheckboxButton from '@/components/signup/CheckboxButton';
import InputField from '@/components/signup/InputField';
import { signup } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { type SignupValues, validateSignupField } from '@/lib/validator';
import { STEPS, TERMS } from './constants';

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTermsPhase, setIsTermsPhase] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState<Record<string, boolean>>({});
  const [openTermKey, setOpenTermKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isTermsPhase) {
      inputRef.current?.focus();
    }
  }, [step, isTermsPhase]);

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};

    for (let i = 0; i <= step; i++) {
      const s = STEPS[i];
      newErrors[s.key] = validateSignupField(
        s.key as keyof SignupValues,
        values[s.key] ?? '',
        { password: values['password'] },
      );
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));

    if (Object.values(newErrors).some((e) => e !== '')) return;

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

  const handleSignup = async () => {
    setIsLoading(true);
    setSignupError('');

    const { ok, errorMessage } = await signup({
      email: values.email,
      password: values.password,
      accountNum: values.accountNum,
    });

    if (!ok) {
      setSignupError(errorMessage ?? '');
      setIsLoading(false);
      return;
    }

    const result = await signIn('email-password', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.ok) {
      router.replace('/home');
    } else {
      setSignupError('로그인에 실패했어요. 다시 로그인해주세요.');
      router.replace('/login');
    }
  };

  const allChecked = TERMS.every((term) => checkedTerms[term.key]);
  const activeTerm = TERMS.find((t) => t.key === openTermKey);
  const visibleSteps = isTermsPhase ? STEPS : STEPS.slice(0, step + 1);

  return (
    <div className="relative mx-auto flex h-dvh w-full flex-1 flex-col overflow-hidden px-6.25 sm:max-w-lg md:max-w-xl">
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

        {isTermsPhase && signupError && (
          <p className="font-bold text-[18px] text-error-red">{signupError}</p>
        )}

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
        disabled={(isTermsPhase && !allChecked) || isLoading}
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
          <div
            className={cn(
              'overflow-y-scroll rounded-[5px] bg-gray-100',
              'wrap-break-word max-h-79.5 sm:max-w-auto',
              '[&::-webkit-scrollbar]:w-1.75',
              '[&::-webkit-scrollbar-thumb]:rounded-xs',
              '[&::-webkit-scrollbar-thumb]:bg-main-green',
              '[&::-webkit-scrollbar-track]:bg-transparent',
            )}
          >
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
