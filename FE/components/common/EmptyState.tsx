import Image from 'next/image';

interface EmptyStateProps {
  /**
   * The size (width and height) of the circular avatar in pixels.
   * @default 128
   */
  size?: number;
  className?: string;
}

/**
 * A component to display a circular default profile image for pets.
 * Used when no specific pet profile image is available.
 */
export function EmptyState({ size = 128, className }: EmptyStateProps) {
  return (
    <div
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/onboarding/byeolsong.png"
        alt="기본 프로필 이미지"
        layout="fill"
        objectFit="cover"
        priority // Load the image immediately as it's likely LCP
      />
    </div>
  );
}
