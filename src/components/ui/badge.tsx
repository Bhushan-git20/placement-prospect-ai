import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-105",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:scale-105",
        outline: "text-foreground hover:bg-accent",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80 hover:scale-105",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80 hover:scale-105",
        info: "border-transparent bg-info text-info-foreground hover:bg-info/80 hover:scale-105",
        cyan: "border-transparent bg-brand-cyan text-white hover:bg-brand-cyan/80 hover:scale-105",
        pink: "border-transparent bg-brand-pink text-white hover:bg-brand-pink/80 hover:scale-105",
        orange: "border-transparent bg-brand-orange text-white hover:bg-brand-orange/80 hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
