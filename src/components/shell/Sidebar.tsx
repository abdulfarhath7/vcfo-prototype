"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Headphones, Keyboard, LogOut, Mail, MessageCircle, MessagesSquare, PanelLeftClose, PanelLeftOpen, Phone, Pin, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { CLIENT_TEAM, PORTALS, navFor, type NavItem, type Portal, type TeamContact } from "@/data/nav";
import { ClientsFold, FoldButton, LeadsFold, ManagersFold, MiniCalendar, NewTag, ReportsTo, showsCompliancesNew, useStaffFold } from "./StaffSidebarExtras";
import { SuperClientsFold, SuperManagersFold, useSuperFold } from "./SuperSidebarExtras";
import { BeforeAfter } from "./BeforeAfter";
import { openAsk } from "./AskButton";
import { openShortcuts } from "./ShortcutSheet";
import { Tip } from "@/components/ui/Tip";
import type { SidebarMode } from "./useSidebarMode";

type StaffPortal = "lead" | "manager" | "admin";
const isStaff = (p: Portal): p is StaffPortal => p === "lead" || p === "manager" || p === "admin";

// Ported from reference/old-screens/shell.js (client) and s/<portal>/Side.dc.html (staff, super, dev).
// R-45: 248 px wide, navy. Rows 34 px, 6 px corners. The picked row has a soft blurple fill and lilac text and icon.
const PICKED = "bg-navy-on font-medium text-navy-on-ink hover:!bg-navy-on hover:!text-navy-on-ink";

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
    <span className={cn("ml-auto inline-grid h-[18px] min-w-[18px] flex-none place-items-center text-12 font-medium", hot ? "rounded-sm bg-bad-mid px-1 text-white" : "text-navy-faint")}>
      {n}
    </span>
  );
}

function Glyph({ item, on }: { item: NavItem; on: boolean }) {
  const Icon = item.icon;
  if (!Icon) return null;
  return <Icon size={16} strokeWidth={1.6} className={cn("flex-none", on ? "text-navy-on-ink" : "text-navy-faint")} aria-hidden />;
}

function Item({ item, path, portal, depth = 0, fold, tag }: { item: NavItem; path: string; portal: Portal; depth?: number; fold?: Fold; tag?: React.ReactNode }) {
  const client = portal === "client";
  const active = !!item.href && (path === item.href || path.startsWith(item.href + "/"));
  const holds = item.kids?.some((k) => k.href && path.startsWith(k.href)) ?? false;
  // Client groups open when they hold the page (shell.js). Staff groups start open (old Side.dc.html) and fold (K-36).
  const [open, setOpen] = React.useState(client ? holds : true);
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
            "flex h-[34px] w-full items-center gap-2.5 rounded-md px-2.5 text-14 font-normal text-navy-ink hover:bg-navy-hover hover:text-white",
            holds && "font-medium text-white",
          )}
        >
          <Glyph item={item} on={holds} />
          <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
          {tag}
          {/* shell.js hides the group count while the group is open */}
          {!(client && open) && <Count n={item.count} hot={item.hot} />}
          {client ? (
            <ChevronRight size={14} strokeWidth={1.6} className={cn("flex-none text-navy-faint transition-transform", open && "rotate-90")} aria-hidden />
          ) : (
            <ChevronDown size={14} strokeWidth={1.6} className={cn("flex-none text-navy-faint transition-transform", open && "rotate-180")} aria-hidden />
          )}
        </button>
        {open &&
          (client ? (
            <div className="relative mb-1 grid gap-0.5 before:absolute before:bottom-1 before:left-[18px] before:top-1 before:w-px before:bg-white/[.14]">
              {item.kids.map((k) => (
                <Item key={k.label} item={k} path={path} portal={portal} depth={depth + 1} />
              ))}
            </div>
          ) : (
            <div className="mb-1 grid pl-[27px]">
              {item.kids.map((k) => (
                <Item key={k.label} item={k} path={path} portal={portal} depth={depth + 1} />
              ))}
            </div>
          ))}
      </div>
    );
  }

  const kidCls = client
    ? cn(
        "h-8 pl-[37px] text-13 text-navy-ink",
        // tree dot on the line (shell.js .vps-sub .vps-i:after)
        "after:absolute after:left-4 after:top-1/2 after:-mt-[2.5px] after:h-[5px] after:w-[5px] after:rounded-[2px] after:bg-navy-faint",
        active && "after:bg-accent-line after:ring-[3px] after:ring-white/[.12]",
      )
    : "h-7 text-13 text-navy-faint";

  const link = (
    <Link
      href={item.href ?? "#"}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 font-normal hover:bg-navy-hover hover:text-white",
        depth ? kidCls : "h-[34px] text-14 text-navy-ink",
        active && PICKED,
      )}
    >
      {!depth && <Glyph item={item} on={active} />}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
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
        <Item key={it.label} item={it} path={path} portal={portal} fold={foldFor(it.label)} tag={tagFor(it.label)} />
      ))}
    </nav>
  );
}

const CONTACT = [
  { key: "wa", verb: "WhatsApp", Icon: MessageCircle },
  { key: "call", verb: "Call", Icon: Phone },
  { key: "mail", verb: "Email", Icon: Mail },
  { key: "teams", verb: "Teams", Icon: MessagesSquare },
] as const;

/** One team row: avatar, "Name · Role". Contact buttons show on hover and focus (shell.js .vps-p). */
function TeamRow({ p }: { p: TeamContact }) {
  const who = p.support ? "support" : p.name;
  return (
    <div tabIndex={0} role="group" aria-label={`${p.name}, ${p.role} · contact`} className="group relative flex h-[38px] items-center gap-[9px] rounded-md px-2 outline-none hover:bg-white/[.06] focus-within:bg-white/[.06]">
      <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-white/[.12] text-11 font-bold text-navy-ink ring-[1.5px] ring-white/[.22]" aria-hidden>
        {p.support ? <Headphones size={14} strokeWidth={1.6} /> : p.ini}
      </span>
      <span className="min-w-0 flex-1 truncate text-12.5 text-white">
        <b className="font-medium">{p.name}</b> <small className="text-[11.5px] text-navy-faint">· {p.role}</small>
      </span>
      <span className="invisible absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-[3px] bg-navy pl-2 opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        {CONTACT.map(({ key, verb, Icon }) => (
          <button
            key={key}
            type="button"
            aria-label={`${verb} ${who}`}
            title={`${verb} ${who}`}
            className={cn("grid h-6 w-6 place-items-center rounded-md text-white", key === "wa" ? "bg-ok-mid hover:bg-ok" : "bg-white/[.12] hover:bg-white/[.22]")}
          >
            <Icon size={14} strokeWidth={1.6} aria-hidden />
          </button>
        ))}
      </span>
    </div>
  );
}

/** "Northwind's team" block above the account row (client portal only). */
function TeamBlock() {
  return (
    <div className="flex-none border-t border-navy-line px-0 pb-1 pt-2.5">
      <div className="mx-2 mb-1.5 text-11.5 font-medium uppercase tracking-[.07em] text-navy-faint">Northwind&rsquo;s team</div>
      {CLIENT_TEAM.map((p) => (
        <TeamRow key={p.name} p={p} />
      ))}
    </div>
  );
}

/** R-49 pin control in the sidebar head. Pinned: "Collapse sidebar". Peeking over the page: "Pin sidebar". */
function PinButton({ mode, peeking, onToggle, narrow }: { mode: SidebarMode; peeking?: boolean; onToggle: () => void; narrow?: boolean }) {
  if (narrow) return null; // under 1100 px the sidebar is always a rail; pinning would cover the page
  const pin = mode === "rail" || peeking;
  const label = pin ? "Pin sidebar" : "Collapse sidebar";
  const Icon = pin ? Pin : PanelLeftClose;
  return (
    <Tip label={label} keys={["["]} side="right">
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-pressed={!pin}
        className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-md text-navy-faint hover:bg-white/[.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <Icon size={16} strokeWidth={1.6} />
      </button>
    </Tip>
  );
}

function railActive(it: NavItem, path: string) {
  const on = (h?: string) => !!h && (path === h || path.startsWith(h + "/"));
  return on(it.href) || (it.kids?.some((k) => on(k.href)) ?? false);
}

/**
 * R-49 rail: 56 px of icons. Hover or focus opens the full sidebar over the page (the Shell handles that).
 * Urgent counts show as a small red badge on the icon; other counts wait for the full sidebar.
 */
export function SidebarRail({ portal, incorporated, onExpand, narrow }: { portal: Portal; incorporated?: boolean; onExpand: () => void; narrow?: boolean }) {
  const path = usePathname();
  const meta = PORTALS[portal];
  const items = navFor(portal, incorporated);
  return (
    <aside className="flex h-full w-14 flex-none flex-col items-center border-r-1.5 border-navy-line bg-navy text-navy-ink" aria-label="Sidebar">
      <div className="flex h-14 w-full flex-none items-center justify-center border-b border-navy-line">
        <Link href={meta.home} aria-label="VCFO Suite · home" className="grid h-9 w-9 place-items-center rounded-md hover:bg-navy-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vcfo-mark.webp" alt="" className="h-[26px] w-[26px] object-contain" />
        </Link>
      </div>
      <nav className="grid min-h-0 w-full flex-1 content-start justify-items-center gap-1 overflow-y-auto py-3 [scrollbar-width:none]" aria-label="Main">
        {items.map((it) => {
          const Icon = it.icon;
          const on = railActive(it, path);
          const href = it.href ?? it.kids?.find((k) => k.href)?.href ?? "#";
          const name = it.count !== undefined ? `${it.label}, ${it.count}` : it.label;
          return (
            <Link
              key={it.label}
              href={href}
              aria-label={name}
              aria-current={on ? "page" : undefined}
              className={cn(
                "relative grid h-9 w-10 place-items-center rounded-md text-navy-faint hover:bg-navy-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                on && PICKED,
              )}
            >
              {Icon && <Icon size={18} strokeWidth={1.6} aria-hidden className={on ? "text-navy-on-ink" : undefined} />}
              {it.hot && it.count !== undefined && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-[4px] bg-bad-mid px-[3px] text-[10px] font-medium leading-none text-white ring-2 ring-navy" aria-hidden>
                  {it.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="grid w-full flex-none justify-items-center gap-1.5 border-t-1.5 border-navy-line py-2.5">
        <button type="button" onClick={openAsk} aria-label="Ask VCFO (/)" className="grid h-9 w-10 place-items-center rounded-md hover:bg-navy-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          <span className="grid h-[24px] w-[24px] place-items-center rounded-sm bg-primary text-white" aria-hidden>
            <Sparkles size={14} strokeWidth={1.6} />
          </span>
        </button>
        {!narrow && (
          <button type="button" onClick={onExpand} aria-label="Pin sidebar ([)" className="grid h-9 w-10 place-items-center rounded-md text-navy-faint hover:bg-navy-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
            <PanelLeftOpen size={18} strokeWidth={1.6} />
          </button>
        )}
        <Link href={meta.profile} aria-label={`${meta.person}, your profile`} className="grid h-10 w-10 place-items-center rounded-md hover:bg-navy-hover">
          <Avatar name={meta.person} size={30} onNavy />
        </Link>
      </div>
    </aside>
  );
}

export function Sidebar({
  portal,
  incorporated,
  onClose,
  pin,
}: {
  portal: Portal;
  incorporated?: boolean;
  onClose?: () => void;
  /** R-49: the pin control, on desktop only. */
  pin?: { mode: SidebarMode; peeking?: boolean; onToggle: () => void; narrow?: boolean };
}) {
  const path = usePathname();
  const meta = PORTALS[portal];
  const items = navFor(portal, incorporated);
  const client = portal === "client";

  return (
    <aside className="flex h-full w-[248px] flex-none flex-col border-r-1.5 border-navy-line bg-navy text-navy-ink" aria-label="Sidebar">
      <div className={cn("flex flex-none items-center gap-2 border-b border-navy-line pl-4 pr-2.5", client ? "h-16" : "h-14")}>
        <Link href={meta.home} className="flex min-w-0 items-center" aria-label="VCFO Suite · home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vcfo-logo-on-black.webp" alt="VCFO Suite by SBC" className={cn("block w-auto max-w-full object-contain object-left", client ? "h-[34px]" : "h-[26px]")} />
        </Link>
        {pin && !onClose && <PinButton {...pin} />}
        {onClose && (
          <button type="button" onClick={onClose} className="ml-auto grid h-10 w-10 flex-none place-items-center rounded-md bg-white/[.08] hover:bg-white/[.14]" aria-label="Close menu">
            <X size={18} strokeWidth={1.6} />
          </button>
        )}
      </div>
      {client && onClose && (
        <div className="flex-none border-b border-navy-line px-3 pb-3.5 pt-1">
          <BeforeAfter onNavy className="h-[46px] w-full" />
        </div>
      )}
      <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-2 py-3 [scrollbar-width:none]">
        <NavRows portal={portal} items={items} path={path} />
        {isStaff(portal) && (
          <div className="grid gap-3 px-1.5">
            {portal !== "admin" && <MiniCalendar portal={portal} />}
            <ReportsTo portal={portal} />
          </div>
        )}
      </div>
      {client && <TeamBlock />}
      {/* R-45: Ask VCFO is a sidebar button, never a floating bubble. "/" opens it too. */}
      <div className="flex-none px-3 pb-2.5 pt-2">
        <Tip label="Ask VCFO" keys={["/"]} side="right">
          <button
            type="button"
            onClick={openAsk}
            className="flex h-[38px] w-full items-center gap-2.5 rounded-md border-1.5 border-navy-line bg-navy px-2.5 text-14 font-medium text-white hover:bg-navy-hover"
          >
            <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-sm bg-primary text-white" aria-hidden>
              <Sparkles size={13} strokeWidth={1.6} />
            </span>
            <span className="flex-1 text-left">Ask VCFO</span>
            <kbd className="rounded-sm border border-navy-line bg-white/[.07] px-[5px] font-sans text-11 font-medium leading-[18px] text-navy-faint">/</kbd>
          </button>
        </Tip>
      </div>
      <div className="flex flex-none items-center gap-2.5 border-t-1.5 border-navy-line px-2.5 pb-3 pt-2">
        <Link href={meta.profile} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1.5 hover:bg-navy-hover" title="Your profile">
          <Avatar name={meta.person} size={30} onNavy />
          <span className="min-w-0">
            <b className="block truncate text-13.5 font-medium text-white">{meta.person}</b>
            <span className="block truncate text-12 text-navy-faint">{meta.role}</span>
          </span>
        </Link>
        <button type="button" onClick={openShortcuts} className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-navy-faint hover:bg-white/[.12] hover:text-white" aria-label="Keyboard shortcuts (?)" title="Keyboard shortcuts (?)">
          <Keyboard size={16} strokeWidth={1.6} />
        </button>
        <Link href="/sign-in" className="grid h-[30px] w-[30px] flex-none place-items-center rounded-md text-navy-faint hover:bg-white/[.12] hover:text-white" aria-label="Sign out" title="Sign out">
          <LogOut size={16} strokeWidth={1.6} />
        </Link>
      </div>
    </aside>
  );
}
