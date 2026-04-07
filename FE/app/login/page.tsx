'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useRef, useState } from 'react';
import InputField from '@/components/signup/InputField';
import { sendOtp } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { signupSchema } from '@/lib/validator';

type Mode = 'password' | 'magic-link' | 'sent';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const emailResult = signupSchema.shape.email.safeParse(values.email);
    const emailError = emailResult.success
      ? ''
      : (emailResult.error.issues[0]?.message ?? '');

    if (mode === 'password') {
      const passwordError = values.password.trim() ? '' : '입력해주세요';
      setErrors((prev) => ({
        ...prev,
        email: emailError,
        password: passwordError,
      }));
      return !emailError && !passwordError;
    }

    setErrors((prev) => ({ ...prev, email: emailError }));
    return !emailError;
  };

  const handlePasswordLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setErrors((prev) => ({ ...prev, form: '' }));

    const result = await signIn('email-password', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.ok) {
      router.replace('/home');
    } else {
      setErrors((prev) => ({
        ...prev,
        form: '이메일 또는 비밀번호가 올바르지 않아요.',
      }));
      setIsLoading(false);
    }
  };

  const handleSendMagicLink = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setErrors((prev) => ({ ...prev, form: '' }));

    const { ok, errorMessage } = await sendOtp({ email: values.email });

    if (ok) {
      setMode('sent');
    } else {
      setErrors((prev) => ({ ...prev, form: errorMessage ?? '' }));
      setIsLoading(false);
    }
  };

  const handleChange =
    (key: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: '', form: '' }));
    };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({ email: '', password: '', form: '' });
  };

  if (mode === 'sent') {
    return (
      <div className="relative mx-auto flex h-dvh w-full flex-1 flex-col overflow-hidden px-6.25 sm:max-w-lg md:max-w-xl">
        <h1 className="mt-14.75 font-bold text-[28px] text-main-green sm:text-[30px]">
          로그인
        </h1>
        <div className="mt-7.25 flex flex-1 flex-col justify-center gap-4">
          <p className="font-bold text-[22px]">이메일을 확인해주세요</p>
          <p className="text-[18px] text-gray-500">
            <span className="font-bold text-black">{values.email}</span>로
            로그인 링크를 보냈어요.
            <br />
            링크를 클릭하면 바로 로그인돼요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => switchMode('magic-link')}
          className="mb-26.5 w-full rounded-[10px] bg-main-green py-2.5 text-[28px] text-white transition-all active:scale-95"
        >
          다시 보내기
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-dvh w-full flex-1 flex-col overflow-hidden px-6.25 sm:max-w-lg md:max-w-xl">
      <h1 className="mt-14.75 font-bold text-[28px] text-main-green sm:text-[30px]">
        로그인
      </h1>

      <div className="mt-7.25 flex flex-1 flex-col-reverse justify-end gap-5 overflow-y-auto">
        <InputField
          key="email"
          shortLabel="이메일"
          label="이메일을 입력해주세요"
          placeholder="email@email.com"
          type="email"
          isActive={mode === 'magic-link'}
          ref={emailRef}
          value={values.email}
          onChange={handleChange('email')}
          onKeyDown={(e) => {
            if (e.key === 'Enter')
              mode === 'password'
                ? handlePasswordLogin()
                : handleSendMagicLink();
          }}
          errorMessage={errors.email}
        />

        {mode === 'password' && (
          <InputField
            key="password"
            shortLabel="비밀번호"
            label="비밀번호를 입력해주세요"
            type="password"
            isActive
            value={values.password}
            onChange={handleChange('password')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePasswordLogin();
            }}
            errorMessage={errors.password}
          />
        )}

        {errors.form && (
          <p className="font-bold text-[18px] text-error-red">{errors.form}</p>
        )}
      </div>

      <div className="mb-26.5 flex flex-col gap-3">
        <button
          type="button"
          onClick={
            mode === 'password' ? handlePasswordLogin : handleSendMagicLink
          }
          disabled={isLoading}
          className={cn(
            'w-full rounded-[10px] bg-main-green py-2.5 text-[28px] text-white transition-all active:scale-95',
            'disabled:cursor-not-allowed disabled:bg-gray-300',
          )}
        >
          {mode === 'password' ? '로그인' : '링크 발송'}
        </button>

        <button
          type="button"
          onClick={() =>
            switchMode(mode === 'password' ? 'magic-link' : 'password')
          }
          className="text-center text-[16px] text-gray-400 underline underline-offset-2"
        >
          {mode === 'password' ? '매직링크로 로그인' : '비밀번호로 로그인'}
        </button>
      </div>
    </div>
  );
}
