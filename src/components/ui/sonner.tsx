"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast, type ToasterProps } from "sonner";

// Custom animated icons
const AnimatedSuccessIcon = () => (
  <div className="relative flex items-center justify-center">
    <svg
      className="size-4 text-green-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        className="opacity-20"
        style={{ animation: "scaleIn 0.3s ease-out forwards" }}
      />
      <path
        d="M8 12l3 3 5-6"
        style={{
          strokeDasharray: 20,
          strokeDashoffset: 20,
          animation: "drawCheck 0.4s ease-out 0.2s forwards",
        }}
      />
    </svg>
  </div>
);

const AnimatedErrorIcon = () => (
  <div className="relative flex items-center justify-center">
    <svg
      className="size-4 text-red-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: "shake 0.4s ease-out" }}
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  </div>
);

const AnimatedWarningIcon = () => (
  <div
    className="relative flex items-center justify-center"
    style={{ animation: "pulse 1s ease-in-out infinite" }}
  >
    <TriangleAlertIcon className="size-4 text-yellow-500" />
  </div>
);

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <AnimatedSuccessIcon />,
        info: <InfoIcon className="size-4 text-blue-500" />,
        warning: <AnimatedWarningIcon />,
        error: <AnimatedErrorIcon />,
        loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg",
          success:
            "group-[.toaster]:border-green-200 group-[.toaster]:dark:border-green-800/50",
          error:
            "group-[.toaster]:border-red-200 group-[.toaster]:dark:border-red-800/50",
          warning:
            "group-[.toaster]:border-yellow-200 group-[.toaster]:dark:border-yellow-800/50",
          info:
            "group-[.toaster]:border-blue-200 group-[.toaster]:dark:border-blue-800/50",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

// Enhanced toast functions with animations
const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    return sonnerToast.success(message, {
      ...options,
      className: "animate-slide-in-right",
    });
  },
  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
    return sonnerToast.error(message, {
      ...options,
      className: "animate-shake",
    });
  },
  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
    return sonnerToast.warning(message, options);
  },
  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
    return sonnerToast.info(message, options);
  },
  loading: (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) => {
    return sonnerToast.loading(message, options);
  },
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
};

export { Toaster, toast };
