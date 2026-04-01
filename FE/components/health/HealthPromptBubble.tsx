type HealthPromptBubbleProps = {
  message: string;
  showAnswerButtons?: boolean;
  onYesClick?: () => void;
  onNoClick?: () => void;
  yesLabel?: string;
  noLabel?: string;
};

export default function HealthPromptBubble({
  message,
  showAnswerButtons = false,
  onYesClick,
  onNoClick,
  yesLabel = 'O',
  noLabel = 'X',
}: HealthPromptBubbleProps) {
  return (
    <section className="w-full">
      <div
        className={`overflow-hidden bg-[#0000004D] ${showAnswerButtons ? 'border border-[#B2B2B2]' : ''} rounded-[24px] md:rounded-[28px] lg:rounded-[32px]`}
      >
        {/* 텍스트 영역 */}
        <div className="px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7">
          <p className="whitespace-pre-line font-bold text-[20px] text-white leading-[1.35] md:text-[24px] lg:text-[28px]">
            {message}
          </p>
        </div>

        {/* 버튼 영역 */}
        {showAnswerButtons && (
          <div className="grid h-[54px] grid-cols-2 border-[#B2B2B2] border-t bg-white md:h-[62px] lg:h-[70px]">
            <button
              type="button"
              onClick={onNoClick}
              className="flex items-center justify-center border-[#B2B2B2] border-r font-extrabold text-[#DB1F26] text-[34px] transition active:scale-[0.98] md:text-[42px] lg:text-[50px]"
              aria-label={noLabel}
            >
              {noLabel}
            </button>

            <button
              type="button"
              onClick={onYesClick}
              className="flex items-center justify-center font-extrabold text-[#018D70] text-[34px] transition active:scale-[0.98] md:text-[42px] lg:text-[50px]"
              aria-label={yesLabel}
            >
              {yesLabel}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
