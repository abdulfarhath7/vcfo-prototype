"use client";
import * as React from "react";
import { useTheme } from "@/components/shell/ThemeProvider";

/*
 * Theme Light / Dark / System for the Appearance controls (settings_redesign, Profile · Appearance).
 * ThemeProvider only knows light and dark, and saves the choice in "vcfo-theme".
 * "System" removes that saved choice, so the provider and THEME_SCRIPT fall back to prefers-color-scheme on the next load.
 * While this hook is mounted, it also follows a live change of prefers-color-scheme.
 * On other pages, ThemeProvider follows a live change while no theme is saved.
 */

export type ThemeMode = "light" | "dark" | "system";
const MODE_KEY = "vcfo-theme-mode";

const systemTheme = () => {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
};

export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  const { theme, toggle } = useTheme();
  const [mode, setModeState] = React.useState<ThemeMode>("light");

  // First read: "system" when nothing is saved, or when the saved mode is system and the top bar did not override it.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("vcfo-theme");
      const m = localStorage.getItem(MODE_KEY);
      setModeState(!saved ? "system" : m === "system" ? "system" : (saved as ThemeMode));
    } catch {}
  }, []);

  // Keep the provider and storage in step with the mode.
  React.useEffect(() => {
    if (mode !== "system") return;
    if (theme !== systemTheme()) {
      // The theme moved away from the system value: the top bar toggle picked a fixed theme.
      setModeState(theme);
      try {
        localStorage.setItem(MODE_KEY, theme);
      } catch {}
      return;
    }
    try {
      localStorage.removeItem("vcfo-theme");
    } catch {}
  }, [mode, theme]);

  const setMode = React.useCallback(
    (m: ThemeMode) => {
      const target = m === "system" ? systemTheme() : m;
      setModeState(m);
      try {
        localStorage.setItem(MODE_KEY, m);
      } catch {}
      if (target !== theme) toggle();
      else if (m !== "system") {
        try {
          localStorage.setItem("vcfo-theme", m);
        } catch {}
      }
    },
    [theme, toggle],
  );

  return { mode, setMode };
}
