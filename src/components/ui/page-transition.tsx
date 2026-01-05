"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "fade" | "slide-up" | "slide-right" | "scale";
  delay?: number;
}

export function PageTransition({
  children,
  className,
  variant = "fade",
  delay = 0,
}: PageTransitionProps) {
  const variants = {
    fade: {
      animation: "fadeIn 0.4s ease-out forwards",
    },
    "slide-up": {
      animation: "slideUp 0.4s ease-out forwards",
    },
    "slide-right": {
      animation: "slideInRight 0.3s ease-out forwards",
    },
    scale: {
      animation: "scaleIn 0.3s ease-out forwards",
    },
  };

  return (
    <div
      className={cn("opacity-0", className)}
      style={{
        ...variants[variant],
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Wrapper for staggered page content
interface StaggeredContentProps {
  children: React.ReactNode;
  className?: string;
  baseDelay?: number;
  staggerDelay?: number;
}

export function StaggeredContent({
  children,
  className,
  baseDelay = 0,
  staggerDelay = 75,
}: StaggeredContentProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return (
          <div
            className="opacity-0"
            style={{
              animation: "fadeIn 0.4s ease-out forwards",
              animationDelay: `${baseDelay + index * staggerDelay}ms`,
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

// Simple fade wrapper for any content
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 400,
}: FadeInProps) {
  return (
    <div
      className={cn("opacity-0", className)}
      style={{
        animation: `fadeIn ${duration}ms ease-out forwards`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Slide up animation wrapper
interface SlideUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SlideUp({ children, className, delay = 0 }: SlideUpProps) {
  return (
    <div
      className={cn("opacity-0", className)}
      style={{
        animation: "slideUp 0.4s ease-out forwards",
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
