"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { clientById } from "@/data/staff-clients";
import { MAIL_ADDRESS, RECIPIENTS, TEMPLATES, type MailTemplate } from "@/data/staff-mail";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { SectionCard, HeadLink } from "@/components/cards/SectionCard";
import { type StaffPortal } from "./parts";
import { RecipientField, TemplateDialog, TemplateList, toLabel, type To } from "./email-parts";

// Staff Email, as in reference/old-screens/s/lead/Email.dc.html: the compose form is open first,
// "To" takes client, team and group chips with suggestions, and the templates sit on the right.

const SIGNER: Record<StaffPortal, string> = {
  lead: "Bharath",
  manager: "Pranay",
  admin: "Krishna",
};
/** The team chip in the old "To" field: Pranay on the lead and manager screens, Krishna on the admin screen. */
const TEAM_TO: Record<StaffPortal, string> = {
  lead: "pranay",
  manager: "pranay",
  admin: "krishna",
};

interface Draft {
  to: To[];
  subject: string;
  template: string;
  body: string;
}

const first = (name: string) => name.split(" ")[0];

/** Template fields from the first client recipient. Northwind and Rohan when nobody is picked. */
function fill(text: string, to: To[]) {
  const r = to.map((t) => (t.kind === "person" ? RECIPIENTS.find((x) => x.id === t.id) : undefined)).find((x) => x?.client);
  const c = r?.client ? clientById(r.client) : undefined;
  return text
    .replaceAll("{client}", c?.short ?? "Northwind")
    .replaceAll("{name}", r ? first(r.name) : "Rohan")
    .replaceAll("{step}", c?.step.toLowerCase() ?? "this step");
}

function initial(portal: StaffPortal): Draft {
  return {
    to: [
      { kind: "person", id: "rohan" },
      { kind: "person", id: TEAM_TO[portal] },
    ],
    subject: "Northwind · utility bill and NOC for your registered office",
    template: "doc",
    body: [
      "Hi Rohan,",
      "",
      "To file SPICe+ Part B we still need two papers for the office at MG Road:",
      "",
      "• a utility bill dated after 15 September",
      "• the owner's NOC, signed and dated",
      "",
      "Upload them on your Incorporation page. Thanks,",
      SIGNER[portal],
    ].join("\n"),
  };
}

const EMPTY: Draft = { to: [], subject: "", template: "", body: "" };

function Line({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 border-b border-line-soft px-4 py-2 md:grid-cols-[90px_minmax(0,1fr)] md:px-5", className)}>
      <label htmlFor={htmlFor} className="text-13 font-medium text-muted">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Email({ portal }: { portal: StaffPortal }) {
  const [draft, setDraft] = React.useState<Draft>(() => initial(portal));
  // The sidebar "Email Pranay" link opens /lead/email?to=pranay: start a new message to that person.
  const toParam = useSearchParams().get("to");
  React.useEffect(() => {
    if (toParam && RECIPIENTS.some((r) => r.id === toParam)) setDraft({ ...EMPTY, to: [{ kind: "person", id: toParam }] });
  }, [toParam]);
  const [templates, setTemplates] = React.useState<MailTemplate[]>(TEMPLATES);
  const [editing, setEditing] = React.useState<MailTemplate | undefined>();
  const [dialog, setDialog] = React.useState(false);
  const [sent, setSent] = React.useState<string | null>(null);
  const tpl = templates.find((t) => t.id === draft.template);

  const pick = (id: string) => {
    const t = templates.find((x) => x.id === id);
    setSent(null);
    setDraft({
      ...draft,
      template: id,
      subject: t ? fill(t.subject, draft.to) : draft.subject,
      body: t ? `${fill(t.body, draft.to)}\n${SIGNER[portal]}` : draft.body,
    });
  };
  const send = () => {
    setSent(draft.to.map(toLabel).join(", "));
    setDraft(EMPTY);
  };

  return (
    <div className="grid gap-5">
      {/* Plain page head (R-02). K-40: Outlook adds the signature on the server. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-[1_1_240px]">
          <h1 className="text-28 font-medium leading-9 tracking-[-0.01em]">Email</h1>
          <p className="text-13.5 text-muted">Signature from Outlook · server-side signature on</p>
        </div>
        <Chip tone="ok">Outlook connected</Chip>
        <HeadLink href={`/${portal}/profile?tab=settings`}>Profile › Email</HeadLink>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-md border-1.5 border-line bg-surface" aria-label="New message">
          <Line label="From">
            <span className="block truncate text-14 text-ink">{MAIL_ADDRESS[portal]}</span>
          </Line>
          <Line label="To">
            <RecipientField
              value={draft.to}
              onChange={(to) => {
                setSent(null);
                setDraft({ ...draft, to });
              }}
              bare
            />
          </Line>
          <Line label="Subject" htmlFor="mail-subject">
            <input id="mail-subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="h-8 w-full bg-transparent text-14 text-ink outline-none placeholder:text-faint" placeholder="Subject" />
          </Line>
          <div className="px-4 pb-4 pt-3 md:px-5">
            <textarea
              aria-label="Message"
              rows={12}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className="block min-h-[220px] w-full resize-y bg-transparent text-14 leading-relaxed text-ink outline-none placeholder:text-faint"
              placeholder="Message"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line-soft px-4 py-3 md:px-5">
            {tpl && <Tag tone="prog">Template · {tpl.name}</Tag>}
            {tpl && <Tag>{tpl.style}</Tag>}
            {sent && (
              <span className="flex min-w-0 items-center gap-2 text-12.5 text-muted">
                <Chip tone="ok">Sent</Chip>
                <span className="truncate">{sent}</span>
              </span>
            )}
            <span className="ml-auto flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setSent(null);
                  setDraft(EMPTY);
                }}
              >
                Discard
              </Button>
              <Button variant="primary" onClick={send} disabled={draft.to.length === 0 || !draft.subject.trim()}>
                Send
              </Button>
            </span>
          </div>
        </section>

        <SectionCard
          title="Templates"
          flush
          right={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(undefined);
                setDialog(true);
              }}
            >
              <Plus size={16} strokeWidth={1.6} /> Create
            </Button>
          }
        >
          <TemplateList
            templates={templates}
            active={draft.template}
            onUse={pick}
            onEdit={(t) => {
              setEditing(t);
              setDialog(true);
            }}
            onDelete={(id) => {
              setTemplates(templates.filter((t) => t.id !== id));
              if (draft.template === id) setDraft({ ...draft, template: "" });
            }}
          />
        </SectionCard>
      </div>

      <TemplateDialog
        open={dialog}
        onOpenChange={setDialog}
        initial={editing}
        onSave={(t) => {
          setTemplates(editing ? templates.map((x) => (x.id === t.id ? t : x)) : [...templates, t]);
          setDialog(false);
        }}
      />
    </div>
  );
}

/** useSearchParams needs a Suspense boundary. */
export function EmailScreen({ portal }: { portal: StaffPortal }) {
  return (
    <React.Suspense>
      <Email portal={portal} />
    </React.Suspense>
  );
}
