"use client";
import * as React from "react";
import { Download, Send } from "lucide-react";
import { TODAY, d, fmt } from "@/lib/dates";
import { clientById } from "@/data/staff-clients";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { FileBadge } from "@/components/ui/FileBadge";
import { SectionCard, ListRow, HeadLink } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { ClientDot, stepHrefFor, type StaffPortal } from "./parts";

// Ported from reference/old-screens/s/lead/BoardRes.dc.html. The old sample was Larkspur (Pre-2); here it is Ember, step 2.
const CLIENT = "ember";

const DRAFT = [
  "CERTIFIED TRUE COPY OF THE RESOLUTION PASSED BY THE BOARD OF DIRECTORS OF EMBER STUDIOS HOLDINGS LIMITED",
  "At the meeting of the Board of Directors held on 29 September 2026 at London, the following resolution was passed:",
  "“RESOLVED THAT the Company do incorporate a wholly owned subsidiary in India under the name Ember Studios Private Limited or such other name as may be approved by the Registrar of Companies.”",
  "“RESOLVED FURTHER THAT Ms Sofia Moreau, Director, be and is hereby authorised to sign the subscriber sheet, Memorandum and Articles of Association and all other documents for the incorporation.”",
  "“RESOLVED FURTHER THAT the Company subscribe to 9,999 equity shares of ₹10 each of the proposed company.”",
  "For and on behalf of the Board",
  "Sofia Moreau, Director",
];

interface Version {
  v: number;
  label: string;
  by: string;
  date: Date;
  state: string;
}

const VERSIONS: Version[] = [
  { v: 1, label: "Generated from client details", by: "VCFO", date: d(2026, 9, 28), state: "Done" },
  { v: 2, label: "Draft · edited", by: "Divya", date: d(2026, 10, 2), state: "Done" },
  { v: 3, label: "Draft · manager review", by: "Divya", date: d(2026, 10, 5), state: "In review" },
];

export function BoardResolutionScreen({ portal }: { portal: StaffPortal }) {
  const c = clientById(CLIENT)!;
  const [sent, setSent] = React.useState(false);
  const versions: Version[] = sent ? [...VERSIONS.map((x) => ({ ...x, state: "Done" })), { v: 4, label: "Sent to client", by: "Divya", date: TODAY, state: "Sent" }] : VERSIONS;

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Board resolution"
          meta={
            <span className="inline-flex items-center gap-1.5">
              <ClientDot tone={c.tone} />
              {c.short} · Step 2
            </span>
          }
          right={
            sent ? (
              <Chip tone="ok">Sent {fmt(TODAY)}</Chip>
            ) : (
              <>
                <Button size="sm" variant="outline">
                  Save
                </Button>
                <Button size="sm" variant="primary" onClick={() => setSent(true)}>
                  <Send size={14} strokeWidth={1.5} /> Send to client
                </Button>
              </>
            )
          }
        >
          <article className="mx-auto grid max-w-[640px] gap-3 rounded-md border border-line bg-surface px-5 py-6 text-13.5 leading-relaxed md:px-8">
            <h3 className="text-center text-13 font-semibold">{DRAFT[0]}</h3>
            {DRAFT.slice(1, 5).map((p) => (
              <p key={p}>{p}</p>
            ))}
            <p className="mt-6">{DRAFT[5]}</p>
            <p className="border-t border-line pt-2 text-muted">{DRAFT[6]}</p>
          </article>
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Document" flush right={<HeadLink href={stepHrefFor(portal, CLIENT, 2)}>Open step ›</HeadLink>}>
          <ListRow>
            <FileBadge type="DOCX" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-12.5 font-semibold">board-resolution-ember-v{versions.length}.docx</span>
              <span className="block truncate text-12.5 text-muted">52 KB · {fmt(versions[versions.length - 1].date)}</span>
            </span>
            <Button size="iconSm" variant="ghost" aria-label="Download">
              <Download size={16} strokeWidth={1.5} />
            </Button>
          </ListRow>
          <div className="border-t border-line-soft px-4 py-3 md:px-5">
            <KeyValue
              cols={2}
              rows={[
                { k: "Client", v: c.short },
                { k: "Signs", v: "Sofia Moreau" },
                { k: "Project lead", v: c.lead },
                { k: "Approver", v: c.manager },
              ]}
            />
          </div>
        </SectionCard>
        <SectionCard title="Versions" flush>
          {[...versions].reverse().map((x) => (
            <ListRow key={x.v}>
              <span className="w-8 flex-none font-mono text-12 text-muted">v{x.v}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{x.label}</span>
                <span className="block truncate text-12.5 text-muted">
                  {x.by} · {fmt(x.date)}
                </span>
              </span>
              <Chip>{x.state}</Chip>
            </ListRow>
          ))}
        </SectionCard>
      </Col>
    </Cols>
  );
}
