import { d } from "@/lib/dates";
import type { StaffPortal } from "@/data/staff-clients";

// Bell dropdowns for the staff top bar. Ported from reference/old-screens/s/{lead,mgr,admin}/Palette.dc.html.
// Old names map to the new sample clients: Tidewater FC-GPR is Corvid, Brightwave bank account is Delta, Kestrel TDS is Zenith.

export type BellKind = "upload" | "approved" | "late" | "reminder";

export interface BellItem {
  id: string;
  kind: BellKind;
  title: string;
  /** Client id (staff-clients.ts). */
  client: string;
  /** Step code or short context: "Step 7". */
  context?: string;
  /** Time today ("11:02") or weekday ("Thu"). */
  when: string;
  /** Day the item came in: for "Clear today" and "Clear this week". */
  date: Date;
  unread?: boolean;
  /** Received by me, or sent by me (reminders, requests). */
  box: "received" | "sent";
}

const approver: Record<StaffPortal, string> = { lead: "Pranay", manager: "Pranay", admin: "Krishna" };

export function bellItems(portal: StaffPortal): BellItem[] {
  return [
    { id: "b1", kind: "upload", title: "Northwind uploaded a utility bill", client: "northwind", context: "Step 7", when: "11:02", date: d(2026, 10, 6), unread: true, box: "received" },
    { id: "b2", kind: "approved", title: `${approver[portal]} approved FC-GPR form`, client: "corvid", context: "Step 22", when: "10:40", date: d(2026, 10, 6), unread: true, box: "received" },
    { id: "b3", kind: "late", title: "Bank account opening is 1 day late", client: "delta", context: "Step 17", when: "09:00", date: d(2026, 10, 6), unread: true, box: "received" },
    { id: "b4", kind: "reminder", title: "TDS challan due 7 Oct", client: "zenith", when: "Thu", date: d(2026, 10, 1), box: "received" },
    { id: "s1", kind: "reminder", title: "Reminder sent: NOC from owner and utility bill", client: "northwind", context: "Step 7", when: "09:20", date: d(2026, 10, 6), box: "sent" },
    { id: "s2", kind: "reminder", title: "Reminder sent: auditor consent letter", client: "fjord", context: "Step 21", when: "Mon", date: d(2026, 10, 5), box: "sent" },
  ];
}

/** Announcements in the bell: "Important" or "General". */
export interface BellAnnouncement {
  id: string;
  title: string;
  when: string;
  important?: boolean;
}

export const BELL_ANNOUNCEMENTS: BellAnnouncement[] = [
  { id: "ba1", title: "MCA: new SPICe+ form version from 1 Nov", when: "Today", important: true },
  { id: "ba2", title: "Diwali · office closed 1-3 Nov", when: "Yesterday" },
];
