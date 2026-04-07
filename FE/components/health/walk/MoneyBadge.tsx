type MoneyBadgeProps = {
  amount: number; // 하나머니
  className?: string; // 추가 설정사항
};

export default function MoneyBadge({
  amount,
  className = '',
}: MoneyBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-[#F9E8B5] px-2.5 py-1.5 md:px-3.5 md:py-2 lg:px-4.5 lg:py-2 ${className}
      `}
    >
      <img
        src="/images/health/icon_hana_money.png"
        alt="하나머니 아이콘"
        className="h-5 w-5 sm:h-5 sm:w-5 md:h-6.5 md:w-6.5 lg:h-8 lg:w-8"
      />

      <span className="font-bold text-[20px] text-black leading-none sm:text-[20px] md:text-[28px] lg:text-[34px]">
        {amount.toLocaleString()}
      </span>
    </div>
  );
}
