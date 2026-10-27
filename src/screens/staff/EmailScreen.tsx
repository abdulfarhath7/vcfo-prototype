"use client";
import * as React from "react";
import { Download, FileText, Inbox, PenLine, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, fmt } from "@/lib/dates";
import { clientById } from "@/data/staff-clients";
import { MAIL, MAIL_ADDRESS, TEMPLATES, type Mail, type MailFolder } from "@/data/staff-mail";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { FileBadge, fileType } from "@/components/ui/FileBadge";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionCard, ListRow, Empty } from "@/components/cards/SectionCard";
import { ClientDot, ClientName, clientHref, type StaffPortal } from "./parts";
import { identityTag } from "./filters";

type Folder = MailFolder | "templates";

const FOLDERS: Array<{ key: Folder; label: string }> = [
  { key: "inbox", label: "Inbox" },
  { key: "sent", label: "Sent" },
  { key: "drafts", label: "Drafts" },
  { key: "templates", label: "Templates" },
];

const AREA = "w-full rounded-md border border-line bg-surface px-3 py-2 text-13.5 text-ink placeholder:text-faint outline-none focus-visible:ring-2 focus-visible:ring-accent-line";

const when = (m: Mail) => (m.date.getTime() === TODAY.getTime() ? m.time : fmt(m.date));
const first = (name: string) => name.split(" ")[0];

interface Draft {
  to: string;
  subject: string;
  template: string;
  body: string;
}

function fill(text: string, m?: Mail) {
  const c = m ? clientById(m.client) : undefined;
  return text
    .replaceAll("{client}", c?.short ?? "Northwind")
    .replaceAll("{name}", m ? first(m.from) : "Rohan")
    .replaceAll("{step}", c?.step.toLowerCase() ?? "this step");
}

function Compose({ draft, setDraft, from, onSend, onDiscard, context }: { draft: Draft; setDraft: (d: Draft) => void; from: string; onSend: () => void; onDiscard: () => void; context?: Mail }) {
  const pickTemplate = (id: string) => {
    const t = TEMPLATES.find((x) => x.id === id);
    setDraft({ ...draft, template: id, subject: t ? fill(t.subject, context) : draft.subject, body: t ? fill(t.body, context) : draft.body });
  };
  return (
    <SectionCard title="New message" icon={{ Icon: PenLine, tone: "blue" }} right={<span className="hidden font-mono text-12 text-muted sm:inline">{from}</span>}>
      <div className="grid gap-3.5">
        <Field label="To">
          <Input value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} placeholder="Name, email or client" />
        </Field>
        <Field label="Subject">
          <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
        </Field>
        <Field label="Template">
          <Select size="md" className="w-full [&>select]:w-full" value={draft.template} onChange={(e) => pickTemplate(e.target.value)} options={[{ value: "", label: "No template" }, ...TEMPLATES.map((t) => ({ value: t.id, label: t.name }))]} />
        </Field>
        <textarea aria-label="Message" rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={AREA} />
        {/* K-40: Outlook adds the signature on the server. */}
        <p className="text-12.5 text-muted">Signature from Outlook · server-side signature on</p>
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onDiscard}>
            Discard
          </Button>
          <Button size="sm" variant="primary" onClick={onSend} disabled={!draft.to.trim() || !draft.subject.trim()}>
            <Send size={16} strokeWidth={1.5} /> Send
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

function Reading({ m, portal, folder }: { m: Mail; portal: StaffPortal; folder: Folder }) {
  const [reply, setReply] = React.useState("");
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => {
    setReply("");
    setSent(false);
  }, [m.id]);
  return (
    <SectionCard title={m.subject} icon={{ Icon: Inbox, tone: "blue" }} flush>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-soft px-4 py-3 md:px-5">
        <span className="min-w-0">
          <span className="block truncate text-13.5 font-semibold">
            {folder === "inbox" ? m.from : `To ${m.from}`}
          </span>
          <span className="block truncate font-mono text-12 text-muted">{m.address}</span>
        </span>
        <ClientName id={m.client} short href={clientHref(portal, m.client)} className="text-12.5 font-semibold" />
        <span className="ml-auto text-12.5 text-muted">
          {fmt(m.date)} · {m.time}
        </span>
      </div>
      <div className="grid gap-3 px-4 py-4 text-13.5 leading-relaxed text-ink-2 md:px-5">
        {m.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {m.attachments && (
        <div className="flex flex-wrap gap-2 px-4 pb-4 md:px-5">
          {m.attachments.map((a) => (
            <span key={a} className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-md border border-line px-2.5 py-1.5">
              <FileBadge type={fileType(a)} />
              <span className="min-w-0 truncate font-mono text-12">{a}</span>
              <Button size="iconSm" variant="ghost" aria-label={`Download ${a}`}>
                <Download size={16} strokeWidth={1.5} />
              </Button>
            </span>
          ))}
        </div>
      )}
      {folder === "inbox" && (
        <div className="grid gap-2.5 border-t border-line-soft px-4 py-4 md:px-5">
          {sent ? (
            <span className="flex items-center gap-2 text-13">
              <Chip tone="ok">Sent</Chip>
              <span className="text-muted">Reply to {m.from}</span>
            </span>
          ) : (
            <>
              <textarea aria-label="Reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${first(m.from)}`} className={AREA} />
              <div className="flex items-center gap-2">
                <span className="text-12.5 text-muted">Signature from Outlook · server-side signature on</span>
                <Button size="sm" variant="primary" className="ml-auto" disabled={!reply.trim()} onClick={() => setSent(true)}>
                  <Send size={16} strokeWidth={1.5} /> Reply
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      {folder === "drafts" && (
        <div className="flex justify-end border-t border-line-soft px-4 py-3 md:px-5">
          <Button size="sm" variant="primary">
            <Send size={16} strokeWidth={1.5} /> Send
          </Button>
        </div>
      )}
    </SectionCard>
  );
}

export function EmailScreen({ portal }: { portal: StaffPortal }) {
  const [folder, setFolder] = React.useState<Folder>("inbox");
  const [picked, setPicked] = React.useState("m01");
  const [read, setRead] = React.useState<Record<string, true>>({ m01: true });
  const [compose, setCompose] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>({ to: "", subject: "", template: "", body: "" });
  const [outbox, setOutbox] = React.useState<Mail[]>([]);

  const all = [...outbox, ...MAIL];
  const list = folder === "templates" ? [] : all.filter((m) => m.folder === folder);
  const current = all.find((m) => m.id === picked && m.folder === folder) ?? list[0];
  const unread = (m: Mail) => m.unread && !read[m.id];
  const count = (f: Folder) => (f === "inbox" ? all.filter((m) => m.folder === "inbox" && unread(m)).length : f === "templates" ? TEMPLATES.length : all.filter((m) => m.folder === f).length);

  const open = (m: Mail) => {
    setPicked(m.id);
    setRead({ ...read, [m.id]: true });
    setCompose(false);
  };
  const startCompose = (template = "") => {
    const t = TEMPLATES.find((x) => x.id === template);
    setDraft({ to: "", subject: t ? fill(t.subject, current) : "", template, body: t ? fill(t.body, current) : "" });
    setCompose(true);
  };
  const send = () => {
    const c = current?.client ?? "northwind";
    setOutbox([{ id: `o${outbox.length + 1}`, folder: "sent", from: draft.to, address: draft.to, client: c, date: TODAY, time: "Now", subject: draft.subject, body: draft.body.split("\n").filter(Boolean) }, ...outbox]);
    setCompose(false);
    setFolder("sent");
    setPicked(`o${outbox.length + 1}`);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[180px_minmax(0,340px)_minmax(0,1fr)]">
      <SectionCard title="Mail" flush className="hidden lg:block">
        <nav aria-label="Folders" className="py-1.5">
          {FOLDERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFolder(f.key)}
              aria-current={folder === f.key ? "page" : undefined}
              className={cn("flex w-full items-center gap-2 px-4 py-2 text-left text-13.5", folder === f.key ? "bg-raised font-semibold text-ink" : "text-ink-2 hover:bg-raised")}
            >
              {f.label}
              <span className={cn("ml-auto text-12", f.key === "inbox" && count("inbox") > 0 ? "font-semibold text-accent" : "text-faint")}>{count(f.key) || ""}</span>
            </button>
          ))}
        </nav>
      </SectionCard>

      <SectionCard
        title={FOLDERS.find((f) => f.key === folder)!.label}
        meta={folder === "inbox" ? `${count("inbox")} new` : undefined}
        flush
        right={
          <>
            <Select aria-label="Folder" value={folder} onChange={(e) => setFolder(e.target.value as Folder)} options={FOLDERS.map((f) => ({ value: f.key, label: f.label }))} className="lg:hidden" />
            <Button size="sm" variant="primary" onClick={() => startCompose()}>
              <PenLine size={16} strokeWidth={1.5} /> Compose
            </Button>
          </>
        }
      >
        {folder === "templates" ? (
          TEMPLATES.map((t) => (
            <ListRow key={t.id} onClick={() => startCompose(t.id)}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{t.name}</span>
                <span className="block truncate text-12.5 text-muted">{t.style}</span>
              </span>
              <FileText size={16} strokeWidth={1.5} className="flex-none text-faint" />
            </ListRow>
          ))
        ) : list.length === 0 ? (
          <Empty />
        ) : (
          list.map((m) => {
            const c = clientById(m.client);
            const on = !compose && current?.id === m.id;
            return (
              <ListRow key={m.id} onClick={() => open(m)} className={cn("items-start", on && "bg-accent-soft hover:bg-accent-soft")}>
                <i className={cn("mt-1.5 h-1.5 w-1.5 flex-none rounded-full", unread(m) ? "bg-accent" : "bg-transparent")} aria-label={unread(m) ? "Unread" : undefined} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("min-w-0 flex-1 truncate", unread(m) ? "font-semibold" : "font-medium")}>{folder === "inbox" ? m.from : `To ${m.from}`}</span>
                    <span className="flex-none text-12 text-muted">{when(m)}</span>
                  </span>
                  <span className={cn("block truncate text-13", unread(m) ? "text-ink" : "text-ink-2")}>{m.subject}</span>
                  {c && (
                    <span className="mt-1 flex items-center gap-1.5 text-12 text-muted">
                      <ClientDot tone={c.tone} />
                      {c.short}
                      {m.attachments && <Tag tone={identityTag.idle} className="ml-1 h-[18px] px-1.5">{m.attachments.length} file{m.attachments.length > 1 ? "s" : ""}</Tag>}
                    </span>
                  )}
                </span>
              </ListRow>
            );
          })
        )}
      </SectionCard>

      <div className="min-w-0">
        {compose ? (
          <Compose draft={draft} setDraft={setDraft} from={MAIL_ADDRESS[portal]} onSend={send} onDiscard={() => setCompose(false)} context={current} />
        ) : current ? (
          <Reading m={current} portal={portal} folder={folder} />
        ) : (
          <SectionCard title="Message">
            <Empty />
          </SectionCard>
        )}
      </div>
    </div>
  );
}
