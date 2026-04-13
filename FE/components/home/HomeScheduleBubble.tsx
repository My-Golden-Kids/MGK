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
      <div className="mx-20 overflow-hidden rounded-[24px] border border-[#B2B2B2] bg-[#0000004D] md:rounded-[28px] lg:rounded-[32px]">
        <div className="px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7">
          <p className="whitespace-pre-line font-bold text-[20px] text-white leading-[1.35] md:text-[24px] lg:text-[28px]">
            {message}
          </p>
        </div>

        <div className="border-[#B2B2B2] border-t bg-white">
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-[54px] w-full cursor-pointer items-center justify-center font-extrabold text-[#66706D] text-[28px] transition-all hover:bg-gray-50 active:scale-[0.98] md:h-[62px] lg:h-[70px]"
          >
            X
          </button>
        </div>
      </div>
    </section>
  );
}
