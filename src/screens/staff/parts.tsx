import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Building2, CalendarCheck, Rocket, ShieldCheck, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { STAFF_TODAY, daysFrom } from "@/lib/dates";
import { PORTALS } from "@/data/nav";
import { barFill } from "@/components/ui/Bar";
import { Chip } from "@/components/ui/Chip";
import type { Tone } from "@/components/icons";
import type { StatItem } from "@/components/cards/GreetingCard";
import { clientById, clientsFor, type StaffClient, type StaffPortal } from "@/data/staff-clients";
import { tasksFor, taskTone, type StaffTask, type TaskStatus } from "@/data/staff-tasks";
import { waitWord } from "@/data/status-words";

export type { StaffPortal };

export const base = (portal: StaffPortal) => `/${portal}`;
export const personOf = (portal: StaffPortal) => PORTALS[portal].person;

/** R-35: each client keeps its identity colour on staff screens. */
export function ClientDot({ tone, className }: { tone: StaffClient["tone"]; className?: string }) {
  return <i className={cn("inline-block h-2 w-2 flex-none rounded-[2px]", barFill[tone], className)} aria-hidden />;
}

/** Identity colour as an icon-tile tone. */
export const identityTile: Record<StaffClient["tone"], Tone> = { accent: "blue", violet: "violet", teal: "teal", warn: "amber", ok: "green", idle: "blue" };

/** Client name without "Pvt Ltd", "India Pvt Ltd" or "LLP", as in the old staff grids. */
export const plainName = (c: StaffClient) => c.name.replace(/( India)? Pvt Ltd$/, "").replace(/ LLP$/, "");

/** `plain` drops "Pvt Ltd" (old Today grids). */
export function ClientName({ id, short, plain, href, className }: { id: string; short?: boolean; plain?: boolean; href?: string; className?: string }) {
  const c = clientById(id);
  if (!c) return null;
  const inner = (
    <>
      <ClientDot tone={c.tone} />
      <span className="min-w-0 truncate">{short ? c.short : plain ? plainName(c) : c.name}</span>
    </>
  );
  const cls = cn("inline-flex min-w-0 max-w-full items-center gap-2", className);
  return href ? (
    <Link href={href} className={cn(cls, "hover:underline")}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

export function TaskChip({ status, fixed = true }: { status: TaskStatus; fixed?: boolean }) {
  return (
    <Chip tone={taskTone[status]} fixed={fixed}>
      {fixed ? status : waitWord(status)}
    </Chip>
  );
}

export const clientHref = (portal: StaffPortal, id: string) => `${base(portal)}/clients/${id}`;
export const stepHrefFor = (portal: StaffPortal, id: string, n: number) => `${base(portal)}/clients/${id}/step/${n}`;

export function taskHref(portal: StaffPortal, t: StaffTask) {
  return t.step ? stepHrefFor(portal, t.client, t.step) : clientHref(portal, t.client);
}

/** Practice strip for the greeting card: clients, stages, overdue, waiting, due in 15 days. */
export function practiceStats(portal: StaffPortal): StatItem[] {
  const cl = clientsFor(portal);
  const tasks = tasksFor(portal === "lead" ? "manager" : portal).filter((t) => t.status !== "Done");
  const b = base(portal);
  return [
    { label: "Clients", value: cl.length, Icon: Building2, tone: "blue", href: `${b}/clients` },
    { label: "Incorporating", value: cl.filter((c) => c.stage === "incorporating").length, Icon: Rocket, tone: "violet", href: `${b}/clients` },
    { label: "In compliance", value: cl.filter((c) => c.stage === "compliance").length, Icon: ShieldCheck, tone: "green", href: `${b}/clients` },
    { label: "Overdue", value: tasks.filter((t) => t.status === "Overdue").length, Icon: AlertTriangle, tone: "red", bad: true, href: `${b}/work` },
    { label: "Waiting on client", value: tasks.filter((t) => t.status === "With client").length, Icon: User, tone: "amber", href: `${b}/work` },
    { label: "Due in 15 days", value: tasks.filter((t) => t.status !== "Overdue" && daysFrom(t.due, STAFF_TODAY) >= 0 && daysFrom(t.due, STAFF_TODAY) <= 15).length, Icon: CalendarCheck, tone: "teal", href: `${b}/work` },
  ];
}
