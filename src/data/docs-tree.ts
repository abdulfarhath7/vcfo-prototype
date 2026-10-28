/* Documents tree (reference/old-screens/s/docs/docs_a_refined.dc.html). Client Documents and staff Vault share it. */
import { d } from "@/lib/dates";
import type { FileType } from "@/components/ui/FileBadge";
import type { DocItem } from "@/data/docs-library";

export type TreeStatus = "Approved" | "Final" | "In review" | "Replaced" | "Missing";
export type TreeCat = "c1" | "c2" | "c3" | "c4" | "c5";

export interface TreeFolder {
  id: string;
  parent: string | null;
  label: string;
}

export interface TreeFile {
  id: string;
  parent: string;
  label: string;
  type?: FileType;
  status: TreeStatus;
  from: string;
  date: Date;
  file: string;
  cat: TreeCat;
  /** Replaced by a newer file. Hidden until "Replaced" is on. */
  hidden?: boolean;
  /** Missing file: due later or overdue. */
  due?: "due" | "over";
  /** Address proof older than 2 months. */
  stale?: boolean;
  /** Government portal that can verify the file. */
  portal?: { label: string; href: string };
}

export const TREE_FOLDERS: TreeFolder[] = [
  { id: "p1", parent: null, label: "Phase 1 · Name application" },
  { id: "s3", parent: "p1", label: "3 · Signed Board resolution" },
  { id: "p2", parent: null, label: "Phase 2 · Incorporation" },
  { id: "s6", parent: "p2", label: "6 · Director KYC" },
  { id: "s8", parent: "p2", label: "8 · Registered office address" },
  { id: "s17", parent: "p2", label: "17 · Certificate of Incorporation" },
  { id: "p3", parent: null, label: "Phase 3 · Post-incorporation" },
  { id: "s21", parent: "p3", label: "21 · Share Capital Infusion" },
  { id: "s22", parent: "p3", label: "22 · Share Certificates (SH-1)" },
];

const MCA = { label: "MCA portal", href: "https://www.mca.gov.in" };

export const TREE_FILES: TreeFile[] = [
  { id: "v1", parent: "s3", label: "Board resolution (final)", type: "PDF", status: "Final", from: "SBC · Bharath", date: d(2026, 9, 18), file: "board-resolution-final.pdf", cat: "c3" },
  { id: "v2", parent: "s3", label: "Board resolution (draft v1)", type: "DOCX", status: "Replaced", from: "SBC · Bharath", date: d(2026, 9, 12), file: "draft-board-resolution-v1.docx", cat: "c3", hidden: true },
  { id: "v3", parent: "s6", label: "PAN card · Ravi Kumar", type: "PDF", status: "Approved", from: "Northwind", date: d(2026, 9, 14), file: "ravi-kumar-pan.pdf", cat: "c1", portal: { label: "Income-tax e-filing", href: "https://www.incometax.gov.in" } },
  { id: "v4", parent: "s6", label: "Passport · Meera Shah", type: "PDF", status: "Approved", from: "Northwind", date: d(2026, 9, 14), file: "meera-shah-passport.pdf", cat: "c1" },
  { id: "v5", parent: "s6", label: "Address proof · Ravi Kumar", type: "PDF", status: "Approved", from: "Northwind", date: d(2026, 9, 15), file: "electricity-bill-aug.pdf", cat: "c1", stale: true },
  { id: "v5b", parent: "s6", label: "Address proof · Ravi (June bill)", type: "PDF", status: "Replaced", from: "Northwind", date: d(2026, 9, 2), file: "electricity-bill-jun.pdf", cat: "c1", hidden: true },
  { id: "v6", parent: "s6", label: "Photograph · Meera Shah", type: "JPG", status: "Approved", from: "Northwind", date: d(2026, 9, 15), file: "meera-photo.jpg", cat: "c1" },
  { id: "m1", parent: "s6", label: "Signed DIR-2 · Meera Shah", status: "Missing", from: "Asked by Bharath", date: d(2026, 11, 12), file: "-", cat: "c1", due: "due" },
  { id: "v7", parent: "s8", label: "Utility bill · office", type: "PDF", status: "Approved", from: "Northwind", date: d(2026, 9, 22), file: "office-electricity-sep.pdf", cat: "c2" },
  { id: "v8", parent: "s8", label: "Rent agreement", type: "DOCX", status: "Approved", from: "Northwind", date: d(2026, 9, 23), file: "rent-agreement.docx", cat: "c2" },
  { id: "m2", parent: "s8", label: "Notarised lease deed", status: "Missing", from: "Asked by Bharath", date: d(2026, 11, 6), file: "-", cat: "c2", due: "over" },
  { id: "v9", parent: "s17", label: "Certificate of Incorporation", type: "PDF", status: "Final", from: "SBC · Bharath", date: d(2026, 10, 24), file: "COI-Northwind.pdf", cat: "c4", portal: MCA },
  { id: "v10", parent: "s17", label: "MoA and AoA (stamped)", type: "PDF", status: "Final", from: "SBC · Bharath", date: d(2026, 10, 24), file: "moa-aoa-northwind.pdf", cat: "c4", portal: MCA },
  { id: "v11", parent: "s21", label: "FIRC from the bank", type: "PDF", status: "Approved", from: "Northwind", date: d(2026, 11, 2), file: "firc-hdfc.pdf", cat: "c5" },
  { id: "v12", parent: "s21", label: "Bank statement · Oct 2026", type: "PDF", status: "Approved", from: "Northwind", date: d(2026, 11, 3), file: "hdfc-statement-oct.pdf", cat: "c5" },
  { id: "v13", parent: "s22", label: "Apostilled parent COI", type: "PDF", status: "In review", from: "Northwind", date: d(2026, 11, 6), file: "parent-coi-apostille.pdf", cat: "c3" },
  { id: "v14", parent: "s22", label: "Share certificates SH-1", type: "PDF", status: "Final", from: "SBC · Bharath", date: d(2026, 11, 7), file: "sh1-certificates.pdf", cat: "c4" },
];

export const TREE_CATS: Array<{ id: TreeCat; label: string }> = [
  { id: "c1", label: "Identity & KYC" },
  { id: "c2", label: "Office address" },
  { id: "c3", label: "Company records" },
  { id: "c4", label: "Certificates" },
  { id: "c5", label: "Banking & capital" },
];

/** Folders open at first: all but "21 · Share Capital Infusion". The COI is selected. */
export const TREE_OPEN = ["p1", "s3", "p2", "s6", "s8", "s17", "p3", "s22", "c1", "c2", "c3", "c4"];
export const TREE_SELECTED = "v9";

export const treeFile = (id: string) => TREE_FILES.find((f) => f.id === id);
export const treeFolder = (id: string) => TREE_FOLDERS.find((f) => f.id === id);

/** The tree file as a DocItem, for the shared document viewer. */
export function treeDoc(f: TreeFile): DocItem {
  return {
    id: f.id,
    name: f.file === "-" ? f.label : f.file,
    label: f.label,
    fileName: f.file,
    type: f.type ?? "PDF",
    size: "",
    date: f.date,
    from: f.from.startsWith("SBC") ? "sbc" : "client",
    status: f.status === "Missing" ? "Requested" : f.status === "In review" ? "Received" : "Verified",
    folder: f.parent,
    category: "records",
    portal: f.portal,
  };
}
