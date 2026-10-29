"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Megaphone, Menu, Moon, Search, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { PORTALS, crumbFor, type Portal } from "@/data/nav";
import { useTheme } from "./ThemeProvider";
import { Palette } from "./Palette";
import { StaffAnnouncementsBell, StaffBellMenu } from "./StaffBellMenu";
import { BeforeAfter } from "./BeforeAfter";
import { Tip } from "@/components/ui/Tip";

/** Icon-only top bar button with a TP3 dark tip (name and shortcut, when there is one). */
function IconBtn({ label, onClick, href, children, dot, count, keys }: { label: string; onClick?: () => void; href?: string; children: React.ReactNode; dot?: boolean; count?: number; keys?: string[] }) {
  const cls = "relative grid h-9 w-9 place-items-center rounded-md text-ink-2 hover:bg-ghost";
  const inner = (
    <>
      {children}
      {dot && <span className="absolute right-[7px] top-1.5 h-2 w-2 rounded-[2px] bg-bad-mid ring-2 ring-surface" aria-hidden />}
      {count !== undefined && (
        <span className="absolute right-[5px] top-[5px] grid h-4 min-w-4 place-items-center rounded-sm bg-bad-mid px-1 text-[10.5px] font-medium text-white ring-2 ring-surface" aria-hidden>
          {count}
        </span>
      )}
    </>
  );
  return (
    <Tip label={label} keys={keys}>
      {href ? (
        <Link href={href} aria-label={label} className={cls}>
          {inner}
        </Link>
      ) : (
        <button type="button" aria-label={label} onClick={onClick} className={cls}>
          {inner}
        </button>
      )}
    </Tip>
  );
}

export function TopBar({ portal, incorporated, onMenu, updatesBase }: { portal: Portal; incorporated?: boolean; onMenu: () => void; updatesBase: string }) {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const [search, setSearch] = React.useState(false);
  const crumb = crumbFor(portal, path, incorporated);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-[3px] z-20 flex h-top items-center gap-3 border-b-1.5 border-line bg-surface px-4 md:px-7">
      <button type="button" onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-md text-ink-2 hover:bg-ghost md:hidden" aria-label="Open menu">
        <Menu size={20} strokeWidth={1.6} />
      </button>
      {/* shell.js mobileLogo: phones show the VCFO mark next to the menu button */}
      <Link href={PORTALS[portal].home} aria-label="VCFO Suite · home" className="flex-none sm:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/vcfo-mark.webp" alt="VCFO Suite" className="block h-[26px] w-auto" />
      </Link>
      <div className="flex min-w-0 items-center gap-2 text-14 text-muted">
        <Link href={PORTALS[portal].home} aria-label="SBC home" className="hidden flex-none items-center border-r border-line pr-3 sm:flex">
          {/* Old top bar: the SBC logo image, 26 px high. Dark mode uses a copy with light letters. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sbc-logo.webp" alt="SBC" className="block h-[26px] w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/sbc-logo-dark.webp" alt="SBC" className="hidden h-[26px] w-auto dark:block" />
        </Link>
        <ol className="flex min-w-0 items-center gap-2">
          {crumb.map((c, i) => (
            <li key={c} className={cn("truncate", i === crumb.length - 1 && "font-medium text-ink")}>
              {i > 0 && <span className="mr-2 text-faint">/</span>}
              {c}
            </li>
          ))}
        </ol>
      </div>
      <Tip label="Search" keys={["Ctrl", "K"]}>
        <button
          type="button"
          onClick={() => setSearch(true)}
          className="ml-auto flex h-9 w-9 items-center gap-2 rounded-md border-1.5 border-line bg-raised px-0 text-14 text-muted hover:border-line-2 md:w-[380px] md:pl-3 md:pr-2"
          aria-label="Search (Ctrl K)"
        >
          <Search size={16} strokeWidth={1.6} className="mx-auto md:mx-0" />
          <span className="hidden flex-1 text-left md:inline">Search clients, filings, documents</span>
          <kbd className="ml-auto hidden rounded-sm border border-line bg-raised px-[5px] text-11 font-medium leading-[18px] text-muted md:inline">Ctrl K</kbd>
        </button>
      </Tip>
      {/* shell.js: Before | After sits in the desktop top bar, before Announcements. Phones get it in the drawer. */}
      {portal === "client" && <BeforeAfter className="hidden sm:grid" />}
      {portal === "lead" || portal === "manager" || portal === "admin" ? (
        <StaffBellMenu portal={portal} />
      ) : portal === "super" || portal === "dev" ? (
        /* Old super admin and developer top bars: one Announcements menu, no Notifications page. */
        <StaffAnnouncementsBell portal={portal} />
      ) : (
        <>
          <IconBtn label="Announcements" href={`${updatesBase}/announcements`}>
            <Megaphone size={16} strokeWidth={1.6} />
          </IconBtn>
          <IconBtn label="Notifications, 3 new" href={`${updatesBase}/notifications`} count={3}>
            <Bell size={16} strokeWidth={1.6} />
          </IconBtn>
        </>
      )}
      <IconBtn label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggle}>
        {theme === "dark" ? <Sun size={16} strokeWidth={1.6} /> : <Moon size={16} strokeWidth={1.6} />}
      </IconBtn>
      {search && <Palette portal={portal} onClose={() => setSearch(false)} />}
    </header>
  );
}
