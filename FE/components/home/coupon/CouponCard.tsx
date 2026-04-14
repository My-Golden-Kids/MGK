'use client';

export type CouponStatus = 'available' | 'used';
export type CouponBadgeType = 'discount' | 'free';

export type CouponCardProps = {
  categoryLabel: string;
  title: string;
  value: string;
  badgeType?: CouponBadgeType;
  status?: CouponStatus;
  onClick?: () => void;
};

export default function CouponCard({
  categoryLabel,
  title,
  value,
  badgeType = 'discount',
  status = 'available',
  onClick,
}: CouponCardProps) {
  const isUsed = status === 'used';
  const badgeText = badgeType === 'free' ? '무료\n쿠폰' : '할인\n쿠폰';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isUsed}
      className={`flex w-full overflow-hidden rounded-[12px] border border-[#CCCCCC] bg-white text-left transition md:rounded-[14px] lg:rounded-[16px] ${
        isUsed ? 'opacity-60' : 'hover:shadow-sm'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5 lg:p-6">
        <span className="text-[#808080] text-[17px] md:text-[21px] lg:text-[25px]">
          {categoryLabel}
        </span>

        <p className="line-clamp-2 font-semibold text-[20px] md:text-[24px] lg:text-[28px]">
          {title}
        </p>

        <p className="mt-3 font-bold text-[40px] text-[var(--color-main-green)] md:text-[44px] lg:text-[48px]">
          {value}
        </p>
      </div>

      <div
        className={`flex w-fit shrink-0 items-center justify-center px-11 text-center md:px-13 lg:px-15 ${
          isUsed ? 'bg-[#A9A9A9]' : 'bg-[var(--color-main-green)]'
        }`}
      >
        <span className="whitespace-pre-line text-[30px] text-white leading-[1.5] md:text-[34px] lg:text-[38px]">
          {badgeText}
        </span>
      </div>
    </button>
  );
}
