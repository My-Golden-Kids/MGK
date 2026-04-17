import Image from 'next/image';

type MoneyBadgeProps = {
  amount: number; // 하나머니
  className?: string; // 추가 설정사항
  href?: string;
};

export default function MoneyBadge({
  amount,
  className = '',
  href,
}: MoneyBadgeProps) {
  const content = (
    <>
      <Image
        src="/images/health/icon_hana_money.png"
        alt="하나머니 아이콘"
        width={32}
        height={32}
        className="h-5 w-5 sm:h-5 sm:w-5 md:h-6.5 md:w-6.5 lg:h-8 lg:w-8"
      />

      <span className="font-bold text-[20px] text-black leading-none sm:text-[20px] md:text-[28px] lg:text-[34px]">
        {amount.toLocaleString()}
      </span>
    </>
  );

  const classNames = `inline-flex items-center gap-2 rounded-full bg-[#F9E8B5] px-2.5 py-1.5 md:px-3.5 md:py-2 lg:px-4.5 lg:py-2 ${href ? 'cursor-pointer transition-opacity hover:opacity-85' : ''} ${className}`;

  if (!href) {
    return <div className={classNames}>{content}</div>;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={classNames}>
      {content}
    </a>
  );
}
