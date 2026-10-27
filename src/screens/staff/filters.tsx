import type { ChipTone } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Select";
import type { StaffClient } from "@/data/staff-clients";

/** Client identity colour as a tag tone (R-35). */
export const identityTag: Record<StaffClient["tone"], ChipTone> = { accent: "prog", violet: "violet", teal: "teal", warn: "warn", ok: "ok", idle: "idle" };

/** Head-bar filter: all clients or one. */
export function ClientSelect({ clients, value, onChange }: { clients: StaffClient[]; value: string; onChange: (id: string) => void }) {
  return <Select aria-label="Client" value={value} onChange={(e) => onChange(e.target.value)} options={[{ value: "", label: "All clients" }, ...clients.map((c) => ({ value: c.id, label: c.short }))]} />;
}
