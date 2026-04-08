'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import InputField from '@/components/signup/InputField';
import { changePasswordWithCurrent } from '@/lib/auth';
import type { ChangePasswordWithCurrentValues } from '@/lib/validator';
import { validateChangePasswordField } from '@/lib/validator';

type FieldErrors = Partial<
  Record<keyof ChangePasswordWithCurrentValues, string>
>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const setFieldError = (field: keyof FieldErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    setFieldError(
      'currentPassword',
      validateChangePasswordField('currentPassword', value),
    );
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setFieldError(
      'newPassword',
      validateChangePasswordField('newPassword', value, { currentPassword }),
    );
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setFieldError(
      'passwordConfirm',
      validateChangePasswordField('passwordConfirm', value, { newPassword }),
    );
  };

  const handleChangePassword = async () => {
    const result = await changePasswordWithCurrent({
      currentPassword,
      newPassword,
      passwordConfirm: confirmPassword,
    });

    if (!result.ok) {
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
      } else {
        setErrors({ passwordConfirm: result.errorMessage ?? '' });
      }
      return;
    }

    router.back();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col px-5 pt-8 sm:px-6 sm:pt-10 md:px-8 md:pt-12 lg:px-10 lg:pt-14">
        <header className="pb-20 md:pb-24 lg:pb-28">
          <h1 className="font-bold text-[2rem] md:text-[2.4rem] lg:text-[2.8rem]">
            비밀번호 변경
          </h1>
        </header>

        <section className="mx-auto w-full max-w-85 pb-8 md:max-w-100 md:pb-10 lg:max-w-115 lg:pb-12">
          <div className="space-y-9 md:space-y-10 lg:space-y-12">
            <InputField
              key="currentPasswd"
              shortLabel="현재 비밀번호"
              label="현재 비밀번호"
              isActive={false}
              type="password"
              value={currentPassword}
              onChange={(e) => handleCurrentPasswordChange(e.target.value)}
              errorMessage={errors.currentPassword}
            />
            <InputField
              key="changePasswd"
              shortLabel="변경할 비밀번호"
              label="변경할 비밀번호"
              isActive={false}
              type="password"
              value={newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              errorMessage={errors.newPassword}
            />
            <InputField
              key="confrimPasswd"
              shortLabel="비밀번호 확인"
              label="비밀번호 확인"
              isActive={false}
              type="password"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              errorMessage={errors.passwordConfirm}
            />
          </div>

          <div className="mt-10 flex gap-3 sm:mt-12 sm:gap-4 md:mt-14 md:gap-6 lg:mt-16 lg:gap-7">
            <Button
              type="button"
              onClick={handleChangePassword}
              className="h-auto min-h-14.5 flex-[1.35] rounded-[16px] bg-main-green py-3.5 font-semibold text-[1.45rem] text-white shadow-none hover:brightness-110 sm:min-h-17 sm:rounded-[18px] sm:py-4 sm:text-[1.7rem] md:min-h-21 md:rounded-[22px] md:py-5.5 md:text-[2.2rem] lg:min-h-24 lg:rounded-[24px] lg:py-6.5 lg:text-[2.55rem]"
            >
              변경하기
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-auto min-h-14.5 flex-1 rounded-[16px] border-[#AFAFAF] bg-white py-3.5 font-semibold text-[#222222] text-[1.45rem] shadow-none hover:bg-[#F4F4F4] sm:min-h-[68px] sm:rounded-[18px] sm:py-4 sm:text-[1.7rem] md:min-h-21 md:rounded-[22px] md:py-5.5 md:text-[2.2rem] lg:min-h-24 lg:rounded-[24px] lg:py-6.5 lg:text-[2.55rem]"
            >
              취소
            </Button>
          </div>
        </section>

        <div className="flex-1" />
      </main>

      <BottomNavigation />
    </div>
  );
}
