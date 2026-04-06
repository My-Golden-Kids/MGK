type TalkChoiceButtonsProps = {
  onYesClick?: () => void;
  onNoClick?: () => void;
};

export default function TalkChoiceButtons({
  onYesClick,
  onNoClick,
}: TalkChoiceButtonsProps) {
  return (
    <div className="flex w-full items-center justify-between px-18 md:px-24 lg:px-30">
      {/* X */}
      <button
        type="button"
        onClick={onNoClick}
        className="flex cursor-pointer flex-col items-center gap-3"
      >
        <div className="relative h-[70px] w-[70px] rounded-full bg-white md:h-[85px] md:w-[85px] lg:h-[100px] lg:w-[100px]">
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="-translate-x-1/2 -translate-y-1/2 absolute inset-1/2 h-[62%] w-[62%]"
          >
            <line
              x1="20"
              y1="20"
              x2="80"
              y2="80"
              stroke="#DB1F26"
              strokeWidth="15"
              strokeLinecap="round"
            />
            <line
              x1="80"
              y1="20"
              x2="20"
              y2="80"
              stroke="#DB1F26"
              strokeWidth="15"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <span className="font-bold text-[26px] text-black md:text-[30px] lg:text-[34px]">
          아니오
        </span>
      </button>

      {/* O */}
      <button
        type="button"
        onClick={onYesClick}
        className="flex cursor-pointer flex-col items-center gap-3"
      >
        <div className="relative h-[70px] w-[70px] rounded-full bg-white md:h-[85px] md:w-[85px] lg:h-[100px] lg:w-[100px]">
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            className="-translate-x-1/2 -translate-y-1/2 absolute inset-1/2 h-[62%] w-[62%]"
          >
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="#018D70"
              strokeWidth="15"
            />
          </svg>
        </div>

        <span className="font-bold text-[26px] text-black md:text-[30px] lg:text-[34px]">
          네
        </span>
      </button>
    </div>
  );
}
