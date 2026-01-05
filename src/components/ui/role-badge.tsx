"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Shield,
  GraduationCap,
  BookOpen,
  User,
  Crown,
  type LucideIcon,
} from "lucide-react";

const roleBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
  {
    variants: {
      role: {
        admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        hod: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        professor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        student: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[10px]",
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      role: "student",
      size: "sm",
    },
  }
);

type RoleType = "admin" | "hod" | "professor" | "student";

const roleIcons: Record<RoleType, LucideIcon> = {
  admin: Shield,
  hod: Crown,
  professor: BookOpen,
  student: GraduationCap,
};

const roleLabels: Record<RoleType, string> = {
  admin: "Admin",
  hod: "HOD",
  professor: "Professor",
  student: "Student",
};

export interface RoleBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "role">,
    VariantProps<typeof roleBadgeVariants> {
  role: RoleType;
  showIcon?: boolean;
  showLabel?: boolean;
}

export function RoleBadge({
  role,
  size,
  showIcon = true,
  showLabel = true,
  className,
  ...props
}: RoleBadgeProps) {
  const Icon = roleIcons[role];
  const label = roleLabels[role];

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(roleBadgeVariants({ role, size }), className)}
      {...props}
    >
      {showIcon && <Icon className={iconSizes[size || "sm"]} />}
      {showLabel && <span>{label}</span>}
    </span>
  );
}

// User Card with Avatar and Role Badge
import { UserAvatar } from "./user-avatar";

export interface UserCardProps {
  name: string;
  email?: string;
  image?: string | null;
  role: RoleType;
  subtitle?: string;
  showRoleBadge?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function UserCard({
  name,
  email,
  image,
  role,
  subtitle,
  showRoleBadge = true,
  size = "md",
  className,
  onClick,
}: UserCardProps) {
  const sizeConfig = {
    sm: {
      avatar: "sm" as const,
      name: "text-sm",
      subtitle: "text-xs",
      badge: "xs" as const,
      gap: "gap-2",
    },
    md: {
      avatar: "md" as const,
      name: "text-sm font-medium",
      subtitle: "text-xs",
      badge: "sm" as const,
      gap: "gap-3",
    },
    lg: {
      avatar: "lg" as const,
      name: "text-base font-medium",
      subtitle: "text-sm",
      badge: "md" as const,
      gap: "gap-4",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex items-center",
        config.gap,
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      <UserAvatar name={name} image={image} size={config.avatar} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("truncate", config.name)}>{name}</span>
          {showRoleBadge && (
            <RoleBadge role={role} size={config.badge} showIcon={false} />
          )}
        </div>
        {(email || subtitle) && (
          <p className={cn("text-muted-foreground truncate", config.subtitle)}>
            {subtitle || email}
          </p>
        )}
      </div>
    </div>
  );
}

// Compact user pill (for inline display)
export interface UserPillProps {
  name: string;
  image?: string | null;
  role?: RoleType;
  className?: string;
}

export function UserPill({ name, image, role, className }: UserPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-1",
        className
      )}
    >
      <UserAvatar name={name} image={image} size="xs" />
      <span className="text-xs font-medium truncate max-w-[100px]">{name}</span>
      {role && <RoleBadge role={role} size="xs" showLabel={false} />}
    </span>
  );
}
