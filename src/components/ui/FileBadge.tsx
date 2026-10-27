import { cn } from "@/lib/cn";

export type FileType = "PDF" | "DOCX" | "XLSX" | "JPG" | "PNG" | "ZIP" | "CSV" | "TXT";

// R-26: PDF red, DOCX blue, XLSX green, JPG and PNG violet, ZIP grey.
const tones: Record<FileType, string> = {
  PDF: "bg-bad-soft text-bad",
  DOCX: "bg-accent-soft text-accent",
  XLSX: "bg-ok-soft text-ok",
  CSV: "bg-ok-soft text-ok",
  JPG: "bg-violet-soft text-violet",
  PNG: "bg-violet-soft text-violet",
  ZIP: "bg-idle-soft text-idle",
  TXT: "bg-idle-soft text-idle",
};

export function fileType(name: string): FileType {
  const ext = name.split(".").pop()?.toUpperCase() ?? "";
  if (ext === "JPEG") return "JPG";
  if (ext === "DOC") return "DOCX";
  if (ext === "XLS") return "XLSX";
  return (ext in tones ? ext : "TXT") as FileType;
}

export function FileBadge({ type, className }: { type: FileType; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 w-11 flex-none items-center justify-center rounded-sm font-mono text-11 font-semibold", tones[type], className)}>
      {type}
    </span>
  );
}
