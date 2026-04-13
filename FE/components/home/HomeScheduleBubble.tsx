type HomeScheduleBubbleProps = {
  messages: string[];
  currentIndex: number;
  onDismiss: () => void;
};

export default function HomeScheduleBubble({
  messages,
  currentIndex,
  onDismiss,
}: HomeScheduleBubbleProps) {
  const message = messages[currentIndex];
  if (!message) return null;

  return (
    <section className="w-full">
      <div className="mx-20 overflow-hidden rounded-[24px] border border-main-green md:rounded-[28px] lg:rounded-[32px]">
        <div className="px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7">
          <p className="whitespace-pre-line text-[20px] text-black leading-[1.35] md:text-[24px] lg:text-[28px]">
            {message}
          </p>
        </div>

        <div className="border-main-green border-t bg-mint-green">
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-13.5 w-full cursor-pointer items-center justify-center font-extrabold text-white text-[28px] transition-all hover:bg-gray-50 active:scale-[0.98] md:h-[62px] lg:h-[70px]"
          >
            닫기
          </button>
        </div>
      </div>
    </section>
  );
}
