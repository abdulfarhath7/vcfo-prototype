"use client";
import * as React from "react";
import { Link2, Mail, MessageCircle, Phone, RefreshCw, UserRoundCog, Video, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SBC, WHATSAPP, type Person } from "@/data/people";
import { MEMBERS, MEMBER_LABEL, MEMBER_TONE, type Member } from "@/data/updates-team";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { Field, Input, Checkbox } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { CopyButton } from "@/components/ui/CopyButton";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { DataGrid } from "@/components/cards/DataGrid";

/** C-0026: 8 px gap between contact buttons. */
export function Contact({ p }: { p: Pick<Person, "name" | "phone" | "email"> }) {
  const btn = "grid h-[30px] w-[30px] place-items-center rounded-md border border-line text-ink-2 hover:bg-raised";
  return (
    <span className="flex gap-2">
      <a href={WHATSAPP(p.phone)} className={cn(btn, "border-transparent bg-ok-soft text-ok")} aria-label={`WhatsApp ${p.name}`} title="WhatsApp">
        <MessageCircle size={15} strokeWidth={1.5} />
      </a>
      <a href={`tel:${p.phone}`} className={btn} aria-label={`Call ${p.name}`} title="Call">
        <Phone size={15} strokeWidth={1.5} />
      </a>
      <a href={`mailto:${p.email}`} className={btn} aria-label={`Email ${p.name}`} title="Email">
        <Mail size={15} strokeWidth={1.5} />
      </a>
      <a href="#" className={btn} aria-label={`Teams ${p.name}`} title="Teams">
        <Video size={15} strokeWidth={1.5} />
      </a>
    </span>
  );
}

const ROLES = ["Director", "Finance", "Operations", "Company secretary", "Other"];
const LINK = "https://vcfo.sbcllp.in/set-password/7f3a9c";

/** Set-password link row inside the invite and hand-off dialogs. */
function SignInLink() {
  return (
    <div className="grid gap-1.5">
      <span className="text-12.5 font-semibold text-muted">Sign-in</span>
      <div className="flex items-center gap-3 rounded-md border border-line px-3 py-2">
        <Link2 size={16} strokeWidth={1.5} className="flex-none text-accent" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-13.5 font-semibold">Set-password link by email</span>
          <span className="block text-12 text-muted">Expires in 7 days</span>
        </span>
        <CopyButton value={LINK} label="the link" />
      </div>
    </div>
  );
}

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** team_invite: name, work email, role, link, Send invite. */
function InviteDialog({ open, onOpenChange, onSend }: { open: boolean; onOpenChange: (v: boolean) => void; onSend: (m: Member) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState(ROLES[0]);
  const ok = name.trim().length > 1 && validEmail(email);
  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole(ROLES[0]);
    }
  }, [open]);
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Invite a colleague"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!ok}
            onClick={() => {
              const ini = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
              onSend({ id: `inv-${Date.now()}`, name: name.trim(), ini, email: email.trim(), role, kind: "invited", when: "Sent 6 Oct" });
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <form className="grid gap-3" onSubmit={(e) => e.preventDefault()}>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ananya Rao" autoFocus />
        </Field>
        <Field label="Work email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ananya@northwind.in" className="font-mono text-13" aria-invalid={email.length > 0 && !validEmail(email)} />
        </Field>
        <Field label="Role">
          <Select size="md" value={role} onChange={(e) => setRole(e.target.value)} options={ROLES.map((r) => ({ value: r, label: r }))} />
        </Field>
        <SignInLink />
        <div className="flex items-center gap-2 text-12.5 text-muted">
          Access <Chip tone="idle">Member</Chip>
        </div>
      </form>
    </Modal>
  );
}

/** team_handoff: hand off your own seat, or put a new person in a colleague's seat. R-40: a tick confirms the risky change. */
function SeatDialog({ from, self, open, onOpenChange, onDone }: { from: Member | null; self: boolean; open: boolean; onOpenChange: (v: boolean) => void; onDone: (to: { name: string; email: string }) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [sure, setSure] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setSure(false);
    }
  }, [open]);
  if (!from) return null;
  const ok = name.trim().length > 1 && validEmail(email) && sure;
  const toIni = name.trim() ? name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") : "?";
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={self ? "Hand off your seat" : `Substitute ${from.name}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!ok} onClick={() => onDone({ name: name.trim(), email: email.trim() })}>
            {self ? "Hand off and leave" : "Substitute"}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border border-line bg-raised px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={from.ini} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-13 font-semibold">{from.name}</span>
              <span className="block truncate text-12 text-muted">{MEMBER_LABEL[from.kind]} · Northwind</span>
            </span>
          </span>
          <span className="text-faint" aria-hidden>
            ›
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <Avatar name={toIni} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-13 font-semibold">{name.trim() || "New person"}</span>
              <span className="block truncate text-12 text-muted">{self ? "New Primary" : "New member"}</span>
            </span>
          </span>
        </div>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Work email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono text-13" />
        </Field>
        <SignInLink />
        <label className="flex items-start gap-2.5 text-13 font-semibold">
          <Checkbox checked={sure} onChange={setSure} label={self ? "I understand I will be signed out" : `I understand ${from.name} loses access`} />
          <span>{self ? "I understand I will be signed out" : `I understand ${from.name} loses access`}</span>
        </label>
      </div>
    </Modal>
  );
}

const TEAM_TABS: Array<{ key: string; label: string; kind?: Member["kind"] }> = [
  { key: "all", label: "All" },
  { key: "primary", label: "Primary", kind: "primary" },
  { key: "member", label: "Members", kind: "member" },
  { key: "invited", label: "Invited", kind: "invited" },
];

/** R-42 / C-0027 / C-0028: Team is one section inside Profile. SBC team on top, client's people in a large card below. */
export function TeamSection() {
  const team = SBC.filter((p) => ["pranay", "bharath", "support"].includes(p.id));
  const [members, setMembers] = React.useState<Member[]>(MEMBERS);
  const [tab, setTab] = React.useState("all");
  const [invite, setInvite] = React.useState(false);
  const [seat, setSeat] = React.useState<Member | null>(null);
  const toast = useUndoToast();
  const shown = members.filter((m) => tab === "all" || m.kind === tab);

  const remove = (m: Member, text: string) => {
    const before = members;
    setMembers((l) => l.filter((x) => x.id !== m.id));
    toast.show(text, () => setMembers(before));
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard title="Northwind's SBC team" flush>
        {team.map((p) => (
          <ListRow key={p.id} className="flex-wrap sm:flex-nowrap">
            <Avatar name={p.ini ?? p.name} size={36} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-semibold">{p.name}</span>
                <Chip tone={p.id === "support" ? "prog" : "idle"} dot={false}>
                  {p.role}
                </Chip>
              </span>
              <span className="block truncate font-mono text-12 text-muted">
                {p.email}
                {p.id === "support" && ` · ${p.phone}`}
              </span>
            </span>
            <Contact p={p} />
          </ListRow>
        ))}
      </SectionCard>

      <DataGrid
        title="People from Northwind"
        meta={`${members.length} people`}
        filters={
          <>
            <Tabs items={TEAM_TABS.map((t) => ({ key: t.key, label: t.label, count: members.filter((m) => !t.kind || m.kind === t.kind).length }))} value={tab} onChange={setTab} />
            <Button size="sm" variant="primary" onClick={() => setInvite(true)}>
              Invite
            </Button>
          </>
        }
        empty={tab === "invited" ? "No pending invites" : "No people"}
        columns={[
          {
            key: "name",
            label: "Name",
            render: (m) => (
              <span className="flex min-w-[160px] items-center gap-2.5">
                <Avatar name={m.ini} size={24} />
                <span className="font-semibold">{m.name}</span>
                {m.you && <span className="text-12 text-muted">you</span>}
              </span>
            ),
          },
          { key: "role", label: "Role", width: 120 },
          { key: "email", label: "Email", mono: true },
          { key: "when", label: "Since", width: 110, render: (m) => <span className="font-mono text-12.5 text-muted">{m.when}</span> },
          { key: "access", label: "Access", width: 132, render: (m) => <Chip tone={MEMBER_TONE[m.kind]} fixed>{MEMBER_LABEL[m.kind]}</Chip> },
          {
            key: "act",
            label: "",
            width: 150,
            render: (m) =>
              m.kind === "invited" ? (
                <span className="flex gap-2">
                  <Button size="iconSm" variant="ghost" aria-label={`Resend invite to ${m.email}`} title="Resend invite" onClick={() => toast.show(`Invite sent again to ${m.email}`)}>
                    <RefreshCw size={15} strokeWidth={1.5} />
                  </Button>
                  <Button size="iconSm" variant="ghost" aria-label={`Cancel invite to ${m.email}`} title="Cancel invite" onClick={() => remove(m, `Invite to ${m.name} cancelled`)}>
                    <X size={15} strokeWidth={1.5} />
                  </Button>
                </span>
              ) : m.you ? (
                <Button size="sm" onClick={() => setSeat(m)}>
                  Hand off
                </Button>
              ) : (
                <Button size="iconSm" variant="ghost" aria-label={`Substitute ${m.name}`} title="Substitute" onClick={() => setSeat(m)}>
                  <UserRoundCog size={15} strokeWidth={1.5} />
                </Button>
              ),
          },
        ]}
        rows={shown}
        rowKey={(m) => m.id}
      />

      <InviteDialog
        open={invite}
        onOpenChange={setInvite}
        onSend={(m) => {
          setInvite(false);
          setMembers((l) => [...l, m]);
          setTab("all");
          toast.show(`Invite sent to ${m.email}`, () => setMembers((l) => l.filter((x) => x.id !== m.id)));
        }}
      />
      <SeatDialog
        from={seat}
        self={!!seat?.you}
        open={seat !== null}
        onOpenChange={(v) => !v && setSeat(null)}
        onDone={(to) => {
          const from = seat!;
          const before = members;
          const ini = to.name.split(/\s+/).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
          setMembers((l) => [...l.filter((x) => x.id !== from.id), { id: `sub-${Date.now()}`, name: to.name, ini, email: to.email, role: from.role, kind: "invited", when: "Sent 6 Oct" }]);
          setSeat(null);
          toast.show(from.you ? `Hand-off sent to ${to.name}` : `${to.name} invited in place of ${from.name}`, () => setMembers(before));
        }}
      />
      {toast.node}
    </div>
  );
}
