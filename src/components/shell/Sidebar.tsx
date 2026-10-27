"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { PORTALS, navFor, type NavItem, type Portal } from "@/data/nav";
import { ClientsFold, FoldButton, LeadsFold, ManagersFold, MiniCalendar, NewTag, ReportsTo, showsCompliancesNew, useStaffFold } from "./StaffSidebarExtras";
import { SuperClientsFold, SuperManagersFold, useSuperFold } from "./SuperSidebarExtras";

type StaffPortal = "lead" | "manager" | "admin";
const isStaff = (p: Portal): p is StaffPortal => p === "lead" || p === "manager" || p === "admin";

/** A folded list under a nav row: people or clients (old Side.dc.html). */
interface Fold {
  open: boolean;
  toggle: () => void;
  label: string;
  body: React.ReactNode;
}

function Count({ n, hot }: { n?: string | number; hot?: boolean }) {
  if (n === undefined) return null;
  return (
    <span className={cn("ml-auto inline-grid h-[18px] min-w-[20px] place-items-center rounded-sm px-1.5 text-11 font-bold", hot ? "bg-bad-soft text-bad" : "bg-white/[.12] text-white")}>
      {n}
    </span>
  );
}

function Item({ item, path, depth = 0, fold, tag }: { item: NavItem; path: string; depth?: number; fold?: Fold; tag?: React.ReactNode }) {
  const active = !!item.href && (path === item.href || path.startsWith(item.href + "/"));
  const holds = item.kids?.some((k) => k.href && path.startsWith(k.href)) ?? false;
  const [open, setOpen] = React.useState(holds);
  React.useEffect(() => {
    if (holds) setOpen(true);
  }, [holds]);

  if (item.kids) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-13.5 font-medium text-navy-ink hover:bg-white/[.06]",
            holds && !open && "text-white font-semibold",
          )}
        >
          <span>{item.label}</span>
          {tag}
          <Count n={item.count} hot={item.hot} />
          <ChevronDown size={14} strokeWidth={1.5} className={cn("transition-transform", item.count === undefined && "ml-auto", open && "rotate-180")} aria-hidden />
        </button>
        {open && (
          <div className="mb-1 grid gap-0.5 pl-3">
            {item.kids.map((k) => (
              <Item key={k.label} item={k} path={path} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const link = (
    <Link
      href={item.href ?? "#"}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 font-medium",
        depth ? "h-[30px] text-12.5 text-navy-faint" : "h-9 text-13.5 text-navy-ink",
        "hover:bg-white/[.06]",
        active && "bg-navy-on font-semibold text-white shadow-[inset_3px_0_0_var(--brand)]",
      )}
    >
      <span className="truncate">{item.label}</span>
      {tag}
      <Count n={item.count} hot={item.hot} />
    </Link>
  );

  if (!fold) return link;
  return (
    <div>
      <div className="flex items-center gap-0.5">
        {link}
        <FoldButton open={fold.open} onToggle={fold.toggle} label={fold.label} />
      </div>
      {fold.body}
    </div>
  );
}

/** Nav rows plus the portal's folded lists. Hooks run on every portal so their order never changes. */
function NavRows({ portal, items, path }: { portal: Portal; items: NavItem[]; path: string }) {
  const [clientsOpen, toggleClients] = useStaffFold("clients");
  const [peopleOpen, togglePeople] = useStaffFold(portal === "admin" ? "managers" : "leads");
  const [superClientsOpen, toggleSuperClients] = useSuperFold("clients");
  const [superMgrsOpen, toggleSuperMgrs] = useSuperFold("managers");

  const foldFor = (label: string): Fold | undefined => {
    if (isStaff(portal)) {
      if (label === "Clients") return { open: clientsOpen, toggle: toggleClients, label: "clients", body: <ClientsFold portal={portal} open={clientsOpen} /> };
      if (label === "Project leads" && portal === "manager") return { open: peopleOpen, toggle: togglePeople, label: "leads", body: <LeadsFold open={peopleOpen} /> };
      if (label === "Managers" && portal === "admin") return { open: peopleOpen, toggle: togglePeople, label: "managers", body: <ManagersFold open={peopleOpen} /> };
    }
    if (portal === "super") {
      if (label === "Clients") return { open: superClientsOpen, toggle: toggleSuperClients, label: "clients", body: <SuperClientsFold open={superClientsOpen} /> };
      if (label === "Team") return { open: superMgrsOpen, toggle: toggleSuperMgrs, label: "managers", body: <SuperManagersFold open={superMgrsOpen} /> };
    }
    return undefined;
  };
  const tagFor = (label: string) => (isStaff(portal) && label === "Compliances" && showsCompliancesNew(portal) ? <NewTag /> : undefined);

  return (
    <nav className="grid gap-0.5" aria-label="Main">
      {items.map((it) => (
        <Item key={it.label} item={it} path={path} fold={foldFor(it.label)} tag={tagFor(it.label)} />
      ))}
    </nav>
  );
}

export function Sidebar({ portal, incorporated, onClose }: { portal: Portal; incorporated?: boolean; onClose?: () => void }) {
  const path = usePathname();
  const meta = PORTALS[portal];
  const items = navFor(portal, incorporated);

  return (
    <aside className="flex h-full w-side flex-none flex-col bg-navy px-3 pb-3 pt-4 text-navy-ink" aria-label="Sidebar">
      <div className="flex h-9 flex-none items-center gap-2 px-2 pb-4">
        <Link href="/" className="flex items-center gap-2" aria-label="VCFO Suite · home">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-12 font-bold text-white">V</span>
          <span className="text-14.5 font-semibold text-white">VCFO Suite</span>
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} className="ml-auto grid h-8 w-8 place-items-center rounded-md hover:bg-white/[.08]" aria-label="Close menu">
            <X size={18} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto pb-3 [scrollbar-width:thin]">
        <NavRows portal={portal} items={items} path={path} />
        {isStaff(portal) && (
          <div className="grid gap-3 px-1">
            {portal !== "admin" && <MiniCalendar portal={portal} />}
            <ReportsTo portal={portal} />
          </div>
        )}
      </div>
      <div className="flex flex-none items-center gap-2.5 border-t border-navy-line pt-3">
        <Link href={meta.profile} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-1 hover:bg-white/[.06]" title="Your profile">
          <Avatar name={meta.person} size={30} onNavy />
          <span className="min-w-0">
            <b className="block truncate text-13 font-semibold text-white">{meta.person}</b>
            <span className="block truncate text-12 text-navy-faint">{meta.role}</span>
          </span>
        </Link>
        <Link href="/sign-in" className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-navy-faint hover:bg-white/[.08] hover:text-white" aria-label="Sign out" title="Sign out">
          <LogOut size={16} strokeWidth={1.5} />
        </Link>
      </div>
    </aside>
  );
}
