type HealthMoneyBadgeProps = {
  amount: number; // 하나머니
  className?: string; // 추가 설정사항
};

export default function HealthMoneyBadge({
  amount,
  className = '',
}: HealthMoneyBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-[#F9E8B5] px-2.5 py-1.5 md:px-3.5 md:py-2 lg:px-4.5 lg:py-2.5 ${className}
      `}
    >
      <img
        src="/images/health/icon_hana_money.png"
        alt="하나머니 아이콘"
        className="h-3 w-3 md:h-4 md:w-4 lg:h-5 lg:w-5"
      />

      <span className="font-bold text-[14px] text-black leading-none md:text-[18px] lg:text-[22px]">
        {amount.toLocaleString()}
      </span>
    </div>
  );
}
