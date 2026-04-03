type MapCategoryItemProps = {
  label: string; // Category label
  isSelected?: boolean; // 선택 여부
  onClick?: () => void;
};

export default function MapCategoryItem({
  label,
  isSelected = false,
  onClick,
}: MapCategoryItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 font-semibold text-[18px] shadow-[0_2px_6px_rgba(0,0,0,0.15)] transition hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] md:px-3.5 md:py-0.8 md:text-[20px] lg:px-4 lg:py-0.6 lg:text-[22px] ${
        isSelected
          ? 'border border-black bg-white text-black'
          : 'border border-transparent bg-white text-black'
      }
      `}
    >
      {label}
    </button>
  );
}
