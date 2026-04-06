"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HomePromptBubble from "@/components/home/HomePromptBubble";
import SelectedPetProfile from "@/components/home/SelectedPetProfile";
import { BottomNavigation } from "@/components/common/BottomNavigation";

const pets = [
  {
    id: 1,
    name: "돌",
    imageUrl: "/images/pet/dolmeng1.jpeg",
  },
  {
    id: 2,
    name: "멩",
    imageUrl: "/images/pet/dolmeng2.jpeg",
  },
  {
    id: 3,
    name: "이",
    imageUrl: "/images/pet/dolmeng3.jpeg",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedPetId, setSelectedPetId] = useState<number | string>(1);
  const [showBubble, setShowBubble] = useState(true);

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFFFFF]">
      <main className="flex-1 px-4 pt-6 pb-4">
        <header className="mb-4 flex justify-end">
          <Link
            href="/settings"
            className="cursor-pointer text-[24px] font-extrabold leading-none text-black"
          >
            설정
          </Link>
        </header>

        <section className="mb-5">
          <div className={showBubble ? "" : "invisible"}>
            <HomePromptBubble
              message={`주인님! 저에 대해\n더 알려주세요!`}
              showAnswerButtons={true}
              onYesClick={() => router.push("/settings")}
              onNoClick={() => setShowBubble(false)}
              yesLabel="O"
              noLabel="X"
            />
          </div>
        </section>

        <section className="mb-6">
          <SelectedPetProfile
            pets={pets}
            selectedPetId={selectedPetId}
            onChange={setSelectedPetId}
            onSelectedClick={() => router.push("/home/talk")}
          />
        </section>

        <section className="mb-8 flex justify-center">
          <div className="flex h-[54px] w-full max-w-[330px] overflow-hidden rounded-full border-2 border-[#25C3A8] bg-white">
            <button
              type="button"
              onClick={() => router.push("/home/talk")}
              className="flex flex-1 cursor-pointer items-center justify-center bg-[#25C3A8] text-[18px] font-extrabold text-white"
            >
              말하기
            </button>
            <button
              type="button"
              className="flex flex-1 cursor-pointer items-center justify-center bg-white text-[18px] font-extrabold text-[#25C3A8]"
            >
              직접입력
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border-2 border-[#25C3A8] bg-white px-4 py-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-[20px] font-extrabold leading-tight text-[#0DA892]">
              이번달 소비
            </h2>
            <p className="text-right text-[22px] font-extrabold leading-tight text-black">
              20,000,000원
            </p>
          </div>

          <p className="mb-1 text-[18px] font-bold leading-snug text-black">
            <span className="text-[#0DA892]">병원</span>에서 가장 많이 사용해요
          </p>

          <p className="mb-5 text-[18px] font-bold leading-snug text-black">
            하나 펫 보험 가입하면, <span className="text-[#0DA892]">80</span>
            만원 할인 가능
          </p>

          <button
            type="button"
            onClick={() => router.push("/reports")}
            className="flex h-[56px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#25C3A8] text-[20px] font-extrabold text-white"
          >
            리포트 보러가기
          </button>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
