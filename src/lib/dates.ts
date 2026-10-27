// Sample data is frozen on one day (R-29: plain dates, "14 Oct").
export const TODAY = new Date(2026, 9, 6); // Tuesday 6 Oct 2026

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day);
}

/** "6 Oct" */
export function fmt(date: Date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "6 Oct 2026" */
export function fmtYear(date: Date) {
  return `${fmt(date)} ${date.getFullYear()}`;
}

/** "Tuesday, 6 October 2026" */
export function fmtLong(date: Date) {
  const long = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${long[date.getMonth()]} ${date.getFullYear()}`;
}

/** Day and month for a 44 px date tile. */
export function tile(date: Date) {
  return { day: String(date.getDate()).padStart(2, "0"), mon: MONTHS[date.getMonth()].toUpperCase() };
}

export function daysFrom(date: Date, from = TODAY) {
  return Math.round((date.getTime() - from.getTime()) / 86400000);
}

export type Urgency = "bad" | "warn" | "prog" | "idle";

/** Tint for a date: overdue red, within 7 days amber, within 15 blue, else grey. */
export function urgency(date: Date, from = TODAY): Urgency {
  const n = daysFrom(date, from);
  if (n < 0) return "bad";
  if (n <= 7) return "warn";
  if (n <= 15) return "prog";
  return "idle";
}

/** "Overdue", "Today", "In 3 days", "In 2 weeks" */
export function relative(date: Date, from = TODAY) {
  const n = daysFrom(date, from);
  if (n < 0) return "Overdue";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n <= 21) return `In ${n} days`;
  return fmt(date);
}

/** Fraction of a span, clamped to [0, 1]. */
export function frac(date: Date, start: Date, end: Date) {
  const f = (date.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  return Math.min(1, Math.max(0, f));
}
