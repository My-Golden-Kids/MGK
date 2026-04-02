import React from "react";
import { Button } from "@/components/common/Button";

export interface PetSettingCardProps {
  name: string;
  age: number | string;
  type: string;
  onEdit: () => void;
}

export default function PetSettingCard({
  name,
  age,
  type,
  onEdit,
}: PetSettingCardProps) {
  return (
    <div
      className="flex w-full items-center justify-between border-b border-black pb-4 pt-2 md:pb-6 md:pt-4 lg:pb-8 lg:pt-5"
      style={{ borderBottomWidth: "clamp(1.5px, 0.5vw, 3.5px)" }}
    >
      <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
        <h2 className="text-3xl font-bold tracking-tight text-black md:text-4xl lg:text-5xl">
          {name}
        </h2>
        <p className="text-xl text-black md:text-2xl lg:text-3xl">
          나이 ({age}살) / {type}
        </p>
      </div>
      <Button
        onClick={onEdit}
        className="mx-0 h-auto rounded-[14px] bg-[#00A389] px-6 py-2.5 text-xl font-medium text-white shadow-none hover:bg-[#008f78] md:rounded-2xl md:px-8 md:py-3.5 md:text-2xl lg:rounded-3xl lg:px-10 lg:py-4 lg:text-3xl"
      >
        수정
      </Button>
    </div>
  );
}
