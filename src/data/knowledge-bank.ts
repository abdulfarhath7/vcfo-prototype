/* Staff knowledge bank (reference/old-screens/s/lead/Knowledge.dc.html). Same data on lead, manager and admin. */
import type { FileType } from "@/components/ui/FileBadge";

export interface KbShelf {
  name: string;
  count: number;
  /** Seed for the spine widths, heights and colours, as in the old screen. */
  seed: number;
}

export const KB_SHELVES: KbShelf[] = [
  { name: "Incorporation", count: 14, seed: 1 },
  { name: "GST", count: 6, seed: 3 },
  { name: "Income tax & TDS", count: 9, seed: 5 },
  { name: "Payroll", count: 5, seed: 2 },
  { name: "FEMA", count: 4, seed: 4 },
  { name: "Templates", count: 11, seed: 6 },
];

export interface KbFile {
  id: string;
  title: string;
  note: string;
  type: FileType;
  when: string;
}

/** The GST shelf, open in the old screen. */
export const KB_FILES: KbFile[] = [
  { id: "k1", title: "GST registration · document checklist", note: "Send at Reg-1", type: "PDF", when: "12 Oct" },
  { id: "k2", title: "GSTR-1 working template", note: "Monthly return prep", type: "XLSX", when: "3 Oct" },
  { id: "k3", title: "LUT filing guide", note: "Exporters only", type: "PDF", when: "28 Sep" },
  { id: "k4", title: "E-invoice threshold note", note: "Over ₹5 cr turnover", type: "PDF", when: "20 Sep" },
  { id: "k5", title: "GST portal · common errors", note: "Internal", type: "DOCX", when: "11 Sep" },
  { id: "k6", title: "Input credit reconciliation", note: "Quarterly", type: "XLSX", when: "2 Sep" },
];

export const KB_OPEN_SHELF = "GST";

export const KB_DRAFT = {
  title: "GST registration · document checklist",
  when: "Send to the client at Reg-1. Covers PAN, address proof and bank letter.",
};
