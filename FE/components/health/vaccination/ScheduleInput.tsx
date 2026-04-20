'use client';

type ScheduleInputProps = {
  label: string;
  subLabel?: string;
  onChangeValue?: (value: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>;

export default function ScheduleInput({
  label,
  subLabel,
  onChangeValue,
  onChange,
  value,
  type = 'text',
  ...props
}: ScheduleInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-3 text-[22px] sm:text-[28px]">
        <p className="font-bold">{label}</p>
        {subLabel && <p className="font-normal text-gray-400">{subLabel}</p>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          onChangeValue?.(e.target.value);
        }}
        {...props}
        className="w-full rounded-[10px] border-2 px-4 text-[22px] placeholder:text-gray-400 sm:text-[28px]"
      />
    </div>
  );
}
