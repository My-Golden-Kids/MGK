"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomNavigation } from "@/components/common/BottomNavigation";
import { Button } from "@/components/common/Button";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleCurrentPasswordChange = (value: string) => {
    setCurrentPassword(value);
    clearError();
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    clearError();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    clearError();
  };

  const handleChangePasswordSuccess = () => {
    console.log("비밀번호 변경 요청");
  };

  const handleChangePassword = () => {
    if (!currentPassword.trim()) {
      setErrorMessage("현재 비밀번호를 입력해주세요.");
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage("변경할 비밀번호를 입력해주세요.");
      return;
    }

    if (!confirmPassword.trim()) {
      setErrorMessage("비밀번호 확인을 입력해주세요.");
      return;
    }

    if (currentPassword !== "1234") {
      setErrorMessage("현재 비밀번호가 올바르지 않습니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setErrorMessage("");
    handleChangePasswordSuccess();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#F8F8F6]">
      <main className="flex flex-1 flex-col px-5 pt-8 sm:px-6 sm:pt-10 md:px-8 md:pt-12 lg:px-10 lg:pt-14">
        <header className="pb-20 md:pb-24 lg:pb-28">
          <h1 className="font-bold text-[#111111] text-[2rem] md:text-[2.4rem] lg:text-[2.8rem]">
            비밀번호 변경
          </h1>
        </header>

        <section className="mx-auto w-full max-w-[340px] pb-8 md:max-w-[400px] md:pb-10 lg:max-w-[460px] lg:pb-12">
          <div className="space-y-9 md:space-y-10 lg:space-y-12">
            <div>
              <label
                htmlFor="current-password"
                className="mb-3 block font-bold text-[#1B1B1B] text-[1.55rem] md:text-[1.8rem] lg:text-[2rem]"
              >
                현재 비밀번호
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  handleCurrentPasswordChange(event.target.value)
                }
                placeholder="****************"
                className="w-full border-[#3C3C3C] border-b-2 bg-transparent pb-2 font-medium text-[#111111] text-[1.9rem] outline-none placeholder:text-gray-400 md:text-[2.15rem] lg:text-[2.35rem]"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="mb-3 block font-bold text-[#1B1B1B] text-[1.55rem] md:text-[1.8rem] lg:text-[2rem]"
              >
                변경할 비밀번호
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                  handleNewPasswordChange(event.target.value)
                }
                placeholder="****************"
                className="w-full border-[#3C3C3C] border-b-2 bg-transparent pb-2 font-medium text-[#111111] text-[1.9rem] outline-none placeholder:text-gray-400 md:text-[2.15rem] lg:text-[2.35rem]"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-3 block font-bold text-[#1B1B1B] text-[1.55rem] md:text-[1.8rem] lg:text-[2rem]"
              >
                비밀번호 확인
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  handleConfirmPasswordChange(event.target.value)
                }
                placeholder="****************"
                className="w-full border-[#3C3C3C] border-b-2 bg-transparent pb-2 font-medium text-[#111111] text-[1.9rem] outline-none placeholder:text-gray-400 md:text-[2.15rem] lg:text-[2.35rem]"
              />
              <p className="mt-4 min-h-[2rem] font-bold text-[#FF3B30] text-[1.35rem] md:text-[1.55rem] lg:text-[1.75rem]">
                {errorMessage}
              </p>
            </div>
          </div>

          <div className="mt-12 flex gap-4 md:mt-14 md:gap-5">
            <Button
              type="button"
              onClick={handleChangePassword}
              className="h-auto flex-1 rounded-[18px] bg-[#08B7A4] py-4 font-semibold text-[1.7rem] text-white shadow-none hover:bg-[#06a291] md:rounded-[20px] md:py-5 md:text-[2rem] lg:text-[2.25rem]"
            >
              변경하기
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-auto flex-1 rounded-[18px] border-[#AFAFAF] bg-white py-4 font-semibold text-[#222222] text-[1.7rem] shadow-none hover:bg-[#F4F4F4] md:rounded-[20px] md:py-5 md:text-[2rem] lg:text-[2.25rem]"
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
