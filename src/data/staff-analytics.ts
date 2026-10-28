import type { StaffPortal } from "@/data/staff-clients";

// Staff analytics: counts only, no money (R-37).
// Ported from reference/old-screens/s/lead/Analytics.dc.html (on-time rate May to Oct: 88, 91, 93, 90, 96, 97).
// The lead sees own clients, the manager sees the team, the admin sees the firm.

export interface MonthFilings {
  m: string;
  onTime: number;
  late: number;
}

export interface WeekSteps {
  w: string;
  steps: number;
}

export interface StepTime {
  id: string;
  step: string;
  /** Median days in the step. */
  median: number;
  /** Longest wait now. */
  longest: number;
  longestClient: string;
}

export interface Kpi {
  label: string;
  value: number;
  /** Change against the previous period: "+1", "−1". */
  delta: string;
  /** True when the change is good news. */
  good: boolean;
}

export interface MonthRate {
  m: string;
  /** Compliance completion rate, %. */
  rate: number;
  /** Average days past the statutory due date. */
  delay: number;
}

export interface Analytics {
  /** Counts only (R-37). */
  kpis: Kpi[];
  /** Last 12 months, oldest first: completion rate and filing delay. */
  rates: MonthRate[];
  /** Last 12 months, oldest first. */
  filings: MonthFilings[];
  /** Last 8 weeks, oldest first. */
  steps: WeekSteps[];
  stepTime: StepTime[];
}

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const WEEKS = ["17 Aug", "24 Aug", "31 Aug", "7 Sep", "14 Sep", "21 Sep", "28 Sep", "5 Oct"];

// Firm-wide filings per month and the on-time share (%) per month.
const FIRM_TOTAL = [118, 121, 126, 119, 142, 131, 128, 133, 137, 135, 140, 96];
const ON_TIME = [86, 84, 89, 87, 82, 90, 88, 91, 93, 90, 96, 97];
const FIRM_STEPS = [41, 38, 46, 52, 44, 49, 57, 34];
// Average filing delay in days, Nov to Oct. May to Oct come from the old chart (4.2 to 1.3).
const DELAY = [5.1, 4.8, 5.3, 4.6, 6.0, 4.9, 4.2, 3.4, 3.0, 2.2, 1.6, 1.3];

/** Completion-rate target and delay benchmark from the old Analytics page. */
export const RATE_TARGET = 95;
export const DELAY_BENCHMARK = 2;

// Old KPI strip, the same on lead, manager and admin Analytics: Projects 8 (+1), Steps completed 126 (+18), Waiting on client 6 (+2), Overdue steps 3 (−1).
const OLD_KPIS: Array<[string, number, string, boolean]> = [["Projects", 8, "+1", true], ["Steps completed", 126, "+18", true], ["Waiting on client", 6, "+2", false], ["Overdue steps", 3, "−1", true]];
const KPIS: Record<StaffPortal, Array<[string, number, string, boolean]>> = { lead: OLD_KPIS, manager: OLD_KPIS, admin: OLD_KPIS };

const SCALE: Record<StaffPortal, number> = { admin: 1, manager: 0.48, lead: 0.2 };

function build(portal: StaffPortal): Analytics {
  const k = SCALE[portal];
  const filings = MONTHS.map((m, i) => {
    const total = Math.max(1, Math.round(FIRM_TOTAL[i] * k));
    const onTime = Math.round((total * ON_TIME[i]) / 100);
    return { m, onTime, late: total - onTime };
  });
  const steps = WEEKS.map((w, i) => ({ w, steps: Math.max(1, Math.round(FIRM_STEPS[i] * k)) }));
  const stepTime: StepTime[] = {
    lead: [
      { id: "s1", step: "Registered office address", median: 4, longest: 5, longestClient: "Northwind" },
      { id: "s2", step: "KYC review and DSC", median: 3, longest: 4, longestClient: "Orchid Lane" },
      { id: "s3", step: "GST registration", median: 9, longest: 12, longestClient: "Kestrel" },
      { id: "s4", step: "Trademark registration", median: 6, longest: 8, longestClient: "Halcyon" },
      { id: "s5", step: "FC-GPR filing", median: 5, longest: 6, longestClient: "Tidewater" },
      { id: "s6", step: "Subscriber details", median: 2, longest: 3, longestClient: "Northwind" },
    ],
    manager: [
      { id: "s1", step: "Registered office address", median: 4, longest: 6, longestClient: "Northwind" },
      { id: "s2", step: "KYC review and DSC", median: 3, longest: 4, longestClient: "Orchid Lane" },
      { id: "s3", step: "Bank account opening", median: 7, longest: 11, longestClient: "Brightwave" },
      { id: "s4", step: "GST registration", median: 9, longest: 12, longestClient: "Kestrel" },
      { id: "s5", step: "Auditor appointment (ADT-1)", median: 5, longest: 7, longestClient: "Coral" },
      { id: "s6", step: "Trademark registration", median: 6, longest: 8, longestClient: "Halcyon" },
      { id: "s7", step: "Draft Board resolution", median: 2, longest: 2, longestClient: "Larkspur" },
    ],
    admin: [
      { id: "s1", step: "Name resubmission after RUN rejection", median: 6, longest: 8, longestClient: "Banyan" },
      { id: "s2", step: "MCA remarks on SPICe+", median: 5, longest: 6, longestClient: "Monsoon" },
      { id: "s3", step: "Registered office address", median: 4, longest: 6, longestClient: "Northwind" },
      { id: "s4", step: "Bank account opening", median: 7, longest: 11, longestClient: "Brightwave" },
      { id: "s5", step: "GST registration", median: 9, longest: 12, longestClient: "Kestrel" },
      { id: "s6", step: "PF registration", median: 4, longest: 5, longestClient: "Indigo" },
      { id: "s7", step: "Auditor appointment (ADT-1)", median: 5, longest: 7, longestClient: "Coral" },
      { id: "s8", step: "Share certificates (SH-1)", median: 3, longest: 4, longestClient: "Saffron" },
    ],
  }[portal];
  const kpis = KPIS[portal].map(([label, value, delta, good]) => ({ label, value, delta, good }));
  const rates = MONTHS.map((m, i) => ({ m, rate: ON_TIME[i], delay: DELAY[i] }));
  return { kpis, rates, filings, steps, stepTime };
}

export const ANALYTICS: Record<StaffPortal, Analytics> = { lead: build("lead"), manager: build("manager"), admin: build("admin") };
