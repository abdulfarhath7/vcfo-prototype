"use client";
import * as React from "react";
import { Check, Download, FileText, List, PenLine } from "lucide-react";
import { fmt } from "@/lib/dates";
import { STEPS } from "@/data/incorporation";
import { NORTHWIND } from "@/data/people";
import { DOCS } from "@/data/client-home";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SectionCard } from "@/components/cards/SectionCard";
import { Thread } from "@/components/cards/Thread";
import { DocList } from "@/components/cards/DocList";

const draft = STEPS[1];
const signedStep = STEPS[2];

export function BoardResolutionScreen() {
  const [signedOn, setSignedOn] = React.useState<Date | undefined>(signedStep.status === "Completed" ? signedStep.done : undefined);
  const signed = !!signedOn;

  return (
    <Cols>
      <Col>
        <SectionCard
          title="Board resolution"
          icon={{ Icon: FileText, tone: "amber" }}
          meta="Certified true copy"
          right={<Chip tone={signed ? "ok" : "warn"}>{signedOn ? `Signed ${fmt(signedOn)}` : "Waiting for signature"}</Chip>}
          flush
        >
          <article className="mx-auto max-w-[720px] px-5 py-6 text-13.5 leading-relaxed text-ink-2 md:px-8 md:py-8">
            <h2 className="text-center text-13 font-semibold uppercase tracking-wide text-ink">
              Certified true copy of the resolution passed by the Board of Directors of Northwind Inc. at its meeting held on 11 September 2026
            </h2>
            <p className="mt-5">The Board considered the proposal to set up a wholly owned subsidiary in India for software development and IT services.</p>
            <h3 className="mt-5 text-12.5 font-semibold uppercase tracking-wide text-ink">Resolved that</h3>
            <p className="mt-1.5">
              the Company incorporate a private limited company in India under the Companies Act, 2013, with the proposed name <b className="font-semibold text-ink">{NORTHWIND.name}</b>, and an authorised capital of ₹10,00,000.
            </p>
            <h3 className="mt-5 text-12.5 font-semibold uppercase tracking-wide text-ink">Resolved further that</h3>
            <p className="mt-1.5">Mr Rohan Kumar, Director, be authorised to sign the application for reservation of name, the SPICe+ forms, the memorandum and articles of association, and every other document for the incorporation.</p>
            <p className="mt-3">SBC LLP, Chartered Accountants, be appointed to file the forms with the Registrar of Companies and to act for the Company before the Ministry of Corporate Affairs.</p>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-line-soft pt-4">
              <div>
                <div className="text-12 text-muted">For Northwind Inc.</div>
                <div className="mt-6 text-13.5 font-semibold text-ink">{signed ? "Rohan Kumar" : "-"}</div>
                <div className="text-12 text-muted">Director</div>
              </div>
              <div className="text-right text-12 text-muted">
                <div>Place: Bengaluru</div>
                <div>Date: {signedOn ? fmt(signedOn) : "-"}</div>
              </div>
            </div>
          </article>
          <footer className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
            {signed ? (
              <Button variant="soft" aria-disabled>
                <Check size={16} strokeWidth={1.5} /> Signed
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setSignedOn(new Date(2026, 9, 6))}>
                <PenLine size={16} strokeWidth={1.5} /> Sign
              </Button>
            )}
            <Button>
              <Download size={16} strokeWidth={1.5} /> Download
            </Button>
          </footer>
        </SectionCard>
      </Col>
      <Col>
        <SectionCard title="Thread" icon={{ Icon: List, tone: "blue" }}>
          <Thread
            steps={[
              { id: "b1", title: "Drafted", state: "done", date: draft.done, by: "Bharath", owner: "sbc" },
              { id: "b2", title: "Released to Northwind", state: "done", date: draft.done, by: "Bharath" },
              signed
                ? { id: "b3", title: "Signed", state: "done", date: signedOn, by: "Rohan Kumar", owner: "client" }
                : { id: "b3", title: "Signed", state: "current", owner: "client", by: "Waiting on Northwind" },
              signed ? { id: "b4", title: "Received by SBC", state: "done", date: signedOn, by: "Bharath" } : { id: "b4", title: "Received by SBC", state: "upcoming" },
              { id: "b5", title: "Name application filed", state: STEPS[3].status === "Completed" ? "done" : "upcoming", date: STEPS[3].done, by: "Bharath" },
            ]}
          />
        </SectionCard>
        <SectionCard title="Files" flush>
          <DocList groups={[{ label: "Board resolution", docs: DOCS.filter((x) => x.id === "d3" || x.id === "d4") }]} />
        </SectionCard>
      </Col>
    </Cols>
  );
}
