'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import Modal from '@/components/common/Modal';
import PetSettingCard from '@/components/settings/PetSettingCard';
import { deletePet, fetchPets } from '@/features/settings/api/petSettingsApi';
import type { PetSummary } from '@/features/settings/types/petSettings';
import { getStoredAlarmEnabled, storeAlarmEnabled } from '@/lib/alarm-setting';
import {
  SELECTED_PET_ID_STORAGE_KEY,
  storeSelectedPetId,
} from '@/lib/medical-record';
import { logout } from '@/lib/server-fetch';

type MenuRowProps = {
  label: string;
  onClick?: () => void;
  rightSlot?: ReactNode;
  withBorder?: boolean;
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
  deletePet: '삭제',
  deletingPet: '삭제 중',
  deletePetTitle: '정말 펫 등록정보를',
  deletePetDescription: '삭제하시겠습니까?',
} as const;

const SPECIES_LABEL: Record<string, string> = {
  dog: text.dog,
  cat: text.cat,
};

function syncSelectedPetStorageAfterDelete(
  deletedPetId: number,
  nextPets: PetSummary[],
) {
  if (typeof window === 'undefined') {
    return;
  }

  const storedPetId =
    window.localStorage.getItem(SELECTED_PET_ID_STORAGE_KEY) ??
    window.sessionStorage.getItem(SELECTED_PET_ID_STORAGE_KEY);

  if (storedPetId !== String(deletedPetId)) {
    return;
  }

  const nextPet = nextPets[0];

  if (nextPet) {
    storeSelectedPetId(nextPet.id);
    return;
  }

  window.localStorage.removeItem(SELECTED_PET_ID_STORAGE_KEY);
  window.sessionStorage.removeItem(SELECTED_PET_ID_STORAGE_KEY);
}

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
      className={`relative inline-flex h-10 w-[6rem] cursor-pointer items-center rounded-full px-1.5 transition-[filter,colors] hover:brightness-105 md:h-12 md:w-[6.9rem] lg:h-13 lg:w-[7.4rem] ${
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
        className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-sm transition-all sm:h-8 sm:w-8 md:top-1.5 md:h-9 md:w-9 lg:h-10 lg:w-10 ${
          enabled ? 'right-1 sm:right-1.5 md:right-1.5' : 'left-1 sm:left-1.5'
        }`}
      />
    </button>
  );
}

function MenuRow({
  label,
  onClick,
  rightSlot,
  withBorder = true,
}: MenuRowProps) {
  const labelClassName =
    'font-medium text-[#222222] text-[1.08rem] sm:text-[1.28rem] md:text-[1.6rem] lg:text-[1.85rem]';
  const rowBorderClassName = withBorder ? 'border-[#9D9D9D] border-b' : '';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex min-h-[64px] w-full cursor-pointer items-center justify-between py-3 text-left transition-colors hover:bg-black/5 md:min-h-[76px] md:py-4 lg:min-h-[84px] lg:py-5 ${rowBorderClassName}`}
      >
        <span className={labelClassName}>{label}</span>
        {rightSlot}
      </button>
    );
  }

  return (
    <div
      className={`flex min-h-[64px] w-full items-center justify-between py-3 text-left md:min-h-[76px] md:py-4 lg:min-h-[84px] lg:py-5 ${rowBorderClassName}`}
    >
      <span className={labelClassName}>{label}</span>
      {rightSlot}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [deleteTargetPet, setDeleteTargetPet] = useState<PetSummary | null>(
    null,
  );
  const [isDeletingPet, setIsDeletingPet] = useState(false);
  const [deletePetErrorMessage, setDeletePetErrorMessage] = useState<
    string | null
  >(null);
  const [pets, setPets] = useState<PetSummary[]>([]);

  useEffect(() => {
    setIsAlarmEnabled(getStoredAlarmEnabled());
  }, []);

  useEffect(() => {
    fetchPets().then((result) => {
      if (result.ok && result.pets) {
        setPets(result.pets);
      }
    });
  }, []);

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
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

  const handleOpenDeletePetModal = (pet: PetSummary) => {
    setDeleteTargetPet(pet);
    setDeletePetErrorMessage(null);
  };

  const handleCloseDeletePetModal = () => {
    if (isDeletingPet) {
      return;
    }

    setDeleteTargetPet(null);
    setDeletePetErrorMessage(null);
  };

  const handleConfirmDeletePet = async () => {
    if (!deleteTargetPet || isDeletingPet) {
      return;
    }

    const deletingPetId = deleteTargetPet.id;
    setIsDeletingPet(true);
    setDeletePetErrorMessage(null);

    const result = await deletePet(deletingPetId);
    setIsDeletingPet(false);

    if (!result.ok) {
      setDeletePetErrorMessage(
        result.errorMessage ?? '반려동물 삭제에 실패했어요.',
      );
      return;
    }

    const nextPets = pets.filter((pet) => pet.id !== deletingPetId);
    setPets(nextPets);
    syncSelectedPetStorageAfterDelete(deletingPetId, nextPets);
    setDeleteTargetPet(null);
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

      <Modal
        isOpen={deleteTargetPet !== null}
        onClose={handleCloseDeletePetModal}
        closeOnOverlay={!isDeletingPet}
        buttonVariant="double"
        confirmText={isDeletingPet ? text.deletingPet : '네'}
        cancelText="아니오"
        onConfirm={handleConfirmDeletePet}
        onCancel={handleCloseDeletePetModal}
        primaryButtonClassname="bg-[#EE3124] hover:bg-[#d72b20]"
      >
        <div className="mx-auto my-0 flex w-full max-w-[240px] flex-col items-center justify-center px-2 py-6 text-center md:my-4 md:max-w-[320px] md:py-8 lg:my-5 lg:max-w-[360px] lg:py-10">
          <div className="flex min-h-[132px] w-full flex-col items-center justify-center md:min-h-[164px] lg:min-h-[196px]">
            <p className="font-semibold text-[#111111] text-[26px] leading-tight md:text-[34px] lg:text-[42px]">
              {text.deletePetTitle}
            </p>
            <p className="mt-2 text-[#222222] text-[26px] leading-tight md:mt-3 md:text-[34px] lg:mt-4 lg:text-[42px]">
              {text.deletePetDescription}
            </p>
            {deletePetErrorMessage ? (
              <p className="mt-4 font-medium text-[#EE3124] text-[15px] leading-snug md:text-[17px] lg:text-[19px]">
                {deletePetErrorMessage}
              </p>
            ) : null}
          </div>
        </div>
      </Modal>

      <main className="flex flex-1 flex-col px-8 py-6">
        <div className="pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <BackButton
            useHistory={false}
            onClick={() => router.replace('/home')}
          />
        </div>

        <section className="space-y-4 px-5 md:space-y-5 lg:space-y-6">
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
                isDeath={pet.isDeath}
                onEdit={() => handleEditPet(pet.id)}
                onDelete={() => handleOpenDeletePetModal(pet)}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddPet}
              className="cursor-pointer text-right font-semibold text-[#222222] text-[1.2rem] transition-opacity hover:opacity-75 md:text-[1.45rem] lg:text-[1.7rem]"
            >
              {text.addPet}
            </button>
          </div>
        </section>

        <div className="min-h-24 flex-1 md:min-h-36 lg:min-h-44" />

        <section className="px-5">
          <MenuRow
            label={text.alarmSetting}
            rightSlot={
              <AlarmToggle
                enabled={isAlarmEnabled}
                onToggle={() =>
                  setIsAlarmEnabled((prev) => {
                    const nextValue = !prev;
                    storeAlarmEnabled(nextValue);
                    return nextValue;
                  })
                }
              />
            }
          />
          {menuItems.map((item, index) => (
            <MenuRow
              key={item.label}
              label={item.label}
              onClick={item.onClick}
              withBorder={index !== menuItems.length - 1}
            />
          ))}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
