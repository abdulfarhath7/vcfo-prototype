import { STAFF_CLIENTS } from "@/data/staff-clients";
import { TASKS } from "@/data/staff-tasks";

// Project leads and managers. Ported from reference/old-screens/s/admin/data.js (MGR) and s/mgr/Leads.dc.html.
// Pranay's leads in people.ts are Bharath and Sneha Kulkarni; Meera Nair is the third lead from the old prototype.

export interface Lead {
  name: string;
  manager: string;
  /** Hours planned this week out of 40. */
  hours: number;
  lastActive: string;
}

export const LEADS: Lead[] = [
  { name: "Bharath", manager: "Pranay", hours: 36, lastActive: "Now" },
  { name: "Sneha Kulkarni", manager: "Pranay", hours: 41, lastActive: "12 min ago" },
  { name: "Meera Nair", manager: "Pranay", hours: 22, lastActive: "1 h ago" },
  { name: "Aditi Rao", manager: "Priya Raman", hours: 30, lastActive: "25 min ago" },
  { name: "Kabir Sethi", manager: "Priya Raman", hours: 38, lastActive: "Yesterday" },
  { name: "Nikhil Jain", manager: "Arjun Mehta", hours: 34, lastActive: "2 h ago" },
  { name: "Tara Menon", manager: "Arjun Mehta", hours: 26, lastActive: "40 min ago" },
];

/** Old per-lead analysis on the manager Project leads page (reference/old-screens/s/mgr/Leads.dc.html LD).
 * st: done, in progress, due soon, overdue, not started. areas: name, done, pending, overdue, total. */
export const LEAD_STATS: Record<string, { st: [number, number, number, number, number]; areas: Array<[string, number, number, number, number]> }> = {
  Bharath: { st: [6, 5, 3, 3, 2], areas: [["MCA", 1, 2, 1, 4], ["GST", 2, 2, 1, 5], ["Income tax", 1, 2, 0, 4], ["Payroll", 1, 1, 1, 3], ["FEMA", 1, 1, 0, 3]] },
  "Sneha Kulkarni": { st: [9, 4, 3, 2, 4], areas: [["MCA", 2, 2, 1, 5], ["GST", 3, 2, 0, 6], ["Income tax", 2, 1, 0, 4], ["Payroll", 1, 1, 1, 4], ["FEMA", 1, 1, 0, 3]] },
  "Meera Nair": { st: [12, 3, 2, 0, 3], areas: [["MCA", 3, 1, 0, 5], ["GST", 4, 2, 0, 6], ["Income tax", 2, 1, 0, 4], ["Payroll", 2, 1, 0, 3], ["FEMA", 1, 0, 0, 2]] },
};
/** Open tasks per lead in the old manager sidebar and lead switch: Bharath 13, Sneha 13, Meera 8. */
export const leadOpen = (name: string) => {
  const x = LEAD_STATS[name];
  return x ? x.st[1] + x.st[2] + x.st[3] + x.st[4] : undefined;
};

export interface Manager {
  name: string;
  onTime: number;
  lastActive: string;
}

export const MANAGERS: Manager[] = [
  { name: "Pranay", onTime: 91, lastActive: "Now" },
  { name: "Priya Raman", onTime: 86, lastActive: "30 min ago" },
  { name: "Arjun Mehta", onTime: 79, lastActive: "2 h ago" },
];

export interface LeadRow extends Lead {
  clients: number;
  open: number;
  overdue: number;
  load: number;
}

export function leadRows(manager?: string): LeadRow[] {
  return LEADS.filter((l) => !manager || l.manager === manager).map((l) => {
    const mine = TASKS.filter((t) => t.owner === l.name);
    const clients = new Set([...STAFF_CLIENTS.filter((c) => c.lead === l.name).map((c) => c.id), ...mine.map((t) => t.client)]);
    return {
      ...l,
      clients: clients.size,
      open: mine.filter((t) => t.status !== "Done").length,
      overdue: mine.filter((t) => t.status === "Overdue").length,
      load: Math.round((l.hours / 40) * 100),
    };
  });
}

export interface ManagerRow extends Manager {
  leads: number;
  clients: number;
  open: number;
  overdue: number;
  load: number;
}

export function managerRows(): ManagerRow[] {
  return MANAGERS.map((m) => {
    const leads = leadRows(m.name);
    const clients = STAFF_CLIENTS.filter((c) => c.manager === m.name);
    const hours = leads.reduce((a, l) => a + l.hours, 0);
    return {
      ...m,
      leads: leads.length,
      clients: clients.length,
      open: leads.reduce((a, l) => a + l.open, 0),
      overdue: leads.reduce((a, l) => a + l.overdue, 0),
      load: Math.round((hours / (leads.length * 40)) * 100),
    };
  });
}

/** Clients won without a manager (admin assigns them). From reference/old-patch/admin/assign.js. */
export interface Unassigned {
  id: string;
  name: string;
  service: string;
  won: string;
}

export const UNASSIGNED: Unassigned[] = [
  { id: "lotus", name: "Lotus Dental Pvt Ltd", service: "Incorporation", won: "Won 2 days ago" },
  { id: "veda", name: "Veda Organics LLP", service: "Registrations", won: "Won today" },
];

/** Escalations the admin owns (manager-level items of kind Escalation in reference/old-screens/s/admin/data.js MTASKS). */
export interface Escalation {
  id: string;
  client: string;
  title: string;
  manager: string;
  lead: string;
  /** Days open. */
  age: number;
}

export const ESCALATIONS: Escalation[] = [
  { id: "e1", client: "brightwave", title: "Bank account delay", manager: "Pranay", lead: "Sneha Kulkarni", age: 4 },
  { id: "e2", client: "monsoon", title: "MCA remarks on SPICe+ unanswered", manager: "Priya Raman", lead: "Kabir Sethi", age: 6 },
  { id: "e3", client: "banyan", title: "RUN name rejected, resubmission pending", manager: "Arjun Mehta", lead: "Nikhil Jain", age: 8 },
];

/** Clients a manager can run well (data.js CAP). */
export const CAPACITY = 10;
