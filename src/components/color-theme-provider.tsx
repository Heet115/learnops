"use client";

import * as React from "react";
import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
} from "react";

export type ColorTheme = "sky" | "slate" | "ocean";

interface ColorThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ColorTheme;
  storageKey?: string;
}

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  themes: typeof colorThemes;
}

const colorThemes = {
  sky: {
    id: "sky",
    name: "Sky Blue",
    description: "Light & Airy",
    emoji: "☁️",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.145 0 0)",
      primary: "oklch(0.6 0.18 230)",
      primaryForeground: "oklch(0.98 0 0)",
      secondary: "oklch(0.96 0.02 230)",
      secondaryForeground: "oklch(0.25 0.05 230)",
      muted: "oklch(0.96 0.01 230)",
      mutedForeground: "oklch(0.5 0.02 230)",
      accent: "oklch(0.94 0.03 230)",
      accentForeground: "oklch(0.25 0.05 230)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.9 0.02 230)",
      input: "oklch(0.9 0.02 230)",
      ring: "oklch(0.6 0.18 230)",
      chart1: "oklch(0.6 0.18 230)",
      chart2: "oklch(0.65 0.15 200)",
      chart3: "oklch(0.55 0.12 250)",
      chart4: "oklch(0.7 0.14 210)",
      chart5: "oklch(0.5 0.16 240)",
      sidebar: "oklch(0.98 0.01 230)",
      sidebarForeground: "oklch(0.145 0 0)",
      sidebarPrimary: "oklch(0.6 0.18 230)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarAccent: "oklch(0.94 0.03 230)",
      sidebarAccentForeground: "oklch(0.25 0.05 230)",
      sidebarBorder: "oklch(0.9 0.02 230)",
      sidebarRing: "oklch(0.6 0.18 230)",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.205 0.01 230)",
      cardForeground: "oklch(0.985 0 0)",
      popover: "oklch(0.205 0.01 230)",
      popoverForeground: "oklch(0.985 0 0)",
      primary: "oklch(0.7 0.15 230)",
      primaryForeground: "oklch(0.15 0 0)",
      secondary: "oklch(0.27 0.02 230)",
      secondaryForeground: "oklch(0.985 0 0)",
      muted: "oklch(0.27 0.02 230)",
      mutedForeground: "oklch(0.7 0.02 230)",
      accent: "oklch(0.3 0.03 230)",
      accentForeground: "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.7 0.15 230)",
      chart1: "oklch(0.7 0.15 230)",
      chart2: "oklch(0.65 0.12 200)",
      chart3: "oklch(0.6 0.1 250)",
      chart4: "oklch(0.75 0.12 210)",
      chart5: "oklch(0.55 0.14 240)",
      sidebar: "oklch(0.205 0.01 230)",
      sidebarForeground: "oklch(0.985 0 0)",
      sidebarPrimary: "oklch(0.7 0.15 230)",
      sidebarPrimaryForeground: "oklch(0.985 0 0)",
      sidebarAccent: "oklch(0.3 0.03 230)",
      sidebarAccentForeground: "oklch(0.985 0 0)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.7 0.15 230)",
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Deep Sea Vibes",
    emoji: "🌊",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.145 0 0)",
      primary: "oklch(0.55 0.2 220)",
      primaryForeground: "oklch(0.98 0 0)",
      secondary: "oklch(0.95 0.03 200)",
      secondaryForeground: "oklch(0.25 0.08 220)",
      muted: "oklch(0.95 0.02 200)",
      mutedForeground: "oklch(0.5 0.04 220)",
      accent: "oklch(0.92 0.04 200)",
      accentForeground: "oklch(0.25 0.08 220)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.88 0.03 200)",
      input: "oklch(0.88 0.03 200)",
      ring: "oklch(0.55 0.2 220)",
      chart1: "oklch(0.55 0.2 220)",
      chart2: "oklch(0.6 0.17 180)",
      chart3: "oklch(0.5 0.15 200)",
      chart4: "oklch(0.65 0.14 160)",
      chart5: "oklch(0.45 0.18 240)",
      sidebar: "oklch(0.97 0.02 200)",
      sidebarForeground: "oklch(0.145 0 0)",
      sidebarPrimary: "oklch(0.55 0.2 220)",
      sidebarPrimaryForeground: "oklch(0.98 0 0)",
      sidebarAccent: "oklch(0.92 0.04 200)",
      sidebarAccentForeground: "oklch(0.25 0.08 220)",
      sidebarBorder: "oklch(0.88 0.03 200)",
      sidebarRing: "oklch(0.55 0.2 220)",
    },
    dark: {
      background: "oklch(0.13 0.02 220)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.18 0.03 220)",
      cardForeground: "oklch(0.985 0 0)",
      popover: "oklch(0.18 0.03 220)",
      popoverForeground: "oklch(0.985 0 0)",
      primary: "oklch(0.65 0.18 200)",
      primaryForeground: "oklch(0.15 0.02 220)",
      secondary: "oklch(0.25 0.04 220)",
      secondaryForeground: "oklch(0.985 0 0)",
      muted: "oklch(0.25 0.04 220)",
      mutedForeground: "oklch(0.68 0.04 200)",
      accent: "oklch(0.28 0.05 220)",
      accentForeground: "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.65 0.18 200)",
      chart1: "oklch(0.65 0.18 200)",
      chart2: "oklch(0.6 0.15 180)",
      chart3: "oklch(0.55 0.12 220)",
      chart4: "oklch(0.7 0.12 160)",
      chart5: "oklch(0.5 0.16 240)",
      sidebar: "oklch(0.18 0.03 220)",
      sidebarForeground: "oklch(0.985 0 0)",
      sidebarPrimary: "oklch(0.65 0.18 200)",
      sidebarPrimaryForeground: "oklch(0.985 0 0)",
      sidebarAccent: "oklch(0.28 0.05 220)",
      sidebarAccentForeground: "oklch(0.985 0 0)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.65 0.18 200)",
    },
  },
  slate: {
    id: "slate",
    name: "Slate Gray",
    description: "Minimal & Clean",
    emoji: "🖤",
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      cardForeground: "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      popoverForeground: "oklch(0.145 0 0)",
      primary: "oklch(0.205 0 0)",
      primaryForeground: "oklch(0.985 0 0)",
      secondary: "oklch(0.97 0 0)",
      secondaryForeground: "oklch(0.205 0 0)",
      muted: "oklch(0.97 0 0)",
      mutedForeground: "oklch(0.556 0 0)",
      accent: "oklch(0.97 0 0)",
      accentForeground: "oklch(0.205 0 0)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      ring: "oklch(0.708 0 0)",
      chart1: "oklch(0.45 0.02 260)",
      chart2: "oklch(0.55 0.02 220)",
      chart3: "oklch(0.4 0.02 280)",
      chart4: "oklch(0.6 0.02 200)",
      chart5: "oklch(0.35 0.02 240)",
      sidebar: "oklch(0.985 0 0)",
      sidebarForeground: "oklch(0.145 0 0)",
      sidebarPrimary: "oklch(0.205 0 0)",
      sidebarPrimaryForeground: "oklch(0.985 0 0)",
      sidebarAccent: "oklch(0.97 0 0)",
      sidebarAccentForeground: "oklch(0.205 0 0)",
      sidebarBorder: "oklch(0.922 0 0)",
      sidebarRing: "oklch(0.708 0 0)",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.205 0 0)",
      cardForeground: "oklch(0.985 0 0)",
      popover: "oklch(0.205 0 0)",
      popoverForeground: "oklch(0.985 0 0)",
      primary: "oklch(0.922 0 0)",
      primaryForeground: "oklch(0.205 0 0)",
      secondary: "oklch(0.269 0 0)",
      secondaryForeground: "oklch(0.985 0 0)",
      muted: "oklch(0.269 0 0)",
      mutedForeground: "oklch(0.708 0 0)",
      accent: "oklch(0.269 0 0)",
      accentForeground: "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0 0)",
      chart1: "oklch(0.7 0.02 260)",
      chart2: "oklch(0.65 0.02 220)",
      chart3: "oklch(0.6 0.02 280)",
      chart4: "oklch(0.75 0.02 200)",
      chart5: "oklch(0.55 0.02 240)",
      sidebar: "oklch(0.205 0 0)",
      sidebarForeground: "oklch(0.985 0 0)",
      sidebarPrimary: "oklch(0.922 0 0)",
      sidebarPrimaryForeground: "oklch(0.205 0 0)",
      sidebarAccent: "oklch(0.269 0 0)",
      sidebarAccentForeground: "oklch(0.985 0 0)",
      sidebarBorder: "oklch(1 0 0 / 10%)",
      sidebarRing: "oklch(0.556 0 0)",
    },
  },
} as const;

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(
  undefined,
);

// Helper to convert camelCase to kebab-case
const toKebabCase = (str: string) =>
  str.replace(/([A-Z])/g, "-$1").toLowerCase();

// Helper to get initial theme from localStorage
const getStoredTheme = (
  storageKey: string,
  defaultTheme: ColorTheme,
): ColorTheme => {
  if (typeof window === "undefined") return defaultTheme;
  const stored = localStorage.getItem(storageKey) as ColorTheme | null;
  return stored && colorThemes[stored] ? stored : defaultTheme;
};

// Apply CSS variables to document
const applyThemeStyles = (colorTheme: ColorTheme) => {
  if (typeof window === "undefined") return;

  const theme = colorThemes[colorTheme];
  const styleId = "color-theme-vars";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const lightVars = theme.light;
  const lightCssVars = Object.entries(lightVars)
    .map(([key, value]) => `--${toKebabCase(key)}: ${value};`)
    .join("\n        ");

  const darkVars = theme.dark;
  const darkCssVars = Object.entries(darkVars)
    .map(([key, value]) => `--${toKebabCase(key)}: ${value};`)
    .join("\n        ");

  styleEl.textContent = `
    :root {
      ${lightCssVars}
    }
    .dark {
      ${darkCssVars}
    }
  `;
};

// Storage event listeners for cross-tab sync
const listeners = new Set<() => void>();

export function ColorThemeProvider({
  children,
  defaultTheme = "sky",
  storageKey = "learnops-color-theme",
}: ColorThemeProviderProps) {
  const subscribe = useCallback(
    (callback: () => void) => {
      listeners.add(callback);

      const handleStorage = (e: StorageEvent) => {
        if (e.key === storageKey) {
          callback();
        }
      };
      window.addEventListener("storage", handleStorage);

      return () => {
        listeners.delete(callback);
        window.removeEventListener("storage", handleStorage);
      };
    },
    [storageKey],
  );

  const getSnapshot = useCallback(
    () => getStoredTheme(storageKey, defaultTheme),
    [storageKey, defaultTheme],
  );

  const getServerSnapshot = useCallback(() => defaultTheme, [defaultTheme]);

  const colorTheme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Apply styles whenever theme changes
  React.useEffect(() => {
    applyThemeStyles(colorTheme);
  }, [colorTheme]);

  const setColorTheme = useCallback(
    (theme: ColorTheme) => {
      localStorage.setItem(storageKey, theme);
      applyThemeStyles(theme);
      listeners.forEach((listener) => listener());
    },
    [storageKey],
  );

  const value = React.useMemo(
    () => ({
      colorTheme,
      setColorTheme,
      themes: colorThemes,
    }),
    [colorTheme, setColorTheme],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider");
  }
  return context;
}

export { colorThemes };
