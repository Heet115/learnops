"use client";

import { ThemeToggleButton } from "@/components/ui/skiper-ui/skiper26";

export function ModeToggle() {
  return (
    <ThemeToggleButton
      variant="circle"
      start="top-right"
      blur={true}
      className="size-7"
    />
  );
}
