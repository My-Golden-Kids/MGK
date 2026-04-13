import { Button } from '@/components/common/Button';

export interface PetSettingCardProps {
  name: string;
  age: number | string;
  type: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PetSettingCard({
  name,
  age,
  type,
  onEdit,
  onDelete,
}: PetSettingCardProps) {
  return (
    <div
      className="flex w-full items-center justify-between border-black border-b pt-2 pb-4 md:pt-4 md:pb-6 lg:pt-5 lg:pb-8"
      style={{ borderBottomWidth: 'clamp(1.5px, 0.5vw, 3.5px)' }}
    >
      <div className="flex flex-col gap-3 md:gap-4 lg:gap-6">
        <h2 className="font-bold text-3xl text-black tracking-tight md:text-4xl lg:text-5xl">
          {name}
        </h2>
        <p className="text-black text-xl md:text-2xl lg:text-3xl">
          나이 ({age}살) / {type}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-3 lg:gap-4">
        <Button
          type="button"
          onClick={onEdit}
          className="mx-0 h-auto rounded-[14px] bg-[#00A389] px-5 py-2.5 font-medium text-white text-xl shadow-none hover:bg-[#008f78] md:rounded-2xl md:px-7 md:py-3.5 md:text-2xl lg:rounded-3xl lg:px-9 lg:py-4 lg:text-3xl"
        >
          수정
        </Button>
        <Button
          type="button"
          onClick={onDelete}
          className="mx-0 h-auto rounded-[14px] bg-[#EE3124] px-5 py-2.5 font-medium text-white text-xl shadow-none hover:bg-[#d72b20] md:rounded-2xl md:px-7 md:py-3.5 md:text-2xl lg:rounded-3xl lg:px-9 lg:py-4 lg:text-3xl"
        >
          삭제
        </Button>
      </div>
    </div>
  );
}
