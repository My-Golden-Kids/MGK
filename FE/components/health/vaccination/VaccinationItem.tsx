type VaccinationHistoryItem = {
  date: string;
  completed?: boolean;
};

type VaccinationItemProps = {
  title: string;
  totalCount: number;
  lastDate: string;
  nextDate: string;
  history: VaccinationHistoryItem[];
};

export default function VaccinationItem({
  title,
  totalCount,
  lastDate,
  nextDate,
  history,
}: VaccinationItemProps) {
  return (
    <div className="w-full rounded-[18px] bg-[#018D70] px-3 py-3 md:rounded-[22px] md:px-3.5 md:py-3.5 lg:rounded-[26px] lg:px-4 lg:py-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-bold text-[22px] text-white md:text-[26px] lg:text-[30px]">
          {title}
        </h4>

        <p className="text-right font-semibold text-[16px] text-white md:text-[20px] lg:text-[24px]">
          총 {totalCount}회 접종
        </p>
      </div>

      <div className="text-right text-[18px] text-white leading-tight md:text-[22px] lg:text-[26px]">
        <p>최근 접종일 | {lastDate}</p>
        <p>다음 접종일 | {nextDate}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 md:mt-4 md:gap-3 lg:mt-5 lg:gap-4">
        {history.map((item, index) => (
          <div
            key={`${item.date}-${index}`}
            className="flex w-full flex-col items-center justify-center rounded-[18px] bg-white py-2 md:rounded-[22px] md:py-3 lg:rounded-[26px] lg:py-4"
          >
            <div className="h-[18px] text-[26px] md:h-[22px] md:text-[30px] lg:h-[26px] lg:text-[34px]">
              {item.completed ? '✓' : ''}
            </div>

            <p className="mt-2 font-semibold text-[18px] text-black md:text-[22px] lg:text-[26px]">
              {item.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
