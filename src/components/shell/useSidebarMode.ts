"use client";
import * as React from "react";

/**
 * R-49: the sidebar has two kept modes and one passing state.
 * - "pinned": 248 px, the page sits beside it.
 * - "rail": 56 px of icons; the page uses the width.
 * - peek (passing): in rail mode, hover or keyboard focus opens the full sidebar over the page. It closes when the pointer leaves.
 * The kept mode is saved per browser. Under 1100 px the sidebar is a rail whatever is saved, so the page keeps its room.
 */
export type SidebarMode = "pinned" | "rail";

const KEY = "vcfo-sidebar";
const EVENT = "vcfo:sidebar";
const NARROW = "(max-width: 1099px)";

function readSaved(): SidebarMode {
  try {
    return localStorage.getItem(KEY) === "rail" ? "rail" : "pinned";
  } catch {
    return "pinned";
  }
}

/** Toggle the kept mode from anywhere (the "[" key, the pin button). */
export function toggleSidebar() {
  window.dispatchEvent(new Event(EVENT));
}

export function useSidebarMode() {
  const [saved, setSaved] = React.useState<SidebarMode>("pinned");
  const [narrow, setNarrow] = React.useState(false);

  React.useEffect(() => {
    setSaved(readSaved());
    const mq = window.matchMedia(NARROW);
    const onMq = () => setNarrow(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  const setMode = React.useCallback((m: SidebarMode) => {
    setSaved(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* private window: the mode lasts for this visit only */
    }
  }, []);

  const mode: SidebarMode = narrow ? "rail" : saved;
  const toggle = React.useCallback(() => setMode(mode === "pinned" ? "rail" : "pinned"), [mode, setMode]);

  React.useEffect(() => {
    const onEvent = () => toggle();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener(EVENT, onEvent);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(EVENT, onEvent);
      window.removeEventListener("keydown", onKey);
    };
  }, [toggle]);

  return { mode, narrow, toggle };
}

/**
 * Hover intent for the rail: open after a short pause so a pointer that only crosses the rail does not open it;
 * close after a short grace so a pointer that slips off the edge does not snap it shut.
 */
export function usePeek(enabled: boolean, openDelay = 160, closeDelay = 280) {
  const [peek, setPeek] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  React.useEffect(() => {
    if (!enabled) {
      clear();
      setPeek(false);
    }
  }, [enabled]);
  React.useEffect(() => clear, []);

  const onEnter = () => {
    if (!enabled) return;
    clear();
    timer.current = setTimeout(() => setPeek(true), openDelay);
  };
  const onLeave = (e?: React.MouseEvent | React.FocusEvent) => {
    if (!enabled) return;
    // Keep it open while focus or a menu is still inside.
    const next = (e as React.FocusEvent | undefined)?.relatedTarget as Node | null | undefined;
    if (next && (e?.currentTarget as HTMLElement | undefined)?.contains(next)) return;
    clear();
    timer.current = setTimeout(() => setPeek(false), closeDelay);
  };
  const openNow = () => {
    if (!enabled) return;
    clear();
    setPeek(true);
  };
  const closeNow = () => {
    clear();
    setPeek(false);
  };
  return { peek, onEnter, onLeave, openNow, closeNow };
}
