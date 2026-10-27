import Link from "next/link";
import { Download, Share2 } from "lucide-react";
import { fmt } from "@/lib/dates";
import { FILES, docStatusTone } from "@/data/shared";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Cols, Col } from "@/components/shell/Page";
import type { Portal } from "@/data/nav";

/** Shared document viewer. No back link (R-09). */
export function DocViewerScreen({ portal, id }: { portal: Portal; id: string }) {
  const f = FILES.find((x) => x.id === id) ?? FILES[0];
  const stepHref = portal === "client" ? `/client/incorporation/step/${f.step}` : `/${portal}/clients/northwind/step/${f.step}`;
  const related = FILES.filter((x) => x.folder === f.folder && x.id !== f.id).slice(0, 4);
  return (
    <Cols>
      <Col>
        <SectionCard
          bare
          title={f.name}
          bodyClassName="p-0"
        >
          <div className="flex min-h-head flex-wrap items-center gap-3 border-b border-line-soft px-5 py-2">
            <FileBadge type={f.type} />
            <span className="min-w-0 flex-1 truncate font-mono text-13.5 font-medium">{f.name}</span>
            <Chip tone={docStatusTone[f.status]}>{f.status}</Chip>
            <Button size="sm">
              <Share2 size={14} strokeWidth={1.5} /> Copy link
            </Button>
            <Button size="sm" variant="primary">
              <Download size={14} strokeWidth={1.5} /> Download
            </Button>
          </div>
          <div className="grid min-h-[60vh] place-items-center bg-raised p-6">
            <div className="grid aspect-[1/1.3] w-full max-w-[560px] place-items-center rounded-md border border-line bg-surface text-13 text-faint">{f.type} · page 1 of 1</div>
          </div>
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Details">
          <KeyValue
            cols={1}
            rows={[
              { k: "From", v: <OwnerChip owner={f.from} label={f.from === "client" ? "Northwind" : undefined} /> },
              { k: "Date", v: fmt(f.date) },
              { k: "Size", v: f.size || "—" },
              { k: "Step", v: f.step ? <Link href={stepHref} className="font-semibold text-accent">Step {f.step}</Link> : "—" },
              { k: "Status", v: <Chip tone={docStatusTone[f.status]}>{f.status}</Chip> },
            ]}
          />
        </SectionCard>
        {related.length > 0 && (
          <SectionCard title="Same folder" flush>
            {related.map((r) => (
              <ListRow key={r.id} href={`${portal === "client" ? "/client" : `/${portal}`}/documents/view/${r.id}`}>
                <FileBadge type={r.type} />
                <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
                <span className="text-12 text-muted">{fmt(r.date)}</span>
              </ListRow>
            ))}
          </SectionCard>
        )}
      </Col>
    </Cols>
  );
}
