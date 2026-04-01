type PetProfileImageProps = {
  imageUrl: string;
  //   alt: string;
  className?: string;
  onClick?: () => void;
};

export default function PetProfileImage({
  imageUrl,
  //   alt,
  className = '',
  onClick,
}: PetProfileImageProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`overflow-hidden rounded-full border border-black bg-white ${className}`}
      aria-label="Pet Profile"
    >
      <img
        src={imageUrl}
        alt="Pet Profile"
        className="h-full w-full object-cover"
        draggable={false}
      />
    </button>
  );
}
