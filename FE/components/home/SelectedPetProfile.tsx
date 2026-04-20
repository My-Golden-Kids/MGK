"use client";

import { useMemo, useRef } from "react";
import PetProfileImage from "@/components/home/pet/PetProfileImage";

export type Pet = {
  id: number;
  name: string;
  imageUrl?: string | null;
};

type SelectedPetProfileProps = {
  pets?: Pet[] | null;
  selectedPetId?: number | null;
  onChange: (petId: number) => void;
  onSelectedClick?: (petId: number) => void;
};

type PositionStyle = {
  translateX: string;
  scale: string;
  zIndex: number;
  opacity: string;
};

const POSITION_MAP: Record<number, PositionStyle> = {
  [-2]: {
    translateX: "-90%",
    scale: "0.40",
    zIndex: 30,
    opacity: "0.8",
  },
  [-1]: {
    translateX: "-55%",
    scale: "0.65",
    zIndex: 40,
    opacity: "0.9",
  },
  0: {
    translateX: "0%",
    scale: "1",
    zIndex: 50,
    opacity: "1",
  },
  1: {
    translateX: "55%",
    scale: "0.65",
    zIndex: 40,
    opacity: "0.9",
  },
  2: {
    translateX: "90%",
    scale: "0.40",
    zIndex: 30,
    opacity: "0.8",
  },
};

export default function SelectedPetProfile({
  pets,
  selectedPetId,
  onChange,
  onSelectedClick,
}: SelectedPetProfileProps) {
  const isPets = pets ?? [];
  const isSelectedId = selectedPetId ?? isPets[0]?.id ?? null;

  const pointerStartX = useRef<number | null>(null);
  const pointerEndX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const selectedIndex = useMemo(() => {
    if (!isPets.length || isSelectedId == null) return -1;
    return isPets.findIndex((pet) => pet.id === isSelectedId);
  }, [isPets, isSelectedId]);

  const moveToPrev = () => {
    if (isPets.length <= 1 || selectedIndex < 0) return;
    const prevIndex = (selectedIndex - 1 + isPets.length) % isPets.length;
    onChange(isPets[prevIndex].id);
  };

  const moveToNext = () => {
    if (isPets.length <= 1 || selectedIndex < 0) return;
    const nextIndex = (selectedIndex + 1) % isPets.length;
    onChange(isPets[nextIndex].id);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = e.clientX;
    pointerEndX.current = null;
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;

    pointerEndX.current = e.clientX;

    const distance = Math.abs(pointerStartX.current - pointerEndX.current);
    if (distance > 5) {
      isDragging.current = true;
    }
  };

  const handlePointerUp = () => {
    if (pointerStartX.current === null || pointerEndX.current === null) {
      pointerStartX.current = null;
      pointerEndX.current = null;
      isDragging.current = false;
      return;
    }

    const distance = pointerStartX.current - pointerEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      moveToNext();
    } else if (distance < -minSwipeDistance) {
      moveToPrev();
    }

    pointerStartX.current = null;
    pointerEndX.current = null;
    isDragging.current = false;
  };

  const handlePointerCancel = () => {
    pointerStartX.current = null;
    pointerEndX.current = null;
    isDragging.current = false;
  };

  const visibleOffsets = useMemo(() => {
    const total = isPets.length;

    if (total <= 0) return [];
    if (total === 1) return [0];
    if (total === 2) return [0, 1];
    if (total === 3) return [-1, 0, 1];
    if (total === 4) return [-1, 0, 1, 2];

    return [-2, -1, 0, 1, 2];
  }, [isPets.length]);

  const visiblePets = useMemo(() => {
    if (selectedIndex < 0 || isPets.length === 0) return [];

    return visibleOffsets.map((offset) => {
      const petIndex = (selectedIndex + offset + isPets.length) % isPets.length;
      return {
        pet: isPets[petIndex],
        offset,
      };
    });
  }, [isPets, selectedIndex, visibleOffsets]);

  if (!isPets.length) {
    return (
      <section className="w-full overflow-visible">
        <div className="flex h-[250px] items-center justify-center md:h-[290px] lg:h-[340px]">
          <PetProfileImage
            onClick={() => onSelectedClick?.(0)}
            className="h-[220px] w-[220px] cursor-pointer md:h-[260px] md:w-[260px] lg:h-[300px] lg:w-[300px]"
          />
        </div>
      </section>
    );
  }

  if (selectedIndex < 0) return null;

  return (
    <section className="w-full overflow-visible">
      <div
        className="relative mx-auto h-[250px] w-full overflow-visible md:h-[290px] lg:h-[340px]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {visiblePets.map(({ pet, offset }) => {
          const style = POSITION_MAP[offset];
          const isSelected = offset === 0;

          return (
            <div
              key={pet.id}
              className="absolute top-1/2 left-1/2 transition-all duration-300 ease-out"
              style={{
                transform: `translate(-50%, -50%) translateX(${style.translateX}) scale(${style.scale})`,
                zIndex: style.zIndex,
                opacity: Number(style.opacity),
              }}
            >
              <PetProfileImage
                imageUrl={pet.imageUrl ?? undefined}
                onClick={() => {
                  if (isDragging.current) return;

                  if (isSelected) {
                    onSelectedClick?.(pet.id);
                    return;
                  }

                  onChange(pet.id);
                }}
                className="h-[220px] w-[220px] cursor-pointer md:h-[260px] md:w-[260px] lg:h-[300px] lg:w-[300px]"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
