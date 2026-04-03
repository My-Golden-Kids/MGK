type TalkBubbleProps = {
  message: string; // 대화 내용
};

export default function TalkBubble({ message }: TalkBubbleProps) {
  return (
    <section className="w-full">
      <div
        className={`mx-20 overflow-hidden rounded-[24px] bg-[#0000004D] md:rounded-[28px] lg:rounded-[32px]`}
      >
        {/* 텍스트 영역 */}
        <div className="px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7">
          <p className="whitespace-pre-line font-bold text-[20px] text-white leading-[1.35] md:text-[24px] lg:text-[28px]">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
