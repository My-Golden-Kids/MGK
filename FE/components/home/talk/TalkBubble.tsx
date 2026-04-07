'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

const BUBBLE_VISIBLE_LINES = 3;
const BUBBLE_FRAME_INTERVAL_MS = 1400;

type TalkBubbleProps = {
  message: string;
  messageFrames?: string[];
  className?: string;
  bubbleClassName?: string;
  contentClassName?: string;
  textClassName?: string;
  footer?: ReactNode;
};

export default function TalkBubble({
  message,
  messageFrames,
  className = 'w-full',
  bubbleClassName = 'mx-20 overflow-hidden rounded-[24px] bg-[#0000004D] md:rounded-[28px] lg:rounded-[32px]',
  contentClassName = 'px-6 py-5 md:px-7 md:py-6 lg:px-8 lg:py-7',
  textClassName = 'whitespace-pre-line font-bold text-[20px] text-white leading-[1.35] md:text-[24px] lg:text-[28px]',
  footer,
}: TalkBubbleProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const resolvedBubbleFrames = useMemo(() => {
    if (messageFrames?.length) {
      return messageFrames;
    }

    const lines = message.split('\n');

    if (lines.length <= BUBBLE_VISIBLE_LINES) {
      return [message];
    }

    return Array.from(
      { length: lines.length - BUBBLE_VISIBLE_LINES + 1 },
      (_, index) => lines.slice(index, index + BUBBLE_VISIBLE_LINES).join('\n'),
    );
  }, [message, messageFrames]);
  const displayedMessage = resolvedBubbleFrames[frameIndex] ?? message;

  useEffect(() => {
    setFrameIndex(0);
  }, [resolvedBubbleFrames]);

  useEffect(() => {
    if (resolvedBubbleFrames.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setFrameIndex((currentIndex) =>
        currentIndex + 1 < resolvedBubbleFrames.length
          ? currentIndex + 1
          : currentIndex,
      );
    }, BUBBLE_FRAME_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [resolvedBubbleFrames]);

  return (
    <section className={className}>
      <div className={bubbleClassName}>
        <div className={contentClassName}>
          <p className={textClassName}>{displayedMessage}</p>
        </div>
        {footer}
      </div>
    </section>
  );
}
