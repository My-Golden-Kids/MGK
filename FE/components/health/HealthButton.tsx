import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const healthButtonVariants = cva(
  'flex flex-col items-center justify-center rounded-[10px] text-white transition-transform hover:scale-[1.02] cursor-pointer',
  {
    variants: {
      variant: {
        green: 'bg-[#38CD5F]',
        mint: 'bg-[#48C7C9]',
        yellow: 'bg-[#F5BE08]',
        default: 'bg-gray-300',
      },
      size: {
        wide: 'h-[218px] w-full px-6 py-8',
        square: 'h-[218px] w-full px-6 py-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'square',
    },
  },
);

export interface HealthButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof healthButtonVariants> {
  icon: React.ReactNode;
  label: string;
  iconClassName?: string;
}

const HealthButton = React.forwardRef<HTMLButtonElement, HealthButtonProps>(
  ({ className, variant, size, icon, label, iconClassName, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(healthButtonVariants({ variant, size }), className)}
        {...props}
      >
        <div
          className={cn(
            'mb-8 stroke-[1.8] [&>svg]:h-[60px] [&>svg]:w-[60px] sm:[&>svg]:h-[60px] sm:[&>svg]:w-[60px] md:[&>svg]:h-[68px] md:[&>svg]:w-[68px] lg:[&>svg]:h-[76px] lg:[&>svg]:w-[76px]',
            iconClassName,
          )}
        >
          {icon}
        </div>
        <span className="whitespace-nowrap text-[28px] sm:text-[28px] md:text-[34px] lg:text-[40px] font-bold leading-none">
          {label}
        </span>
      </button>
    );
  },
);

HealthButton.displayName = 'HealthButton';

export { HealthButton, healthButtonVariants };
