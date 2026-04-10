type PetProfileImageProps = {
  imageUrl?: string;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
};

export default function PetProfileImage({
  imageUrl,
  className = '',
  onClick,
  'aria-label': ariaLabel = 'Pet Profile',
}: PetProfileImageProps) {
  const src = imageUrl || '/images/onboarding/byeolsong.png';
  const content = (
    <img
      src={src}
      alt={ariaLabel}
      className="h-full w-full object-cover"
      draggable={false}
    />
  );

  if (!onClick) {
    return (
      <div
        className={`overflow-hidden rounded-full border bg-white ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-full border bg-white ${className}`}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
