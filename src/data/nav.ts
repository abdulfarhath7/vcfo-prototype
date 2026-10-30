import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  ChartColumn,
  Clock,
  Database,
  FileText,
  FolderOpen,
  History,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Library,
  ListChecks,
  Lock,
  Mail,
  Megaphone,
  Plug,
  Settings,
  ShieldCheck,
  Text,
  TrendingUp,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { clientsFor } from "@/data/staff-clients";

export type Portal = "client" | "lead" | "manager" | "admin" | "super" | "dev";

export interface NavItem {
  label: string;
  href?: string;
  /** Sidebar glyph (old shell.js and Side.dc.html). Kids have none. */
  icon?: LucideIcon;
  count?: string | number;
  hot?: boolean;
  kids?: NavItem[];
}

export interface PortalMeta {
  key: Portal;
  title: string;
  person: string;
  role: string;
  home: string;
  /** Account row opens Profile (K-16). */
  profile: string;
}

export const PORTALS: Record<Portal, PortalMeta> = {
  client: { key: "client", title: "Client", person: "Rohan Kumar", role: "Northwind · Client", home: "/client/home", profile: "/client/profile" },
  lead: { key: "lead", title: "Project lead", person: "Bharath", role: "Project lead", home: "/lead/today", profile: "/lead/profile" },
  manager: { key: "manager", title: "Manager", person: "Pranay", role: "Manager", home: "/manager/today", profile: "/manager/profile" },
  admin: { key: "admin", title: "Admin", person: "Krishna", role: "Admin", home: "/admin/today", profile: "/admin/profile" },
  super: { key: "super", title: "Super admin", person: "Mithilesh", role: "Super admin", home: "/super/overview", profile: "/super/profile" },
  dev: { key: "dev", title: "Developer", person: "Farhath", role: "Developer", home: "/dev/overview", profile: "/dev/profile" },
};

// R-32: daily work first, then dated work, messages, documents, reports, settings.
// R-34: client sidebar puts Incorporation after Home while the company incorporates.
export function clientNav(incorporated: boolean): NavItem[] {
  const compliances: NavItem = {
    label: "Compliances",
    icon: CalendarCheck,
    kids: [
      { label: "Obligations", href: "/client/obligations" },
      { label: "Calendar", href: "/client/calendar" },
      { label: "Filings", href: "/client/filings" },
    ],
  };
  const incorporation: NavItem = { label: "Incorporation", href: "/client/incorporation", icon: Landmark, count: "6/25" };
  return [
    { label: "Home", href: "/client/home", icon: LayoutDashboard },
    ...(incorporated ? [compliances, incorporation] : [incorporation, compliances]),
    { label: "Registrations", href: "/client/registrations", icon: BadgeCheck },
    {
      label: "Updates",
      icon: Megaphone,
      count: 3,
      hot: true,
      kids: [
        { label: "Announcements", href: "/client/announcements" },
        { label: "Notifications", href: "/client/notifications", count: 3, hot: true },
      ],
    },
    { label: "Documents", href: "/client/documents", icon: FolderOpen, count: 6 },
    { label: "Library", href: "/client/library", icon: Library },
    { label: "Credentials", href: "/client/credentials", icon: KeyRound },
    { label: "Audit", href: "/client/audit", icon: History },
  ];
}

interface StaffOpts {
  work?: number;
  clients: number;
  /** Rows after Work and before Clients (manager: Project leads). */
  before?: NavItem[];
  /** Rows after Clients (admin: Managers). */
  after?: NavItem[];
  compliances?: number;
  /** Clients still incorporating, from clientsFor(portal). */
  incorporating?: number;
  tail?: NavItem[];
}

// Old Side.dc.html (lead, mgr, admin): every count is a neutral pill; none is red.
function staffNav(base: string, o: StaffOpts): NavItem[] {
  return [
    { label: "Today", href: `${base}/today`, icon: LayoutDashboard },
    { label: "Work", href: `${base}/work`, icon: ListChecks, count: o.work },
    ...(o.before ?? []),
    { label: "Clients", href: `${base}/clients`, icon: Building2, count: o.clients },
    ...(o.after ?? []),
    // R-51: the practice block, in the client's order: Incorporation, Compliances, Registrations.
    { label: "Incorporation", href: `${base}/incorporation`, icon: Landmark, count: o.incorporating },
    {
      label: "Compliances",
      icon: CalendarCheck,
      count: o.compliances,
      kids: [
        { label: "Obligations", href: `${base}/compliances/obligations` },
        { label: "Calendar", href: `${base}/compliances/calendar` },
        { label: "Filings", href: `${base}/compliances/filings` },
      ],
    },
    { label: "Registrations", href: `${base}/registrations`, icon: BadgeCheck },
    {
      label: "Updates",
      icon: Megaphone,
      count: 2,
      kids: [
        { label: "Announcements", href: `${base}/updates/announcements` },
        { label: "Notifications", href: `${base}/updates/notifications` },
      ],
    },
    { label: "Email", href: `${base}/email`, icon: Mail },
    {
      label: "Docs",
      icon: FolderOpen,
      kids: [
        { label: "Vault", href: `${base}/docs/vault` },
        { label: "Knowledge bank", href: `${base}/docs/knowledge` },
      ],
    },
    { label: "Analytics", href: `${base}/analytics`, icon: ChartColumn },
    { label: "Audit", href: `${base}/audit`, icon: History },
    ...(o.tail ?? []),
  ];
}

const incorporating = (p: "lead" | "manager" | "admin") => clientsFor(p).filter((c) => c.stage === "incorporating").length;

export const NAV: Record<Exclude<Portal, "client">, NavItem[]> = {
  lead: staffNav("/lead", { work: 9, clients: 8, compliances: 4, incorporating: incorporating("lead") }),
  manager: staffNav("/manager", { work: 9, clients: 8, compliances: 4, incorporating: incorporating("manager"), before: [{ label: "Project leads", href: "/manager/leads", icon: Users, count: 3 }] }),
  admin: staffNav("/admin", {
    incorporating: incorporating("admin"),
    clients: 14,
    after: [{ label: "Managers", href: "/admin/managers", icon: Users, count: 3 }],
    tail: [{ label: "Firm settings", href: "/admin/settings", icon: Settings }],
  }),
  super: [
    { label: "Overview", href: "/super/overview", icon: LayoutDashboard },
    { label: "Risks", href: "/super/risks", icon: TriangleAlert, count: 10 },
    { label: "Clients", href: "/super/clients", icon: Building2, count: 17 },
    // R-51: the same practice block as every other role.
    { label: "Incorporation", href: "/super/practice/incorporation", icon: Landmark },
    {
      label: "Compliances",
      icon: CalendarCheck,
      kids: [
        { label: "Obligations", href: "/super/practice/compliances" },
        { label: "Filings", href: "/super/practice/filings" },
      ],
    },
    { label: "Registrations", href: "/super/practice/registrations", icon: BadgeCheck },
    { label: "Team", href: "/super/team", icon: Users },
    { label: "Growth", href: "/super/growth", icon: TrendingUp },
    { label: "Reports", href: "/super/reports", icon: FileText },
    { label: "Firm settings", href: "/super/settings", icon: Settings },
  ],
  dev: [
    { label: "Overview", href: "/dev/overview", icon: LayoutDashboard },
    { label: "Connections", href: "/dev/connections", icon: Plug, count: 3 },
    { label: "Jobs", href: "/dev/jobs", icon: Clock, count: 1 },
    { label: "Logs", href: "/dev/logs", icon: Text },
    { label: "Messages", href: "/dev/messages", icon: Mail },
    { label: "Deploys", href: "/dev/deploys", icon: ShieldCheck },
    { label: "Access", href: "/dev/access", icon: Lock },
    { label: "Data and costs", href: "/dev/data", icon: Database },
    { label: "Audit", href: "/dev/audit", icon: History },
  ],
};

/** Client sidebar team block (old shell.js TEAM), above the account row. */
export interface TeamContact {
  name: string;
  role: string;
  /** Initials as the old shell.js shows them. */
  ini: string;
  support?: boolean;
}
export const CLIENT_TEAM: TeamContact[] = [
  { name: "Pranay", role: "Manager", ini: "PN" },
  { name: "Bharath", role: "Project lead", ini: "BH" },
  { name: "Customer support", role: "SBC help desk", ini: "CS", support: true },
];

/** Screens for the prototype bar picker: every nav row of a portal, groups as "Group · Item". */
export function screensFor(portal: Portal, incorporated = false): Array<{ label: string; href: string }> {
  const out: Array<{ label: string; href: string }> = [];
  for (const it of navFor(portal, incorporated)) {
    if (it.kids) for (const k of it.kids) out.push({ label: `${it.label} · ${k.label}`, href: k.href! });
    else if (it.href) out.push({ label: it.label, href: it.href });
  }
  out.push({ label: "Profile", href: PORTALS[portal].profile });
  return out;
}

export function navFor(portal: Portal, incorporated = false): NavItem[] {
  return portal === "client" ? clientNav(incorporated) : NAV[portal];
}

const EXTRA_CRUMBS: Array<[string, string[]]> = [
  ["documents", ["Clients", "Documents"]],
  ["board-resolution", ["Clients", "Board resolution"]],
  ["practice/filings", ["Practice areas", "Filings"]],
  ["settings", ["Settings"]],
  ["team", ["Team"]],
];

/** Title for the top bar crumb: the deepest nav label that matches the path. */
export function crumbFor(portal: Portal, path: string, incorporated = false): string[] {
  const items = navFor(portal, incorporated);
  for (const it of items) {
    if (it.kids) {
      for (const k of it.kids) if (k.href && path.startsWith(k.href)) return [it.label, k.label];
    } else if (it.href && path.startsWith(it.href)) return [it.label];
  }
  if (path.endsWith("/profile")) return ["Profile"];
  // Pages that have no sidebar row. The old top bar named them after the client record they open from.
  const rest = path.split("/").slice(2).join("/");
  for (const [route, crumb] of EXTRA_CRUMBS) if (rest === route || rest.startsWith(route + "/")) return crumb;
  return [];
}
