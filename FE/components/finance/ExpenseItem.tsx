import { Hospital, Bone, MoreHorizontal, LucideIcon } from "lucide-react";

export type ExpenseType = "medical" | "food" | "other";

export interface ExpenseItemProps {
  title: string;
  category: string;
  amount: number;
  type: ExpenseType;
}

const typeConfig: Record<ExpenseType, { icon: LucideIcon; bgColor: string }> = {
  medical: {
    icon: Hospital,
    bgColor: "bg-[#25C8A8]",
  },
  food: {
    icon: Bone,
    bgColor: "bg-[#FACC15]",
  },
  other: {
    icon: MoreHorizontal,
    bgColor: "bg-[#9CA3AF]",
  },
};

export default function ExpenseItem({
  title,
  category,
  amount,
  type,
}: ExpenseItemProps) {
  const { icon: Icon, bgColor } = typeConfig[type];

  return (
    <div className="flex w-full items-center justify-between py-4">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${bgColor} text-white`}
        >
          <Icon className="h-7 w-7" />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[20px] font-bold leading-[1.25] text-gray-900">
            {title}
          </span>
          <span className="text-[16px] leading-[1.25] text-gray-500">
            {category}
          </span>
        </div>
      </div>

      <div className="ml-5 shrink-0">
        <span className="text-[20px] font-bold leading-none text-black">
          -{amount.toLocaleString()}원
        </span>
      </div>
    </div>
  );
}
