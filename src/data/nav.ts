export type Portal = "client" | "lead" | "manager" | "admin" | "super" | "dev";

export interface NavItem {
  label: string;
  href?: string;
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
    kids: [
      { label: "Obligations", href: "/client/obligations" },
      { label: "Calendar", href: "/client/calendar" },
      { label: "Filings", href: "/client/filings" },
    ],
  };
  const incorporation: NavItem = { label: "Incorporation", href: "/client/incorporation", count: "6/25" };
  return [
    { label: "Home", href: "/client/home" },
    ...(incorporated ? [compliances, incorporation] : [incorporation, compliances]),
    { label: "Registrations", href: "/client/registrations" },
    {
      label: "Updates",
      count: 3,
      hot: true,
      kids: [
        { label: "Announcements", href: "/client/announcements" },
        { label: "Notifications", href: "/client/notifications", count: 3, hot: true },
      ],
    },
    { label: "Documents", href: "/client/documents", count: 6 },
    { label: "Library", href: "/client/library" },
    { label: "Credentials", href: "/client/credentials" },
    { label: "Audit", href: "/client/audit" },
  ];
}

function staffNav(base: string, extra: NavItem[] = [], tail: NavItem[] = []): NavItem[] {
  return [
    { label: "Today", href: `${base}/today` },
    { label: "Work", href: `${base}/work`, count: 9, hot: true },
    ...extra,
    { label: "Clients", href: `${base}/clients`, count: 8 },
    {
      label: "Compliances",
      kids: [
        { label: "Obligations", href: `${base}/compliances/obligations` },
        { label: "Calendar", href: `${base}/compliances/calendar` },
        { label: "Filings", href: `${base}/compliances/filings` },
      ],
    },
    { label: "Registrations", href: `${base}/registrations` },
    {
      label: "Updates",
      count: 2,
      hot: true,
      kids: [
        { label: "Announcements", href: `${base}/updates/announcements` },
        { label: "Notifications", href: `${base}/updates/notifications`, count: 2, hot: true },
      ],
    },
    { label: "Email", href: `${base}/email` },
    {
      label: "Docs",
      kids: [
        { label: "Vault", href: `${base}/docs/vault` },
        { label: "Knowledge bank", href: `${base}/docs/knowledge` },
      ],
    },
    { label: "Analytics", href: `${base}/analytics` },
    { label: "Audit", href: `${base}/audit` },
    ...tail,
  ];
}

export const NAV: Record<Exclude<Portal, "client">, NavItem[]> = {
  lead: staffNav("/lead"),
  manager: staffNav("/manager", [{ label: "Project leads", href: "/manager/leads", count: 3 }]),
  admin: staffNav("/admin", [{ label: "Managers", href: "/admin/managers", count: 3 }], [{ label: "Firm settings", href: "/admin/settings" }]),
  super: [
    { label: "Overview", href: "/super/overview" },
    { label: "Risks", href: "/super/risks", count: 4, hot: true },
    { label: "Clients", href: "/super/clients", count: 17 },
    {
      label: "Practice areas",
      kids: [
        { label: "Incorporation", href: "/super/practice/incorporation" },
        { label: "Registrations", href: "/super/practice/registrations" },
        { label: "Compliances", href: "/super/practice/compliances" },
      ],
    },
    { label: "Team", href: "/super/team" },
    { label: "Growth", href: "/super/growth" },
    { label: "Reports", href: "/super/reports" },
    { label: "Firm settings", href: "/super/settings" },
  ],
  dev: [
    { label: "Overview", href: "/dev/overview" },
    { label: "Connections", href: "/dev/connections", count: 2, hot: true },
    { label: "Jobs", href: "/dev/jobs", count: 1, hot: true },
    { label: "Logs", href: "/dev/logs" },
    { label: "Messages", href: "/dev/messages" },
    { label: "Deploys", href: "/dev/deploys" },
    { label: "Access", href: "/dev/access" },
    { label: "Data and costs", href: "/dev/data" },
    { label: "Audit", href: "/dev/audit" },
  ],
};

export function navFor(portal: Portal, incorporated = false): NavItem[] {
  return portal === "client" ? clientNav(incorporated) : NAV[portal];
}

/** Title for the top bar crumb: the deepest nav label that matches the path. */
export function crumbFor(portal: Portal, path: string, incorporated = false): string[] {
  const items = navFor(portal, incorporated);
  for (const it of items) {
    if (it.kids) {
      for (const k of it.kids) if (k.href && path.startsWith(k.href)) return [it.label, k.label];
    } else if (it.href && path.startsWith(it.href)) return [it.label];
  }
  if (path.endsWith("/profile")) return ["Profile"];
  return [];
}
