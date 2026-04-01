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
        className="flex flex-col items-center gap-3"
      >
        <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white md:h-[85px] md:w-[85px] lg:h-[100px] lg:w-[100px]">
          <span className="font-extrabold text-[#DB1F26] text-[50px] md:text-[65px] lg:text-[80px]">
            ✕
          </span>
        </div>

        <span className="font-bold text-[26px] text-black md:text-[30px] lg:text-[34px]">
          아니오
        </span>
      </button>

      {/* O */}
      <button
        type="button"
        onClick={onYesClick}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white md:h-[85px] md:w-[85px] lg:h-[100px] lg:w-[100px]">
          <span className="font-extrabold text-[#018D70] text-[50px] md:text-[65px] lg:text-[80px]">
            ○
          </span>
        </div>

        <span className="font-bold text-[26px] text-black md:text-[30px] lg:text-[34px]">
          네
        </span>
      </button>
    </div>
  );
}
