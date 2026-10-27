"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { barFill } from "@/components/ui/Bar";
import { initials } from "@/components/ui/Avatar";
import { FoldButton } from "@/components/shell/StaffSidebarExtras";
import { FIRM_CLIENTS, MANAGERS } from "@/data/super";

// Super admin sidebar extras. Ported from reference/old-patch/super/Side.dc.html.
// Blocks: folded client list under Clients (four clients, the open client, "View all 17") and
// folded manager list under Team (initials, name, client count).
// The shared Sidebar mounts SuperClientsFold under "Clients" and SuperManagersFold under "Team" with a FoldButton.
// `SuperSidebarExtras` renders both blocks for a standalone view.

const PICKED = "bg-navy-on font-semibold text-white shadow-[inset_3px_0_0_var(--brand)]";
const CHILD = "flex h-7 items-center gap-2 rounded-md px-2 text-12.5 hover:bg-white/[.06]";
const PILL = "flex-none rounded-sm bg-white/[.1] px-1.5 text-[10px] font-semibold leading-[16px] text-navy-ink";
const FOLD_IDS = ["northwind", "bluefin", "corvid", "zenith"];

/** Fold state per block, kept for the browser tab (old prototype: sessionStorage "vcfo.nav.<key>"). */
export function useSuperFold(key: "clients" | "managers"): [boolean, () => void] {
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(`vcfo.nav.super.${key}`) === "0") setOpen(false);
    } catch {
      /* storage blocked: stay open */
    }
  }, [key]);
  const toggle = () =>
    setOpen((o) => {
      try {
        sessionStorage.setItem(`vcfo.nav.super.${key}`, o ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !o;
    });
  return [open, toggle];
}

/** Folded client list: identity colour, short name, phase. The open client joins the list. */
export function SuperClientsFold({ open = true }: { open?: boolean }) {
  const path = usePathname();
  if (!open) return null;
  const cur = FIRM_CLIENTS.find((c) => path.startsWith(`/super/clients/${c.id}`));
  const base = FIRM_CLIENTS.filter((c) => FOLD_IDS.includes(c.id));
  const list = cur && !base.includes(cur) ? [...base, cur] : base;
  return (
    <div className="grid gap-px pb-1.5 pl-[18px] pt-0.5">
      {list.map((c) => {
        const on = cur?.id === c.id;
        return (
          <Link key={c.id} href={`/super/clients/${c.id}`} aria-current={on ? "page" : undefined} title={`${c.name} · ${c.manager}`} className={cn(CHILD, on ? PICKED : "text-navy-ink")}>
            <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[c.tone])} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{c.short}</span>
            <span className={PILL}>{c.stage === "incorporating" ? "Inc" : "Cmp"}</span>
          </Link>
        );
      })}
      <Link href="/super/clients" className="flex h-[26px] items-center px-2 text-12 font-semibold text-navy-ink hover:text-white">
        View all {FIRM_CLIENTS.length}
      </Link>
    </div>
  );
}

/** Folded manager list: initials tile, name and client count. Opens the team page. */
export function SuperManagersFold({ open = true }: { open?: boolean }) {
  if (!open) return null;
  return (
    <div className="grid gap-px pb-1.5 pl-[18px] pt-0.5">
      {MANAGERS.map((m) => {
        const n = FIRM_CLIENTS.filter((c) => c.manager === m.name).length;
        return (
          <Link key={m.id} href="/super/team" title={`${m.name} · ${n} clients`} className={cn(CHILD, "text-navy-ink")}>
            <span className="grid h-5 w-5 flex-none place-items-center rounded-[6px] bg-white/[.12] text-[9px] font-semibold text-white" aria-hidden>
              {initials(m.name)}
            </span>
            <span className="min-w-0 flex-1 truncate">{m.name}</span>
            <span className={PILL}>{n} clients</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Standalone view of both blocks with their fold buttons, on navy. */
export function SuperSidebarExtras({ className }: { className?: string }) {
  const [clientsOpen, toggleClients] = useSuperFold("clients");
  const [mgrsOpen, toggleMgrs] = useSuperFold("managers");
  return (
    <div className={cn("grid gap-1 bg-navy p-2 text-navy-ink", className)}>
      <div className="flex items-center gap-2 px-2 text-12.5 font-semibold text-white">
        <span className="flex-1">Clients</span>
        <FoldButton open={clientsOpen} onToggle={toggleClients} label="clients" />
      </div>
      <SuperClientsFold open={clientsOpen} />
      <div className="flex items-center gap-2 px-2 text-12.5 font-semibold text-white">
        <span className="flex-1">Managers</span>
        <FoldButton open={mgrsOpen} onToggle={toggleMgrs} label="managers" />
      </div>
      <SuperManagersFold open={mgrsOpen} />
    </div>
  );
}
