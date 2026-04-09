'use client';

import { BottomNavigation } from "@/components/common/BottomNavigation";
import HomePromptBubble from "@/components/home/HomePromptBubble";
import SelectedPetProfile from "@/components/home/SelectedPetProfile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getMedicalRecordApiBaseUrl,
  getStoredMedicalPetId,
  storeSelectedPetId,
} from '@/lib/medical-record';

type Pet = {
  id: number;
  name: string;
  imageUrl?: string | null;
};

type SpendingData = {
  monthlyAmount: string;
  primaryCategory: string;
  summary: string;
  savingsHint: string;
};

const pets: Pet[] = [
  {
    id: 1,
    name: "돌",
    imageUrl: "",
  },
  {
    id: 2,
    name: "멩",
    imageUrl: "/images/pet/dolmeng2.jpeg",
  },
];

const spendingData: SpendingData | null = {
  monthlyAmount: "20,000,000원",
  primaryCategory: "병원",
  summary: "에서 가장 많이 사용해요",
  savingsHint: "하나 펫 보험 가입하면, 80만원 할인 가능",
};

export default function HomePage() {
  const router = useRouter();
  const [selectedPetId, setSelectedPetId] = useState<number | string>(1);
  const [showBubble, setShowBubble] = useState(true);
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const fetchPets = async () => {
      try {
        const response = await fetch(
          `${getMedicalRecordApiBaseUrl()}/api/pets`,
        );

        if (!response.ok) {
          throw new Error('반려동물 목록 조회에 실패했습니다.');
        }

        const data = (await response.json()) as Array<{
          id: number;
          name: string;
          imageUrl?: string | null;
        }>;

        if (isCancelled || data.length === 0) {
          return;
        }

        const mappedPets = data.map((pet) => ({
          id: pet.id,
          name: pet.name,
          imageUrl: pet.imageUrl || '/images/pet/dolmeng1.jpeg',
        }));

        setPets(mappedPets);

        const storedPetId = getStoredMedicalPetId();
        const matchedPet = mappedPets.find((pet) => pet.id === storedPetId);
        const nextPetId = matchedPet?.id ?? mappedPets[0].id;

        setSelectedPetId(nextPetId);
        storeSelectedPetId(nextPetId);
      } catch (error) {
        console.error(error);
      }
    };

    void fetchPets();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    storeSelectedPetId(selectedPetId);
  }, [selectedPetId]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#FFFFFF]">
      <main className="flex-1 px-4 pt-6 pb-4">
        <header className="mb-4 flex justify-end">
          <Link
            href="/settings"
            className="cursor-pointer font-extrabold text-[24px] text-black leading-none"
          >
            설정
          </Link>
        </header>

        <section className="mb-5">
          <div className={showBubble ? '' : 'invisible'}>
            <HomePromptBubble
              message={`주인님! 저에 대해\n더 알려주세요!`}
              showAnswerButtons={true}
              onYesClick={() => router.push("/onboarding/7")}
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
            onSelectedClick={() => router.push('/home/talk')}
          />
        </section>

        <section className="mb-8 flex justify-center">
          <div className="flex h-[54px] w-full max-w-[330px] overflow-hidden rounded-full border-2 border-[#25C3A8] bg-white">
            <button
              type="button"
              onClick={() => router.push("/home/talk")}
              className="flex flex-1 cursor-pointer items-center justify-center bg-[#25C3A8] font-extrabold text-[18px] text-white"
            >
              말하기
            </button>
            <button
              type="button"
              className="flex flex-1 cursor-pointer items-center justify-center bg-white font-extrabold text-[#25C3A8] text-[18px]"
            >
              직접입력
            </button>
          </div>
        </section>

        {spendingData ? (
          <section className="rounded-[24px] border-2 border-[#25C3A8] bg-white px-4 py-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-[20px] font-extrabold leading-tight text-[#0DA892]">
                이번달 소비
              </h2>
              <p className="text-right text-[22px] font-extrabold leading-tight text-black">
                {spendingData.monthlyAmount}
              </p>
            </div>

            <p className="mb-1 text-[18px] font-bold leading-snug text-black">
              <span className="text-[#0DA892]">
                {spendingData.primaryCategory}
              </span>
              {spendingData.summary}
            </p>

            <p className="mb-5 text-[18px] font-bold leading-snug text-black">
              {spendingData.savingsHint}
            </p>

            <button
              type="button"
              onClick={() => router.push("/reports")}
              className="flex h-[56px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-[#25C3A8] text-[20px] font-extrabold text-white"
            >
              리포트 보러가기
            </button>
          </section>
        ) : (
          <section className="rounded-[24px] border-2 border-[#25C3A8] bg-white px-4 py-5">
            <div className="flex min-h-[176px] flex-col items-center justify-center text-center">
              <p className="mb-5 text-[20px] font-extrabold leading-tight text-[#0DA892]">
                아직 등록된 소비 데이터가 없어요!
              </p>

              <button
                type="button"
                onClick={() => router.push("/settings/pets/1")}
                className="flex h-[56px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-[12px] bg-[#25C3A8] px-4 text-[20px] font-extrabold text-white"
              >
                반려동물 등록하기
              </button>
            </div>
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
