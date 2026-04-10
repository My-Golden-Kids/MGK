'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';
import PetSettingCard from '@/components/settings/PetSettingCard';
import { fetchPets } from '@/features/settings/api/petSettingsApi';
import type { PetSummary } from '@/features/settings/types/petSettings';

type MenuRowProps = {
  label: string;
  onClick?: () => void;
  rightSlot?: ReactNode;
};

const text = {
  addPet: '+ 반려동물 추가하기',
  alarmSetting: '알람 설정',
  alarmOn: '켜기',
  alarmOff: '끄기',
  changePassword: '비밀번호 변경',
  logout: '로그아웃',
  withdraw: '회원탈퇴',
  dog: '강아지',
  cat: '고양이',
} as const;

const SPECIES_LABEL: Record<string, string> = {
  dog: text.dog,
  cat: text.cat,
};

function AlarmToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${text.alarmSetting} ${enabled ? text.alarmOn : text.alarmOff}`}
      onClick={onToggle}
      className={`relative inline-flex h-10 w-[6rem] cursor-pointer items-center rounded-full px-1.5 transition-colors md:h-12 md:w-[6.9rem] lg:h-13 lg:w-[7.4rem] ${
        enabled ? 'bg-[#16B364]' : 'bg-[#EE3124]'
      }`}
    >
      <span
        className={`flex w-full items-center font-bold text-sm text-white transition-all md:text-base lg:text-lg ${
          enabled
            ? 'justify-start pl-2 sm:pl-2.5 md:pl-3'
            : 'justify-end pr-2.5 sm:pr-3 md:pr-3.5'
        }`}
      >
        {enabled ? text.alarmOn : text.alarmOff}
      </span>
      <span
        className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-sm transition-all sm:left-1.5 sm:h-8 sm:w-8 md:top-1.5 md:h-9 md:w-9 lg:h-10 lg:w-10 ${
          enabled
            ? 'left-[2.85rem] sm:left-[3.2rem] md:left-[3.8rem] lg:left-[4rem]'
            : 'left-1'
        }`}
      />
    </button>
  );
}

function MenuRow({ label, onClick, rightSlot }: MenuRowProps) {
  const labelClassName =
    'font-medium text-[#222222] text-[1.08rem] sm:text-[1.28rem] md:text-[1.6rem] lg:text-[1.85rem]';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[64px] w-full items-center justify-between border-[#9D9D9D] border-b py-3 text-left md:min-h-[76px] md:py-4 lg:min-h-[84px] lg:py-5"
      >
        <span className={labelClassName}>{label}</span>
        {rightSlot}
      </button>
    );
  }

  return (
    <div className="flex min-h-[64px] w-full items-center justify-between border-[#9D9D9D] border-b py-3 text-left md:min-h-[76px] md:py-4 lg:min-h-[84px] lg:py-5">
      <span className={labelClassName}>{label}</span>
      {rightSlot}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [pets, setPets] = useState<PetSummary[]>([]);

  useEffect(() => {
    fetchPets().then((result) => {
      if (result.ok && result.pets) {
        setPets(result.pets);
      }
    });
  }, []);

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    signOut({ callbackUrl: '/login' });
  };

  const menuItems = useMemo(
    () => [
      {
        label: text.changePassword,
        onClick: () => router.push('/settings/changePassword'),
      },
      {
        label: text.logout,
        onClick: () => setIsLogoutModalOpen(true),
      },
      {
        label: text.withdraw,
        onClick: () => router.push('/settings/deleteAccount'),
      },
    ],
    [router],
  );

  const handleAddPet = () => {
    router.push('/settings/pets/0');
  };

  const handleEditPet = (petId: number) => {
    router.push(`/settings/pets/${petId}`);
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-transparent">
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        buttonVariant="double"
        confirmText="네"
        cancelText="아니오"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      >
        <div className="mx-auto my-0 flex w-full max-w-[200px] flex-col items-center justify-center gap-3 px-2 py-6 md:my-4 md:max-w-[296px] md:gap-4 md:py-8 lg:my-5 lg:max-w-[344px] lg:gap-5 lg:py-10">
          <div className="flex min-h-[132px] w-full flex-col items-center justify-center md:min-h-[164px] lg:min-h-[196px]">
            <p className="font-semibold text-[#111111] text-[30px] leading-none md:text-[40px] lg:text-[50px]">
              로그아웃
            </p>
            <p className="mt-3 text-[#222222] text-[30px] leading-none md:mt-4 md:text-[40px] lg:mt-5 lg:text-[50px]">
              하시겠습니까?
            </p>
          </div>
        </div>
      </Modal>

      <main className="flex flex-1 flex-col px-5 pt-3 sm:px-6 sm:pt-4 md:px-8 md:pt-5 lg:px-10 lg:pt-6">
        <div className="pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <BackButton onClick={() => console.log('back')} />
        </div>

        <section className="space-y-4 md:space-y-5 lg:space-y-6">
          <div className="space-y-2">
            {pets.map((pet) => (
              <PetSettingCard
                key={pet.id}
                name={pet.name}
                age={pet.age ?? '-'}
                type={
                  pet.species
                    ? (SPECIES_LABEL[pet.species] ?? pet.species)
                    : '-'
                }
                onEdit={() => handleEditPet(pet.id)}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddPet}
              className="text-right font-semibold text-[#222222] text-[1.2rem] md:text-[1.45rem] lg:text-[1.7rem]"
            >
              {text.addPet}
            </button>
          </div>
        </section>

        <div className="min-h-24 flex-1 md:min-h-36 lg:min-h-44" />

        <section className="pb-6 md:pb-8 lg:pb-10">
          <MenuRow
            label={text.alarmSetting}
            rightSlot={
              <AlarmToggle
                enabled={isAlarmEnabled}
                onToggle={() => setIsAlarmEnabled((prev) => !prev)}
              />
            }
          />
          {menuItems.map((item) => (
            <MenuRow
              key={item.label}
              label={item.label}
              onClick={item.onClick}
            />
          ))}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
