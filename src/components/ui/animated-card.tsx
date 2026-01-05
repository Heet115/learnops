"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const animatedCardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
  {
    variants: {
      hover: {
        none: "",
        lift: "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md active:translate-y-0 active:shadow-sm",
        glow: "transition-all duration-200 ease-out hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20",
        scale: "transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]",
        subtle: "transition-colors duration-150 ease-out hover:bg-accent/50",
      },
      clickable: {
        true: "cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      hover: "lift",
      clickable: false,
    },
  }
);

export interface AnimatedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof animatedCardVariants> {
  asChild?: boolean;
}

const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, hover, clickable, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(animatedCardVariants({ hover, clickable }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

// Stat Card with animation
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  iconColor = "text-primary",
  trend,
  className,
  onClick,
}: StatCardProps) {
  return (
    <AnimatedCard
      hover="lift"
      clickable={!!onClick}
      onClick={onClick}
      className={cn("group", className)}
    >
      <div className="flex flex-row items-center justify-between px-6 pb-2">
        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </span>
        {icon && (
          <div className={cn("transition-transform duration-200 group-hover:scale-110", iconColor)}>
            {icon}
          </div>
        )}
      </div>
      <div className="px-6 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl font-bold tabular-nums", iconColor)}>
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </AnimatedCard>
  );
}

// List Item with hover animation
interface AnimatedListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AnimatedListItem({
  children,
  className,
  ...props
}: AnimatedListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-3",
        "transition-all duration-150 ease-out",
        "hover:bg-accent/50 hover:border-accent",
        "active:bg-accent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Animated container for staggered children
interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  stagger?: boolean;
}

export function StaggerContainer({
  children,
  stagger = true,
  className,
  ...props
}: StaggerContainerProps) {
  return (
    <div
      className={cn(stagger && "stagger-children", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { AnimatedCard, animatedCardVariants };
