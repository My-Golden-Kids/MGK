type PetProfileImageProps = {
  imageUrl?: string; // optional로 변경
  className?: string;
  onClick?: () => void;
};

export default function PetProfileImage({
  imageUrl,
  className = '',
  onClick,
}: PetProfileImageProps) {
  const src = imageUrl || '/images/onboarding/byeolsong.png';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-full border bg-white ${className}`}
      aria-label="Pet Profile"
    >
      <img
        src={src}
        alt="Pet Profile"
        className="h-full w-full object-cover"
        draggable={false}
      />
    </button>
  );
}
