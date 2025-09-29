import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statsCardVariants = cva(
  "glass-card transition-smooth hover:scale-[1.02] card-hover",
  {
    variants: {
      variant: {
        default: "border-border",
        primary: "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent",
        success: "border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent",
        warning: "border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent",
        info: "border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatsCardProps extends VariantProps<typeof statsCardVariants> {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  variant, 
  className 
}: StatsCardProps) {
  return (
    <Card className={cn(statsCardVariants({ variant }), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground opacity-70">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold gradient-text mb-1">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <span className={cn(
              "font-medium",
              trend.positive === false ? "text-destructive" : "text-green-500"
            )}>
              {trend.positive !== false ? "+" : ""}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}