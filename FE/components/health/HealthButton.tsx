//         <HealthButton variant="green" icon={<Footprints />} label="산책" />
//        <HealthButton variant="mint" icon={<Syringe />} label="접종" />
//      <HealthButton variant="yellow" icon={<Notebook />} label="병원기록" />
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const healthButtonVariants = cva(
  "flex flex-col items-center justify-center w-28 h-28 p-4 rounded-2xl transition-colors transform hover:scale-105",
  {
    variants: {
      variant: {
        green: "bg-green-100 text-green-800",
        mint: "bg-cyan-100 text-cyan-800",
        yellow: "bg-yellow-100 text-yellow-800",
        default: "bg-gray-100 text-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface HealthButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof healthButtonVariants> {
  icon: React.ReactNode;
  label: string;
}

const HealthButton = React.forwardRef<HTMLButtonElement, HealthButtonProps>(
  ({ className, variant, icon, label, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(healthButtonVariants({ variant }), className)}
        {...props}
      >
        <div className="mb-3 [&>svg]:w-[40px] [&>svg]:h-[40px]">{icon}</div>
        <span className="font-bold text-[20px] leading-tight whitespace-nowrap">
          {label}
        </span>
      </button>
    );
  },
);

HealthButton.displayName = "HealthButton";

export { HealthButton, healthButtonVariants };
