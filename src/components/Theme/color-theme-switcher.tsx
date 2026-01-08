"use client";

import { Check, Palette } from "lucide-react";
import { useColorTheme, ColorTheme } from "./color-theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const themeColors: Record<ColorTheme, string> = {
  sky: "bg-sky-500",
  slate: "bg-slate-500",
  ocean: "bg-cyan-500",
};

export function ColorThemeSwitcher() {
  const { colorTheme, setColorTheme, themes } = useColorTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-4 w-4" />
          <span
            className={cn(
              "border-background absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2",
              themeColors[colorTheme],
            )}
          />
          <span className="sr-only">Change color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Color Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(themes) as ColorTheme[]).map((key) => {
          const theme = themes[key];
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setColorTheme(key)}
              className="flex cursor-pointer items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn("h-4 w-4 rounded-full", themeColors[key])}
                />
                <span>{theme.emoji}</span>
                <span>{theme.name}</span>
              </div>
              {colorTheme === key && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
