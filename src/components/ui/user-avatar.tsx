"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const userAvatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-background transition-all duration-200",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

// Generate consistent gradient based on name
function getAvatarGradient(name: string): string {
  const gradients = [
    "bg-linear-to-br from-red-400 to-red-600",
    "bg-linear-to-br from-orange-400 to-orange-600",
    "bg-linear-to-br from-amber-400 to-amber-600",
    "bg-linear-to-br from-yellow-400 to-yellow-600",
    "bg-linear-to-br from-lime-400 to-lime-600",
    "bg-linear-to-br from-green-400 to-green-600",
    "bg-linear-to-br from-emerald-400 to-emerald-600",
    "bg-linear-to-br from-teal-400 to-teal-600",
    "bg-linear-to-br from-cyan-400 to-cyan-600",
    "bg-linear-to-br from-sky-400 to-sky-600",
    "bg-linear-to-br from-blue-400 to-blue-600",
    "bg-linear-to-br from-indigo-400 to-indigo-600",
    "bg-linear-to-br from-violet-400 to-violet-600",
    "bg-linear-to-br from-purple-400 to-purple-600",
    "bg-linear-to-br from-fuchsia-400 to-fuchsia-600",
    "bg-linear-to-br from-pink-400 to-pink-600",
    "bg-linear-to-br from-rose-400 to-rose-600",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

// Get initials from name
function getInitials(name: string): string {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface UserAvatarProps
  extends
    React.ComponentProps<typeof Avatar>,
    VariantProps<typeof userAvatarVariants> {
  name: string;
  image?: string | null;
  showStatus?: boolean;
  status?: "online" | "offline" | "away" | "busy";
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500",
  busy: "bg-red-500",
};

export function UserAvatar({
  name,
  image,
  size,
  showStatus = false,
  status = "offline",
  className,
  ...props
}: UserAvatarProps) {
  const initials = getInitials(name);
  const bgGradient = getAvatarGradient(name);

  return (
    <div className="relative inline-block">
      <Avatar
        className={cn(userAvatarVariants({ size }), "hover:ring-primary/50", className)}
        {...props}
      >
        {image && (
          <AvatarImage src={image} alt={name} className="object-cover" />
        )}
        <AvatarFallback
          className={cn(
            bgGradient,
            "flex items-center justify-center font-semibold text-white shadow-inner",
          )}
          delayMs={image ? 600 : 0}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            "ring-background absolute right-0 bottom-0 block rounded-full ring-2 shadow-sm",
            statusColors[status],
            size === "xs" && "h-1.5 w-1.5",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            size === "xl" && "h-3.5 w-3.5",
            size === "2xl" && "h-4 w-4",
          )}
        />
      )}
    </div>
  );
}

// Avatar Group for showing multiple users
export interface AvatarGroupProps {
  users: Array<{ name: string; image?: string | null }>;
  max?: number;
  size?: VariantProps<typeof userAvatarVariants>["size"];
  className?: string;
}

export function AvatarGroup({
  users,
  max = 4,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleUsers.map((user, index) => (
        <UserAvatar
          key={index}
          name={user.name}
          image={user.image}
          size={size}
          className="ring-background ring-2"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            userAvatarVariants({ size }),
            "bg-muted text-muted-foreground ring-background flex items-center justify-center font-medium ring-2",
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
