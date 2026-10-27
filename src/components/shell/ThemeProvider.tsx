"use client";
import * as React from "react";

type Theme = "light" | "dark";
const Ctx = React.createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("light");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("vcfo-theme") as Theme | null;
      const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const t = saved ?? sys;
      setTheme(t);
      document.documentElement.dataset.theme = t;
    } catch {}
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((t) => {
      const n: Theme = t === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = n;
      try {
        localStorage.setItem("vcfo-theme", n);
      } catch {}
      return n;
    });
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => React.useContext(Ctx);

/** Inline script: sets the theme before paint so there is no flash. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('vcfo-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}})()`;
