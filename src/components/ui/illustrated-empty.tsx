"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  BookOpen,
  Calendar,
  Bell,
  Search,
  FolderOpen,
  Inbox,
  ClipboardList,
  GraduationCap,
  Upload,
  CheckCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

// SVG Illustrations
const illustrations = {
  // Empty folder/no data
  noData: (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <rect x="40" y="50" width="120" height="80" rx="8" className="fill-muted stroke-border" strokeWidth="2" />
      <path d="M40 58C40 53.5817 43.5817 50 48 50H80L90 60H152C156.418 60 160 63.5817 160 68V130C160 134.418 156.418 138 152 138H48C43.5817 138 40 134.418 40 130V58Z" className="fill-muted/50 stroke-border" strokeWidth="2" />
      <circle cx="100" cy="100" r="20" className="fill-background stroke-muted-foreground/30" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M95 100L99 104L105 96" className="stroke-muted-foreground/50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // No search results
  noResults: (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle cx="85" cy="70" r="35" className="fill-muted stroke-border" strokeWidth="2" />
      <circle cx="85" cy="70" r="25" className="fill-background stroke-muted-foreground/30" strokeWidth="2" />
      <line x1="105" y1="90" x2="140" y2="125" className="stroke-muted-foreground" strokeWidth="8" strokeLinecap="round" />
      <path d="M75 65L80 70L90 60" className="stroke-muted-foreground/40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <circle cx="150" cy="40" r="4" className="fill-muted-foreground/20" />
      <circle cx="45" cy="110" r="3" className="fill-muted-foreground/20" />
      <circle cx="165" cy="100" r="5" className="fill-muted-foreground/20" />
    </svg>
  ),

  // No notifications
  noNotifications: (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path d="M100 30C80 30 65 45 65 65V90L55 105H145L135 90V65C135 45 120 30 100 30Z" className="fill-muted stroke-border" strokeWidth="2" />
      <circle cx="100" cy="120" r="10" className="fill-muted stroke-border" strokeWidth="2" />
      <path d="M85 65C85 56.7157 91.7157 50 100 50" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="130" cy="45" r="12" className="fill-background stroke-green-500" strokeWidth="2" />
      <path d="M125 45L128 48L135 41" className="stroke-green-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // No submissions
  noSubmissions: (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <rect x="50" y="30" width="100" height="100" rx="8" className="fill-muted stroke-border" strokeWidth="2" />
      <rect x="60" y="45" width="60" height="6" rx="3" className="fill-muted-foreground/20" />
      <rect x="60" y="58" width="80" height="4" rx="2" className="fill-muted-foreground/10" />
      <rect x="60" y="68" width="70" height="4" rx="2" className="fill-muted-foreground/10" />
      <rect x="60" y="78" width="75" height="4" rx="2" className="fill-muted-foreground/10" />
      <circle cx="140" cy="110" r="20" className="fill-background stroke-primary" strokeWidth="2" />
      <path d="M140 100V115M140 115L135 110M140 115L145 110" className="stroke-primary" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // No users
  noUsers: (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle cx="100" cy="55" r="25" className="fill-muted stroke-border" strokeWidth="2" />
      <path d="M60 130C60 105 77 90 100 90C123 90 140 105 140 130" className="fill-muted stroke-border" strokeWidth="2" />
      <circle cx="60" cy="60" r="15" className="fill-muted/50 stroke-border" strokeWidth="2" opacity="0.5" />
      <circle cx="140" cy="60" r="15" className="fill-muted/50 stroke-border" strokeWidth="2" opacity="0.5" />
      <circle cx="100" cy="55" r="8" className="fill-background" />
      <path d="M96 53L100 57L108 49" className="stroke-muted-foreground/30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // Success/completed
  success: (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle cx="100" cy="75" r="45" className="fill-green-100 dark:fill-green-900/30 stroke-green-500" strokeWidth="3" />
      <path d="M75 75L90 90L125 55" className="stroke-green-500" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="45" cy="45" r="8" className="fill-green-200 dark:fill-green-800/50" />
      <circle cx="160" cy="55" r="6" className="fill-green-200 dark:fill-green-800/50" />
      <circle cx="155" cy="115" r="10" className="fill-green-200 dark:fill-green-800/50" />
      <circle cx="50" cy="110" r="5" className="fill-green-200 dark:fill-green-800/50" />
    </svg>
  ),

  // Error state
  error: (
    <svg
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <circle cx="100" cy="75" r="45" className="fill-red-100 dark:fill-red-900/30 stroke-red-500" strokeWidth="3" />
      <path d="M80 55L120 95M120 55L80 95" className="stroke-red-500" strokeWidth="6" strokeLinecap="round" />
      <circle cx="45" cy="45" r="8" className="fill-red-200 dark:fill-red-800/50" />
      <circle cx="160" cy="55" r="6" className="fill-red-200 dark:fill-red-800/50" />
      <circle cx="155" cy="115" r="10" className="fill-red-200 dark:fill-red-800/50" />
    </svg>
  ),
};

type IllustrationType = keyof typeof illustrations;

// Preset configurations for common empty states
const presets = {
  noAlas: {
    illustration: "noData" as IllustrationType,
    icon: FileText,
    title: "No ALAs yet",
    description: "Active Learning Activities will appear here once created.",
    tip: "Create your first ALA to get started with assignments.",
  },
  noSubmissions: {
    illustration: "noSubmissions" as IllustrationType,
    icon: Upload,
    title: "No submissions",
    description: "Student submissions will appear here.",
    tip: "Submissions are automatically organized by deadline and status.",
  },
  noUsers: {
    illustration: "noUsers" as IllustrationType,
    icon: Users,
    title: "No users found",
    description: "Users will appear here once they are created.",
    tip: "Add users through the admin panel to get started.",
  },
  noResults: {
    illustration: "noResults" as IllustrationType,
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or filter criteria.",
    tip: "Use fewer keywords or clear some filters.",
  },
  noNotifications: {
    illustration: "noNotifications" as IllustrationType,
    icon: Bell,
    title: "All caught up!",
    description: "You have no new notifications.",
    tip: "Notifications will appear here when there's activity.",
  },
  noClasses: {
    illustration: "noData" as IllustrationType,
    icon: GraduationCap,
    title: "No classes assigned",
    description: "You haven't been assigned to any classes yet.",
    tip: "Contact your administrator for class assignments.",
  },
  noSubjects: {
    illustration: "noData" as IllustrationType,
    icon: BookOpen,
    title: "No subjects found",
    description: "Subjects will appear here once created.",
    tip: "Create subjects to organize your curriculum.",
  },
  noDeadlines: {
    illustration: "noData" as IllustrationType,
    icon: Calendar,
    title: "No upcoming deadlines",
    description: "You're all caught up with your assignments!",
    tip: "New deadlines will appear here when ALAs are assigned.",
  },
  noGrades: {
    illustration: "noData" as IllustrationType,
    icon: ClipboardList,
    title: "No grades yet",
    description: "Your grades will appear here once submissions are reviewed.",
    tip: "Submit your work on time to receive feedback.",
  },
  success: {
    illustration: "success" as IllustrationType,
    icon: CheckCircle,
    title: "Success!",
    description: "Your action was completed successfully.",
    tip: "",
  },
  error: {
    illustration: "error" as IllustrationType,
    icon: AlertCircle,
    title: "Something went wrong",
    description: "An error occurred while processing your request.",
    tip: "Please try again or contact support if the issue persists.",
  },
};

type PresetType = keyof typeof presets;

interface IllustratedEmptyProps {
  preset?: PresetType;
  illustration?: IllustrationType;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  tip?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function IllustratedEmpty({
  preset,
  illustration: customIllustration,
  icon: CustomIcon,
  title: customTitle,
  description: customDescription,
  tip: customTip,
  action,
  secondaryAction,
  className,
  size = "md",
}: IllustratedEmptyProps) {
  const config = preset ? presets[preset] : null;

  const illustration = customIllustration || config?.illustration || "noData";
  const Icon = CustomIcon || config?.icon || FolderOpen;
  const title = customTitle || config?.title || "No data";
  const description = customDescription || config?.description || "Nothing to show here yet.";
  const tip = customTip ?? config?.tip;

  const sizeClasses = {
    sm: {
      container: "py-6 px-4",
      illustration: "w-24 h-18",
      icon: "h-4 w-4",
      title: "text-base",
      description: "text-xs",
    },
    md: {
      container: "py-10 px-6",
      illustration: "w-40 h-30",
      icon: "h-5 w-5",
      title: "text-lg",
      description: "text-sm",
    },
    lg: {
      container: "py-16 px-8",
      illustration: "w-52 h-40",
      icon: "h-6 w-6",
      title: "text-xl",
      description: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
      style={{ animation: "fadeIn 0.3s ease-out forwards" }}
    >
      {/* Illustration */}
      <div className={cn("mb-4", sizes.illustration)}>
        {illustrations[illustration]}
      </div>

      {/* Icon badge */}
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className={cn("text-muted-foreground", sizes.icon)} />
      </div>

      {/* Title */}
      <h3 className={cn("font-semibold text-foreground mb-1", sizes.title)}>
        {title}
      </h3>

      {/* Description */}
      <p className={cn("text-muted-foreground max-w-sm mb-2", sizes.description)}>
        {description}
      </p>

      {/* Tip */}
      {tip && (
        <p className={cn("text-muted-foreground/70 max-w-xs italic", sizes.description)}>
          💡 {tip}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-4 flex gap-2">
          {action && (
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
              className="btn-press"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="btn-press"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export { presets as emptyStatePresets };
