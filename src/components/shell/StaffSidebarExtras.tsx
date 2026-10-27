"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Mail } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY } from "@/lib/dates";
import { barFill } from "@/components/ui/Bar";
import { Avatar, initials } from "@/components/ui/Avatar";
import { clientsFor, STAFF_CLIENTS, type StaffPortal } from "@/data/staff-clients";
import { TASKS } from "@/data/staff-tasks";
import { calendarFor } from "@/data/staff-compliance";
import { LEADS, MANAGERS } from "@/data/staff-team";

// Staff sidebar extras. Ported from reference/old-screens/s/lead/Side.dc.html, s/mgr/Side.dc.html and s/admin/Side.dc.html.
// Blocks: folded client list under Clients, folded project leads (manager) or managers (admin), the month calendar with due days,
// "Your manager" with a mail button, and the "New" tag on Compliances.
// The shared Sidebar mounts these pieces. `StaffSidebarExtras` renders them all for a standalone view.

const PICKED = "bg-navy-on font-semibold text-white shadow-[inset_3px_0_0_var(--brand)]";
const CHILD = "flex h-7 items-center gap-2 rounded-md px-2 text-12.5 hover:bg-white/[.06]";
const PILL = "flex-none rounded-sm bg-white/[.1] px-1.5 text-[10px] font-semibold leading-[16px] text-navy-ink";

/** Fold state per block, kept for the browser tab (old prototype: sessionStorage "vcfo.nav.<key>"). */
function useFold(key: string): [boolean, () => void] {
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(`vcfo.nav.${key}`) === "0") setOpen(false);
    } catch {
      /* storage blocked: stay open */
    }
  }, [key]);
  const toggle = () =>
    setOpen((o) => {
      try {
        sessionStorage.setItem(`vcfo.nav.${key}`, o ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !o;
    });
  return [open, toggle];
}

/** Plain chevron fold button (R-24). Place it at the right of a nav row. */
export function FoldButton({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={`${open ? "Hide" : "Show"} ${label}`}
      title={`${open ? "Hide" : "Show"} ${label}`}
      className="grid h-7 w-7 flex-none place-items-center rounded-md text-navy-faint hover:bg-white/[.08] hover:text-white"
    >
      <ChevronDown size={14} strokeWidth={1.5} className={cn("transition-transform", open && "rotate-180")} aria-hidden />
    </button>
  );
}

/** "New" tag after the Compliances label (lead and manager). */
export function NewTag() {
  return <span className="rounded-sm bg-white/[.12] px-1.5 text-[10px] font-semibold leading-[16px] text-navy-ink">New</span>;
}

/** Portals that show the "New" tag on Compliances. */
export const showsCompliancesNew = (portal: StaffPortal) => portal !== "admin";

/** Clients shown in the fold: the first four, plus the open client when it is not one of them. */
function foldClients(portal: StaffPortal, path: string) {
  const all = clientsFor(portal);
  const open = all.find((c) => path.startsWith(`/${portal}/clients/${c.id}`));
  const list = all.slice(0, 4);
  return { all, list: open && !list.includes(open) ? [...list, open] : list, open };
}

/** Folded client list under Clients: identity colour, short name, phase. "View all N" opens the grid. */
export function ClientsFold({ portal, open = true }: { portal: StaffPortal; open?: boolean }) {
  const path = usePathname();
  const { all, list, open: cur } = foldClients(portal, path);
  if (!open) return null;
  return (
    <div className="grid gap-px pb-1.5 pl-[18px] pt-0.5">
      {list.map((c) => {
        const on = cur?.id === c.id;
        return (
          <Link
            key={c.id}
            href={`/${portal}/clients/${c.id}`}
            aria-current={on ? "page" : undefined}
            title={`${c.name} · ${c.stage === "incorporating" ? "Incorporating" : "Compliance"} · ${c.code}`}
            className={cn(CHILD, on ? PICKED : "text-navy-ink")}
          >
            <i className={cn("h-2 w-2 flex-none rounded-[2px]", barFill[c.tone])} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{c.short}</span>
            <span className={PILL}>{c.stage === "incorporating" ? "Inc" : "Cmp"}</span>
          </Link>
        );
      })}
      <Link href={`/${portal}/clients`} className="flex h-[26px] items-center px-2 text-12 font-semibold text-navy-ink hover:text-white">
        View all {all.length}
      </Link>
    </div>
  );
}

/** 20 px initials tile on navy. */
function Ini({ name }: { name: string }) {
  return (
    <span className="grid h-5 w-5 flex-none place-items-center rounded-[6px] bg-white/[.12] text-[9px] font-semibold text-white" aria-hidden>
      {initials(name)}
    </span>
  );
}

/** Manager portal: folded project-lead list under Project leads. */
export function LeadsFold({ open = true }: { open?: boolean }) {
  const path = usePathname();
  if (!open) return null;
  const leads = LEADS.filter((l) => l.manager === "Pranay");
  return (
    <div className="grid gap-px pb-1.5 pl-[18px] pt-0.5">
      {leads.map((l) => {
        const n = TASKS.filter((t) => t.owner === l.name && t.status !== "Done").length;
        const slug = l.name.split(" ")[0].toLowerCase();
        return (
          <Link key={l.name} href={`/manager/leads#${slug}`} title={`${l.name} · ${n} open tasks`} className={cn(CHILD, path === "/manager/leads" ? "text-white" : "text-navy-ink")}>
            <Ini name={l.name} />
            <span className="min-w-0 flex-1 truncate">{l.name}</span>
            <span className={PILL}>{n} open</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Admin portal: folded manager list under Managers. */
export function ManagersFold({ open = true }: { open?: boolean }) {
  if (!open) return null;
  return (
    <div className="grid gap-px pb-1.5 pl-[18px] pt-0.5">
      {MANAGERS.map((m) => {
        const n = STAFF_CLIENTS.filter((c) => c.manager === m.name).length;
        const slug = m.name.split(" ")[0].toLowerCase();
        return (
          <Link key={m.name} href={`/admin/managers#${slug}`} title={`${m.name} · ${n} clients`} className={cn(CHILD, "text-navy-ink")}>
            <Ini name={m.name} />
            <span className="min-w-0 flex-1 truncate">{m.name}</span>
            <span className={PILL}>{n} clients</span>
          </Link>
        );
      })}
    </div>
  );
}

type Mark = "bad" | "warn" | "ok" | "accent";
const markLine: Record<Mark, string> = { bad: "shadow-[inset_0_-2px_0_var(--bad-mid)]", warn: "shadow-[inset_0_-2px_0_var(--warn-mid)]", ok: "shadow-[inset_0_-2px_0_var(--ok-mid)]", accent: "shadow-[inset_0_-2px_0_var(--accent)]" };
const rank: Record<Mark, number> = { bad: 3, warn: 2, accent: 1, ok: 0 };

/** Due days in the month of TODAY: filings from the staff calendar and open task dates. The worst status of the day sets the mark. */
export function dueDays(portal: StaffPortal): Map<number, Mark> {
  const y = TODAY.getFullYear();
  const m = TODAY.getMonth();
  const out = new Map<number, Mark>();
  const put = (day: number, mk: Mark) => {
    const old = out.get(day);
    if (!old || rank[mk] > rank[old]) out.set(day, mk);
  };
  for (const e of calendarFor(portal)) {
    if (e.date.getFullYear() !== y || e.date.getMonth() !== m) continue;
    put(e.date.getDate(), e.status === "Filed" ? "ok" : e.status === "Overdue" ? "bad" : e.status === "Due soon" ? "warn" : "accent");
  }
  const mine = portal === "lead" ? TASKS.filter((t) => t.owner === "Bharath") : portal === "manager" ? TASKS.filter((t) => clientsFor("manager").some((c) => c.id === t.client)) : TASKS;
  for (const t of mine) {
    if (t.due.getFullYear() !== y || t.due.getMonth() !== m) continue;
    put(t.due.getDate(), t.status === "Done" ? "ok" : t.status === "Overdue" ? "bad" : t.due.getTime() - TODAY.getTime() <= 7 * 86400000 ? "warn" : "accent");
  }
  return out;
}

const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Month calendar with "Due days" marks. Opens the compliance calendar. Lead and manager. */
export function MiniCalendar({ portal }: { portal: StaffPortal }) {
  const y = TODAY.getFullYear();
  const m = TODAY.getMonth();
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(y, m + 1, 0).getDate();
  const marks = dueDays(portal);
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <Link href={`/${portal}/compliances/calendar`} title="Open compliance calendar" className="block border-t border-navy-line pt-2.5 text-white">
      <span className="mb-1 flex justify-between text-11.5 font-bold">
        <span>
          {MONTH[m]} {y}
        </span>
        <span className="font-medium text-navy-faint">Due days</span>
      </span>
      <span className="grid grid-cols-7 gap-px text-center text-[10px] font-medium text-navy-faint">
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => (
          <span key={`w${i}`} className="h-4 font-semibold" aria-hidden>
            {w}
          </span>
        ))}
        {cells.map((n, i) => {
          if (n === null) return <span key={`e${i}`} />;
          const mk = marks.get(n);
          const today = n === TODAY.getDate();
          return (
            <span
              key={n}
              className={cn("grid h-[17px] place-items-center rounded-[3px]", today ? "bg-navy-on font-semibold text-white ring-1 ring-inset ring-accent" : mk && cn("text-white", markLine[mk]))}
              aria-label={mk ? `${n} ${MONTH[m]}: due` : undefined}
            >
              {n}
            </span>
          );
        })}
      </span>
    </Link>
  );
}

const REPORTS_TO: Record<StaffPortal, { name: string; role: string } | null> = {
  lead: { name: "Pranay", role: "Manager" },
  manager: { name: "Krishna", role: "Admin" },
  admin: null,
};

/** "Your manager" row with a mail button (lead: Pranay; manager: Krishna). */
export function ReportsTo({ portal }: { portal: StaffPortal }) {
  const p = REPORTS_TO[portal];
  if (!p) return null;
  return (
    <div className="border-t border-navy-line pt-3">
      <div className="mb-2 text-[10.5px] font-semibold text-navy-faint">{portal === "lead" ? "Your manager" : "Your admin"}</div>
      <div className="flex h-[34px] items-center gap-2">
        <Avatar name={p.name} size={24} onNavy />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-12.5 font-bold text-white">{p.name}</span>
          <span className="block truncate text-11 text-navy-faint">{p.role}</span>
        </span>
        <Link href={`/${portal}/email?to=${p.name.toLowerCase()}`} aria-label={`Email ${p.name}`} title={`Email ${p.name}`} className="grid h-7 w-7 place-items-center rounded-md bg-white/[.08] text-white hover:bg-white/[.14]">
          <Mail size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}

/** Nav row used by the standalone view. The shared Sidebar has its own row; it mounts only the folds. */
function Row({ href, label, count, fold }: { href: string; label: string; count?: number; fold?: React.ReactNode }) {
  const path = usePathname();
  const on = path === href || path.startsWith(`${href}/`);
  return (
    <div className="flex items-center">
      <Link href={href} aria-current={on ? "page" : undefined} className={cn("flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 text-13.5 font-medium text-navy-ink hover:bg-white/[.06]", on && PICKED)}>
        <span className="truncate">{label}</span>
        {count !== undefined && <span className="ml-auto inline-grid h-[18px] min-w-[20px] place-items-center rounded-sm bg-white/[.12] px-1.5 text-11 font-bold text-white">{count}</span>}
      </Link>
      {fold}
    </div>
  );
}

/** The three staff blocks in one column: people folds, the due-day calendar and "Your manager". Use it on a navy background. */
export function StaffSidebarExtras({ portal, className }: { portal: StaffPortal; className?: string }) {
  const [cOpen, cToggle] = useFold("clients");
  const [pOpen, pToggle] = useFold(portal === "admin" ? "managers" : "leads");
  const nClients = clientsFor(portal).length;
  return (
    <div className={cn("grid gap-2.5 text-navy-ink", className)}>
      <div className="grid gap-0.5">
        {portal === "manager" && (
          <>
            <Row href="/manager/leads" label="Project leads" count={LEADS.filter((l) => l.manager === "Pranay").length} fold={<FoldButton open={pOpen} onToggle={pToggle} label="leads" />} />
            <LeadsFold open={pOpen} />
          </>
        )}
        {portal === "admin" && (
          <>
            <Row href="/admin/managers" label="Managers" count={MANAGERS.length} fold={<FoldButton open={pOpen} onToggle={pToggle} label="managers" />} />
            <ManagersFold open={pOpen} />
          </>
        )}
        <Row href={`/${portal}/clients`} label="Clients" count={nClients} fold={<FoldButton open={cOpen} onToggle={cToggle} label="clients" />} />
        <ClientsFold portal={portal} open={cOpen} />
        {showsCompliancesNew(portal) && (
          <div className="flex h-9 items-center gap-2.5 px-2.5 text-13.5 font-medium">
            Compliances <NewTag />
          </div>
        )}
      </div>
      {portal !== "admin" && <MiniCalendar portal={portal} />}
      <ReportsTo portal={portal} />
    </div>
  );
}

/** Hook for the shared Sidebar: fold state for one block. */
export { useFold as useStaffFold };
