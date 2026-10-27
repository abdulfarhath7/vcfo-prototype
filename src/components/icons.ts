import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CircleCheck,
  ClipboardCheck,
  Clock,
  FileText,
  IdCard,
  Inbox,
  LayoutGrid,
  List,
  Mail,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";

export type Tone = "red" | "amber" | "green" | "teal" | "blue" | "violet";

/** Icon tile for a card title (RULES.md: first match from the top wins). */
const TABLE: Array<[LucideIcon, Tone, string[]]> = [
  [AlertTriangle, "red", ["risk", "stuck", "overdue", "incident", "escalation", "broken"]],
  [Bell, "amber", ["alert", "update", "notification", "announcement"]],
  [CircleCheck, "green", ["approval", "decision", "granted"]],
  [Calendar, "teal", ["timeline", "week", "calendar", "what is next", "coming", "deadline", "schedule", "renewal", "plan"]],
  [Inbox, "blue", ["inbox", "triage", "message"]],
  [FileText, "amber", ["need", "document", "docs", "vault", "upload", "file"]],
  [ShieldCheck, "green", ["compliance", "filing", "obligation", "statute", "status"]],
  [ClipboardCheck, "teal", ["what sbc is doing", "holds", "pending with", "progress flow"]],
  [User, "violet", ["waiting", "client", "people", "lead", "manager", "team", "who"]],
  [IdCard, "violet", ["registration", "ids", "identity", "credential"]],
  [Clock, "violet", ["activity", "audit", "recent", "history", "log"]],
  [List, "blue", ["step", "queue", "work", "task", "action", "post-incorporation"]],
  [BarChart3, "blue", ["phase", "practice", "analytics", "growth", "report", "chart", "health", "area", "service"]],
  [Mail, "blue", ["email", "mail"]],
  [BookOpen, "teal", ["library", "knowledge", "sop", "book"]],
];

export function iconFor(title: string): { Icon: LucideIcon; tone: Tone } {
  const t = title.toLowerCase();
  for (const [Icon, tone, words] of TABLE) {
    if (words.some((w) => t.includes(w))) return { Icon, tone };
  }
  return { Icon: LayoutGrid, tone: "blue" };
}

/** Tailwind classes for a tinted tile by tone. */
export const toneTile: Record<Tone, string> = {
  red: "bg-bad-soft text-bad",
  amber: "bg-warn-soft text-warn",
  green: "bg-ok-soft text-ok",
  teal: "bg-teal-soft text-teal",
  blue: "bg-accent-soft text-accent",
  violet: "bg-violet-soft text-violet",
};
