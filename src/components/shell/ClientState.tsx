"use client";
import * as React from "react";

/** The client portal has two states: before and after incorporation (R-34). */
const Ctx = React.createContext<{ incorporated: boolean; set: (v: boolean) => void }>({ incorporated: false, set: () => {} });

export function ClientStateProvider({ children }: { children: React.ReactNode }) {
  const [incorporated, setInc] = React.useState(false);
  React.useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("state");
      if (q) {
        const v = q === "after";
        localStorage.setItem("vcfo-client-state", v ? "after" : "before");
        setInc(v);
        return;
      }
      setInc(localStorage.getItem("vcfo-client-state") === "after");
    } catch {}
  }, []);
  // Follow a switch made in another frame (the Mobile 390 preview and the page around it).
  React.useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key === "vcfo-client-state" && e.newValue) setInc(e.newValue === "after");
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);
  const set = (v: boolean) => {
    setInc(v);
    try {
      localStorage.setItem("vcfo-client-state", v ? "after" : "before");
    } catch {}
  };
  return <Ctx.Provider value={{ incorporated, set }}>{children}</Ctx.Provider>;
}

export const useClientState = () => React.useContext(Ctx);
