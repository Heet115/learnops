"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StatCard } from "./animated-card";
import { LucideIcon } from "lucide-react";

export interface StatItem {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  color?: "blue" | "emerald" | "amber" | "violet" | "rose" | "cyan";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

const colorMap: Record<string, { icon: string; bg: string }> = {
  blue: {
    icon: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  emerald: {
    icon: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  amber: {
    icon: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  violet: {
    icon: "text-violet-600",
    bg: "bg-violet-500/10",
  },
  rose: {
    icon: "text-rose-600",
    bg: "bg-rose-500/10",
  },
  cyan: {
    icon: "text-cyan-600",
    bg: "bg-cyan-500/10",
  },
};

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ stats, columns = 4, className }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-3 sm:gap-4", gridCols[columns], className)}>
      {stats.map((stat) => {
        const colors = colorMap[stat.color || "blue"];
        const Icon = stat.icon;

        return (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={Icon ? <Icon className="h-4 w-4" /> : undefined}
            iconColor={stat.iconColor || colors.icon}
            trend={stat.trend}
            onClick={stat.onClick}
          />
        );
      })}
    </div>
  );
}
