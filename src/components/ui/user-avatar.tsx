"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const userAvatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
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
  }
);

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
  extends React.ComponentProps<typeof Avatar>,
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
  const bgColor = getAvatarColor(name);

  return (
    <div className="relative inline-block">
      <Avatar className={cn(userAvatarVariants({ size }), className)} {...props}>
        {image && (
          <AvatarImage
            src={image}
            alt={name}
            className="object-cover"
          />
        )}
        <AvatarFallback
          className={cn(
            bgColor,
            "text-white font-medium flex items-center justify-center"
          )}
          delayMs={image ? 600 : 0}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-background",
            statusColors[status],
            size === "xs" && "h-1.5 w-1.5",
            size === "sm" && "h-2 w-2",
            size === "md" && "h-2.5 w-2.5",
            size === "lg" && "h-3 w-3",
            size === "xl" && "h-3.5 w-3.5",
            size === "2xl" && "h-4 w-4"
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
          className="ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            userAvatarVariants({ size }),
            "bg-muted text-muted-foreground flex items-center justify-center font-medium ring-2 ring-background"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
