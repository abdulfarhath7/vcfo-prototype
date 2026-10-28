"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarCheck, ClipboardList, FileText, FolderOpen, LayoutDashboard, ListChecks, Menu, Plug, ShieldAlert, Sparkles, Terminal, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Portal } from "@/data/nav";
import { openAsk } from "./AskButton";

type Tab = { label: string; href: string; Icon: LucideIcon };

/** Three main screens per portal. Ask and More complete the bar (PhoneLight.dc.html). */
function tabsFor(portal: Portal, incorporated?: boolean): Tab[] {
  switch (portal) {
    case "client":
      return [
        { label: "Home", href: "/client/home", Icon: LayoutDashboard },
        incorporated ? { label: "Filings", href: "/client/obligations", Icon: CalendarCheck } : { label: "Steps", href: "/client/incorporation", Icon: ClipboardList },
        { label: "Documents", href: "/client/documents", Icon: FileText },
      ];
    case "super":
      return [
        { label: "Overview", href: "/super/overview", Icon: LayoutDashboard },
        { label: "Risks", href: "/super/risks", Icon: ShieldAlert },
        { label: "Clients", href: "/super/clients", Icon: Building2 },
      ];
    case "dev":
      return [
        { label: "Overview", href: "/dev/overview", Icon: LayoutDashboard },
        { label: "Jobs", href: "/dev/jobs", Icon: Terminal },
        { label: "Connections", href: "/dev/connections", Icon: Plug },
      ];
    default:
      return [
        { label: "Today", href: `/${portal}/today`, Icon: LayoutDashboard },
        { label: "Work", href: `/${portal}/work`, Icon: ListChecks },
        { label: "Clients", href: `/${portal}/clients`, Icon: portal === "admin" ? Users : FolderOpen },
      ];
  }
}

const ITEM = "flex flex-1 flex-col items-center gap-1 pt-2 text-11.5 font-medium";
const PILL = "grid h-7 w-12 place-items-center rounded-md";

/** C-08: bottom tab bar on phones, every portal. Four main items and More (opens the menu). */
export function TabBar({ portal, incorporated, onMore }: { portal: Portal; incorporated?: boolean; onMore: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Main, phone" className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t-1.5 border-line bg-surface md:hidden">
      {tabsFor(portal, incorporated).map(({ label, href, Icon }) => {
        const on = path === href || path.startsWith(href + "/");
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cn(ITEM, on ? "text-accent" : "text-muted")}>
            <span className={cn(PILL, on && "bg-accent-soft")}>
              <Icon size={20} strokeWidth={1.6} aria-hidden />
            </span>
            {label}
          </Link>
        );
      })}
      <button type="button" onClick={openAsk} className={cn(ITEM, "text-muted")}>
        <span className={PILL}>
          <Sparkles size={20} strokeWidth={1.6} aria-hidden />
        </span>
        Ask
      </button>
      <button type="button" onClick={onMore} className={cn(ITEM, "text-muted")}>
        <span className={PILL}>
          <Menu size={20} strokeWidth={1.6} aria-hidden />
        </span>
        More
      </button>
    </nav>
  );
}
