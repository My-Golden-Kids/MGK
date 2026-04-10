'use client';

import { ImageUp } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import BackButton from '@/components/common/BackButton';
import { BottomNavigation } from '@/components/common/BottomNavigation';
import { Button } from '@/components/common/Button';
import {
  createPet,
  fetchPet,
  updatePet,
  uploadPetImage,
} from '@/features/settings/api/petSettingsApi';

type PetType = '강아지' | '고양이';
type PetSize = '소형' | '중형' | '대형';

type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

const petTypeOptions: SegmentOption<PetType>[] = [
  { label: '강아지', value: '강아지' },
  { label: '고양이', value: '고양이' },
];

const petSizeOptions: SegmentOption<PetSize>[] = [
  { label: '소형', value: '소형' },
  { label: '중형', value: '중형' },
  { label: '대형', value: '대형' },
];

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl bg-[#F1F1F1] p-1">
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-w-[5.3rem] cursor-pointer rounded-xl px-4 py-2 font-semibold text-lg transition-colors md:min-w-[6rem] md:px-5 md:text-xl ${
              isSelected
                ? 'bg-white text-[#1E1E1E] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#8A8A8A]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams<{ petId: string }>();
  const petId = Array.isArray(params.petId) ? params.petId[0] : params.petId;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [type, setType] = useState<PetType>('강아지');
  const [size, setSize] = useState<PetSize>('소형');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isNew = petId === '0';

  useEffect(() => {
    if (isNew) return;
    fetchPet(Number(petId)).then((result) => {
      if (result.ok && result.pet) {
        const pet = result.pet;
        setName(pet.name);
        setAge(pet.age != null ? String(pet.age) : '');
        setType(pet.species ?? '강아지');
        setSize(pet.size ?? '소형');
        setSavedImageUrl(pet.imageUrl);
        if (pet.imageUrl) setPreviewImage(pet.imageUrl);
      }
    });

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [isNew, petId]);

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextPreviewUrl;
    setSelectedImageFile(file);
    setPreviewImage(nextPreviewUrl);
    setErrorMessage(null);

    setIsLoading(true);
    const result = await uploadPetImage(file);
    setIsLoading(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage ?? '이미지 업로드에 실패했어요.');
      setTimeout(() => setErrorMessage(null), 3000);
      setSelectedImageFile(null);
      setPreviewImage(savedImageUrl);
      return;
    }

    setSavedImageUrl(result.path ?? null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    let imageUrl = savedImageUrl;
    if (selectedImageFile) {
      const uploadResult = await uploadPetImage(selectedImageFile);
      if (!uploadResult.ok) {
        setErrorMessage(
          uploadResult.errorMessage ?? '이미지 업로드에 실패했어요.',
        );
        setTimeout(() => setErrorMessage(null), 3000);
        setIsLoading(false);
        return;
      }
      imageUrl = uploadResult.path ?? null;
      setSavedImageUrl(imageUrl);
      setSelectedImageFile(null);
    }

    const formParams = {
      name,
      age: Number(age) || 0,
      species: type,
      size,
      imageUrl,
    };
    const result = isNew
      ? await createPet(formParams)
      : await updatePet({ petId: Number(petId), ...formParams });

    setIsLoading(false);
    router.back();

    if (!result.ok) {
      setErrorMessage(result.errorMessage ?? '저장에 실패했어요.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#ffffff]">
      <main className="flex flex-1 flex-col px-5 pt-3 sm:px-6 sm:pt-4 md:px-8 md:pt-5 lg:px-10 lg:pt-6">
        <div className="pb-4 sm:pb-5 md:pb-6">
          <BackButton />
        </div>

        <section className="flex flex-1 flex-col">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleProfileImageClick}
              className="group relative flex h-52 w-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full bg-[#E5E5E5] text-center transition-transform hover:scale-[1.01] md:h-60 md:w-60 lg:h-64 lg:w-64"
            >
              {previewImage ? (
                <>
                  <Image
                    src={previewImage}
                    alt="반려동물 프로필 미리보기"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 px-4 py-3 font-medium text-sm text-white md:text-base">
                    눌러서 프로필 이미지를 변경해요
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 px-6 text-[#222222]">
                  <ImageUp
                    className="h-16 w-16 md:h-20 md:w-20"
                    strokeWidth={1.7}
                  />
                  <span className="font-semibold text-[1.1rem] leading-snug md:text-[1.3rem]">
                    눌러서 프로필
                    <br />
                    이미지를 변경해요
                  </span>
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageChange}
            />
          </div>

          <div className="mt-8 space-y-5 md:mt-10 md:space-y-6 lg:mt-12 lg:space-y-7">
            <div>
              <label
                htmlFor="pet-name"
                className="mb-2 block font-bold text-[#222222] text-lg md:text-xl lg:text-2xl"
              >
                반려동물 이름
              </label>
              <input
                id="pet-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full cursor-pointer border-[#2A2A2A] border-b-2 bg-transparent pb-2 font-medium text-[#222222] text-[2rem] outline-none placeholder:text-[#B2B2B2] md:text-[2.35rem] lg:text-[2.7rem]"
                placeholder="반려동물 이름을 입력해요"
              />
            </div>

            <div>
              <label
                htmlFor="pet-age"
                className="mb-2 block font-bold text-[#222222] text-lg md:text-xl lg:text-2xl"
              >
                나이
              </label>
              <div className="flex items-end gap-3 border-[#2A2A2A] border-b-2 pb-1.5">
                <input
                  id="pet-age"
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(event) =>
                    setAge(event.target.value.replace(/[^0-9]/g, ''))
                  }
                  className="w-24 cursor-pointer bg-transparent font-medium text-[#222222] text-[2rem] outline-none placeholder:text-[#B2B2B2] md:w-28 md:text-[2.35rem] lg:text-[2.7rem]"
                  placeholder="0"
                />
                <span className="pb-1 font-medium text-[#9A9A9A] text-[1.7rem] md:text-[2rem] lg:text-[2.2rem]">
                  살
                </span>
              </div>
            </div>

            <div>
              <p className="mb-2 font-bold text-[#222222] text-lg md:text-xl lg:text-2xl">
                종류
              </p>
              <SegmentedControl
                options={petTypeOptions}
                value={type}
                onChange={setType}
              />
            </div>

            <div>
              <p className="mb-2 font-bold text-[#222222] text-lg md:text-xl lg:text-2xl">
                사이즈
              </p>
              <SegmentedControl
                options={petSizeOptions}
                value={size}
                onChange={setSize}
              />
            </div>
          </div>

          {errorMessage && (
            <p className="mt-4 text-center font-medium text-red-500 text-sm md:text-base">
              {errorMessage}
            </p>
          )}

          <div className="mt-10 flex justify-center pb-8 md:mt-12 md:pb-10 lg:mt-14">
            <div className="w-full max-w-[12rem] md:max-w-[13rem] lg:max-w-[14rem]">
              <Button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="w-full rounded-2xl py-3 font-bold text-[1.9rem] shadow-none disabled:opacity-60 md:rounded-3xl md:py-3.5 md:text-[2rem] lg:text-[2.1rem]"
              >
                {isLoading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
