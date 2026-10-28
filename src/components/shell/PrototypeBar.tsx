"use client";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PORTALS, screensFor, type Portal } from "@/data/nav";
import { useClientState } from "./ClientState";

// The floating prototype control (old reference/old-screens/proto.js, buildBar).
// It is prototype chrome, not product UI. It shows on every portal page, not on the landing and sign-in pages.
// PROTOTYPE · Back · portal switch · Before COI | After COI (client only) · Desktop | Mobile 390 · screen picker · close.

const KEY_HIDDEN = "vcfo-proto-bar";
const KEY_DEVICE = "vcfo-proto-device";
type Device = "desktop" | "mobile";

/** Picker prefix per portal (old routes.js titles: "Lead · Today", "Super admin · Overview"; client rows have none). */
const PREFIX: Record<Portal, string> = { client: "", lead: "Lead · ", manager: "Manager · ", admin: "Admin · ", super: "Super admin · ", dev: "Developer · " };

const ROLE_ORDER: Array<[Portal, React.ReactNode]> = [
  ["client", "Client"],
  ["lead", "Lead"],
  ["manager", "Manager"],
  ["admin", "Admin"],
  ["super", <>Super<br />admin</>],
  ["dev", "Developer"],
];

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {
    /* storage blocked: the state lasts for this page only */
  }
}

/** True inside the Mobile 390 frame. The frame shows the page only, without the bar. */
function useInFrame() {
  const [inFrame, setInFrame] = React.useState(false);
  React.useEffect(() => {
    try {
      setInFrame(window.self !== window.top);
    } catch {
      setInFrame(true);
    }
  }, []);
  return inFrame;
}

function Seg<T extends string | boolean>({ opts, value, onPick, pickedCls, label }: { opts: Array<[T, React.ReactNode]>; value: T; onPick: (v: T) => void; pickedCls: string; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-none rounded-lg bg-white/[.1] p-0.5">
      {opts.map(([v, text]) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={v === value}
          onClick={() => onPick(v)}
          className={cn("h-[30px] whitespace-nowrap rounded-md px-2 text-12 font-semibold leading-[1.05]", v === value ? pickedCls : "text-white/[.75] hover:text-white")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** The client Before | After COI switch. A separate component, so useClientState runs only on the client portal. */
function CoiSeg() {
  const { incorporated, set } = useClientState();
  return (
    <Seg
      label="Company state"
      opts={[
        [false, <>Before<br />COI</>],
        [true, <>After<br />COI</>],
      ]}
      value={incorporated}
      onPick={set}
      pickedCls="bg-surface text-ink"
    />
  );
}

export function PrototypeBar({ portal, incorporated = false }: { portal: Portal; incorporated?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const inFrame = useInFrame();
  const [hidden, setHidden] = React.useState(true);
  const [device, setDevice] = React.useState<Device>("desktop");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const h = read(KEY_HIDDEN);
    // proto.js: the bar starts hidden on narrow screens until someone opens it.
    setHidden(h === null ? window.innerWidth < 700 : h === "hidden");
    setDevice(read(KEY_DEVICE) === "mobile" ? "mobile" : "desktop");
    setReady(true);
  }, []);

  const mobile = ready && !inFrame && device === "mobile";
  React.useEffect(() => {
    if (!mobile) return;
    const de = document.documentElement;
    const prev = de.style.overflow;
    de.style.overflow = "hidden";
    return () => {
      de.style.overflow = prev;
    };
  }, [mobile]);

  if (!ready || inFrame) return null;

  const screens = screensFor(portal, incorporated);
  // The picked screen is the longest href that starts the path.
  const current = screens.reduce<string>((best, s) => (path === s.href || path.startsWith(s.href + "/") ? (s.href.length > best.length ? s.href : best) : best), "");

  const hide = (v: boolean) => {
    setHidden(v);
    write(KEY_HIDDEN, v ? "hidden" : "shown");
  };
  const pickDevice = (v: Device) => {
    setDevice(v);
    write(KEY_DEVICE, v);
  };

  const frame = mobile && (
    <div className="fixed inset-0 z-[60] overflow-auto bg-canvas" aria-label="Mobile preview, 390 px">
      <iframe
        key={path}
        src={path + (typeof window !== "undefined" ? window.location.search : "")}
        title="Mobile preview"
        className="mx-auto mb-24 mt-4 block h-[calc(100vh-112px)] min-h-[600px] w-[390px] rounded-[10px] border border-line bg-canvas"
      />
    </div>
  );

  if (hidden) {
    return (
      <>
        {frame}
        <button
          type="button"
          onClick={() => hide(false)}
          className="fixed bottom-3.5 left-3.5 z-[70] rounded-lg bg-navy px-2.5 py-2 text-11 font-extrabold tracking-[.08em] text-brand md:left-[264px]"
          aria-label="Show prototype controls"
        >
          PROTOTYPE
        </button>
      </>
    );
  }

  return (
    <>
      {frame}
      <div
        role="toolbar"
        aria-label="Prototype controls"
        className={cn(
          "fixed bottom-20 left-1/2 z-[70] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-1.5 overflow-x-auto rounded-[10px] bg-navy p-[5px] text-12 font-semibold text-white [scrollbar-width:none]",
          // Desktop: start 16 px right of the sidebar and stop short of the Ask VCFO button.
          "md:bottom-3.5 md:left-[264px] md:max-w-[calc(100vw-400px)] md:translate-x-0",
          mobile && "md:left-1/2 md:max-w-[calc(100vw-24px)] md:-translate-x-1/2",
        )}
      >
        <span className="flex-none px-2 text-11 font-extrabold uppercase tracking-[.08em] text-brand">Prototype</span>
        <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push(PORTALS[portal].home))} aria-label="Back to the previous screen" className="h-[30px] flex-none rounded-md bg-white/[.12] px-2.5 text-12 font-bold leading-[1.05] hover:bg-white/[.2]">
          &lsaquo;<br />Back
        </button>
        <Seg
          label="Portal"
          opts={ROLE_ORDER}
          value={portal}
          onPick={(v) => v !== portal && router.push(PORTALS[v].home)}
          pickedCls="bg-brand text-navy"
        />
        {portal === "client" && <CoiSeg />}
        <Seg
          label="Device"
          opts={[
            ["desktop", "Desktop"],
            ["mobile", <>Mobile<br />390</>],
          ]}
          value={device}
          onPick={pickDevice}
          pickedCls="bg-surface text-ink"
        />
        <span className="relative flex-none">
          <select
            aria-label="Go to page"
            value={current}
            onChange={(e) => e.target.value && router.push(e.target.value)}
            className="h-[30px] w-[190px] appearance-none truncate rounded-md border-0 bg-white/[.12] pl-2 pr-7 text-12 font-semibold text-white"
          >
            {!current && <option value="">{PORTALS[portal].title}</option>}
            {screens.map((s) => (
              <option key={s.href} value={s.href} className="bg-surface text-ink">
                {PREFIX[portal]}
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} strokeWidth={1.5} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" aria-hidden />
        </span>
        <button type="button" onClick={() => hide(true)} aria-label="Hide prototype controls" className="grid h-[26px] w-[26px] flex-none place-items-center rounded-md text-white/[.7] hover:text-white">
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>
    </>
  );
}
