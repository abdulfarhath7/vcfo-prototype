"use client";
import * as React from "react";
import { BellRing, Building2, Check, KeyRound, Minus, Palette, Plug, Target, UserPlus } from "lucide-react";
import { TODAY, fmt } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { Cols, Col } from "@/components/shell/Page";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field, Input, Switch } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { DataGrid, type Column } from "@/components/cards/DataGrid";
import { ActivityList, type ActivityRow } from "@/components/cards/ActivityList";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { BRAND_COLOURS, PEOPLE, ROLE_TONE, SERVICE_TARGETS, type Person } from "@/data/super-firm";
import { FIRM_PROFILE, HOLIDAYS, INTEGRATIONS, INTEGRATION_TONE, REMINDER_RULES, ROLE_PERMS, type Holiday, type Integration, type RolePerm } from "@/data/super";

type Perm = "view" | "edit" | "approve";

// Firm settings. The first build had profile, working calendar, roles, reminders and integrations.
// Ported from reference/old-patch/super/Settings.dc.html: "People and roles" with Add person, "Service targets", "Branding".
// The old service catalogue carried fees and was not shown on the old page; it stays out. The old page had no billing plan.

const ROLES: Person["role"][] = ["Admin", "Manager", "Project lead"];

/** Label and value rows that switch to inputs while editing. Saves on Done and logs each change. */
function EditableKV({ rows, editing, onChange }: { rows: Array<{ k: string; v: string; mono?: boolean }>; editing: boolean; onChange: (i: number, v: string) => void }) {
  if (!editing) return <KeyValue cols={1} wrap rows={rows} />;
  return (
    <div className="grid gap-3">
      {rows.map((r, i) => (
        <Field key={r.k} label={r.k}>
          <Input value={r.v} className={cn(r.mono && "font-mono text-13")} onChange={(e) => onChange(i, e.target.value)} />
        </Field>
      ))}
    </div>
  );
}

/** R-40: a risky change asks first, in place. */
function ConfirmRow({ text, label, onConfirm, onCancel }: { text: string; label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 border-b border-line-soft bg-warn-soft px-4 py-2.5 text-13.5 md:px-5">
      <span className="min-w-0 flex-1 font-semibold text-warn">{text}</span>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button size="sm" variant="primary" onClick={onConfirm}>
        {label}
      </Button>
    </div>
  );
}

function clock() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

export function SettingsScreen() {
  const [log, setLog] = React.useState<ActivityRow[]>([
    { id: "l2", date: d0(2), time: "16:20", text: "Reminder rule: second reminder on", who: "Mithilesh" },
    { id: "l1", date: d0(5), time: "11:05", text: "Integration: WhatsApp Business connected", who: "Farhath" },
  ]);
  const note = (text: string) => setLog((l) => [{ id: `l${Date.now()}`, date: TODAY, time: clock(), text, who: "Mithilesh" }, ...l]);

  // Firm profile: saves as it changes.
  const [profile, setProfile] = React.useState(FIRM_PROFILE);
  const [editing, setEditing] = React.useState(false);
  const before = React.useRef(FIRM_PROFILE);

  // People and roles.
  const [people, setPeople] = React.useState<Person[]>(PEOPLE);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: "", email: "", role: "Project lead" as Person["role"], reportsTo: "Pranay" });

  // Service targets and branding: edit in place.
  const [targets, setTargets] = React.useState(SERVICE_TARGETS);
  const [editTargets, setEditTargets] = React.useState(false);
  const [brand, setBrand] = React.useState([
    { k: "Firm name", v: "SBC" },
    { k: "Portal address", v: "app.sbctrack.in", mono: true },
    { k: "Client emails sent from", v: "updates@sbcllp.in", mono: true },
  ]);
  const [editBrand, setEditBrand] = React.useState(false);

  // Working calendar.
  const [week, setWeek] = React.useState("Mon to Sat");
  const [holidays, setHolidays] = React.useState<Holiday[]>(HOLIDAYS);

  // Reminder rules.
  const [rules, setRules] = React.useState(REMINDER_RULES);

  // Roles: risky, ask first.
  const [perms, setPerms] = React.useState<RolePerm[]>(ROLE_PERMS);
  const [askPerm, setAskPerm] = React.useState<{ role: string; perm: Perm } | null>(null);

  // Integrations: disconnect is risky.
  const [ints, setInts] = React.useState<Integration[]>(INTEGRATIONS);
  const [askInt, setAskInt] = React.useState<string | null>(null);

  const peopleCols: Column<Person>[] = [
    {
      key: "name",
      label: "Name",
      render: (p) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={p.name} size={24} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{p.name}</span>
            <span className="block truncate font-mono text-12 text-muted">{p.email}</span>
          </span>
        </span>
      ),
    },
    { key: "role", label: "Role", width: 124, render: (p) => <Chip fixed tone={ROLE_TONE[p.role]}>{p.role}</Chip> },
    { key: "reportsTo", label: "Reports to", className: "whitespace-nowrap", render: (p) => p.reportsTo || <span className="text-faint">–</span> },
  ];
  const bosses = people.filter((p) => (draft.role === "Admin" ? p.role === "Super admin" : draft.role === "Manager" ? p.role === "Admin" : p.role === "Manager")).map((p) => p.name);

  const holidayCols: Column<Holiday>[] = [
    { key: "date", label: "Date", width: 80, className: "whitespace-nowrap", render: (h) => fmt(h.date) },
    { key: "name", label: "Holiday", render: (h) => <span className="font-semibold">{h.name}</span> },
    { key: "kind", label: "Kind" },
    {
      key: "closed",
      label: "Office closed",
      width: 120,
      align: "center",
      render: (h) => (
        <Switch
          on={h.closed}
          label={`${h.name}: office closed`}
          onChange={(v) => {
            setHolidays((all) => all.map((x) => (x.id === h.id ? { ...x, closed: v } : x)));
            note(`Holiday ${h.name}: office ${v ? "closed" : "open"}`);
          }}
        />
      ),
    },
  ];

  const permCell = (r: RolePerm, perm: Perm) => {
    const on = r[perm];
    const locked = r.role === "Super admin";
    return (
      <button
        type="button"
        disabled={locked}
        onClick={() => setAskPerm({ role: r.role, perm })}
        aria-label={`${r.role} can ${perm}: ${on ? "yes" : "no"}`}
        className={cn("mx-auto grid h-7 w-7 place-items-center rounded-sm", !locked && "hover:bg-raised", on ? "text-ok" : "text-faint")}
      >
        {on ? <Check size={16} strokeWidth={2} /> : <Minus size={16} strokeWidth={1.5} />}
      </button>
    );
  };

  const permCols: Column<RolePerm>[] = [
    { key: "role", label: "Role", render: (r) => <span className="font-semibold">{r.role}</span> },
    { key: "view", label: "Can view", align: "center", width: 96, render: (r) => permCell(r, "view") },
    { key: "edit", label: "Can edit", align: "center", width: 96, render: (r) => permCell(r, "edit") },
    { key: "approve", label: "Can approve", align: "center", width: 110, render: (r) => permCell(r, "approve") },
  ];

  const pending = askPerm ? perms.find((p) => p.role === askPerm.role) : undefined;
  const pendingInt = askInt ? ints.find((i) => i.id === askInt) : undefined;

  return (
    <Cols>
      <Col>
        <DataGrid
          title="People and roles"
          meta={String(people.length)}
          columns={peopleCols}
          rows={people}
          rowKey={(p) => p.id}
          pageSize={20}
          filters={
            <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
              <UserPlus size={14} strokeWidth={1.5} /> Add person
            </Button>
          }
        />
        <SectionCard
          title="Firm profile"
          icon={{ Icon: Building2, tone: "blue" }}
          right={
            editing ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditing(false);
                  profile.forEach((p, i) => p.v !== before.current[i].v && note(`Firm profile: ${p.k.toLowerCase()} changed`));
                  before.current = profile;
                }}
              >
                Done
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )
          }
        >
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.map((p, i) => (
                <Field key={p.k} label={p.k}>
                  <Input value={p.v} className={cn(p.mono && "font-mono text-13")} onChange={(e) => setProfile((all) => all.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
                </Field>
              ))}
            </div>
          ) : (
            <KeyValue rows={profile} />
          )}
        </SectionCard>

        <SectionCard
          title="Working calendar"
          flush
          right={
            <Select
              aria-label="Working week"
              value={week}
              onChange={(e) => {
                setWeek(e.target.value);
                note(`Working week: ${e.target.value}`);
              }}
              options={[
                { value: "Mon to Fri", label: "Mon to Fri" },
                { value: "Mon to Sat", label: "Mon to Sat" },
                { value: "Mon to Sat, 2nd and 4th Sat off", label: "2nd and 4th Sat off" },
              ]}
            />
          }
        >
          <DataGrid inset columns={holidayCols} rows={holidays} rowKey={(h) => h.id} />
        </SectionCard>

        <SectionCard title="Roles and permissions" flush icon={{ Icon: KeyRound, tone: "violet" }}>
          {askPerm && pending && (
            <ConfirmRow
              text={`${pending[askPerm.perm] ? "Remove" : "Give"} "can ${askPerm.perm}" ${pending[askPerm.perm] ? "from" : "to"} ${askPerm.role}?`}
              label={pending[askPerm.perm] ? "Remove" : "Give"}
              onCancel={() => setAskPerm(null)}
              onConfirm={() => {
                const v = !pending[askPerm.perm];
                setPerms((all) => all.map((p) => (p.role === askPerm.role ? { ...p, [askPerm.perm]: v } : p)));
                note(`Role ${askPerm.role}: can ${askPerm.perm} ${v ? "on" : "off"}`);
                setAskPerm(null);
              }}
            />
          )}
          <DataGrid inset columns={permCols} rows={perms} rowKey={(r) => r.role} />
        </SectionCard>
      </Col>

      <Col>
        <SectionCard
          title="Service targets"
          icon={{ Icon: Target, tone: "teal" }}
          right={
            <Button
              size="sm"
              variant={editTargets ? "primary" : "outline"}
              onClick={() => {
                if (editTargets) targets.forEach((t, i) => t.v !== SERVICE_TARGETS[i].v && note(`Service target: ${t.k.toLowerCase()} set to ${t.v}`));
                setEditTargets(!editTargets);
              }}
            >
              {editTargets ? "Done" : "Edit"}
            </Button>
          }
        >
          <EditableKV rows={targets} editing={editTargets} onChange={(i, v) => setTargets((all) => all.map((x, j) => (j === i ? { ...x, v } : x)))} />
        </SectionCard>

        <SectionCard
          title="Branding"
          icon={{ Icon: Palette, tone: "violet" }}
          right={
            <Button
              size="sm"
              variant={editBrand ? "primary" : "outline"}
              onClick={() => {
                if (editBrand) note("Branding updated");
                setEditBrand(!editBrand);
              }}
            >
              {editBrand ? "Done" : "Edit"}
            </Button>
          }
        >
          <EditableKV rows={brand} editing={editBrand} onChange={(i, v) => setBrand((all) => all.map((x, j) => (j === i ? { ...x, v } : x)))} />
          <div className="mt-3">
            <div className="text-12 text-muted">Brand colours</div>
            <div className="mt-1.5 flex items-center gap-2">
              {BRAND_COLOURS.map((b) => (
                <span key={b.name} title={b.name} aria-label={b.name} className={cn("h-6 w-6 rounded-sm border border-line", b.cls)} />
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Reminder rules" flush icon={{ Icon: BellRing, tone: "amber" }}>
          {rules.map((r) => (
            <ListRow key={r.id}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.label}</span>
                <span className="block truncate text-12.5 text-muted">{r.sub}</span>
              </span>
              <Switch
                on={r.on}
                label={r.label}
                onChange={(v) => {
                  setRules((all) => all.map((x) => (x.id === r.id ? { ...x, on: v } : x)));
                  note(`Reminder rule: ${r.label.toLowerCase()} ${v ? "on" : "off"}`);
                }}
              />
            </ListRow>
          ))}
        </SectionCard>

        <SectionCard title="Integrations" flush icon={{ Icon: Plug, tone: "blue" }}>
          {pendingInt && (
            <ConfirmRow
              text={`Disconnect ${pendingInt.name}? Sync stops for every client.`}
              label="Disconnect"
              onCancel={() => setAskInt(null)}
              onConfirm={() => {
                setInts((all) => all.map((i) => (i.id === pendingInt.id ? { ...i, status: "Not connected", sub: `Disconnected ${fmt(TODAY)}` } : i)));
                note(`Integration: ${pendingInt.name} disconnected`);
                setAskInt(null);
              }}
            />
          )}
          {ints.map((i) => (
            <ListRow key={i.id}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{i.name}</span>
                <span className="block truncate text-12.5 text-muted">{i.sub}</span>
              </span>
              <Chip tone={INTEGRATION_TONE[i.status]}>{i.status}</Chip>
              {i.status === "Connected" ? (
                <Button size="sm" variant="ghost" onClick={() => setAskInt(i.id)}>
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInts((all) => all.map((x) => (x.id === i.id ? { ...x, status: "Connected", sub: `Connected ${fmt(TODAY)}` } : x)));
                    note(`Integration: ${i.name} connected`);
                  }}
                >
                  {i.status === "Needs sign-in" ? "Sign in" : "Connect"}
                </Button>
              )}
            </ListRow>
          ))}
        </SectionCard>

        <SectionCard title="Settings history" flush>
          <ActivityList rows={log} />
        </SectionCard>
      </Col>
      <Modal
        open={adding}
        onOpenChange={setAdding}
        title="Add person"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!draft.name.trim() || !draft.email.trim()}
              onClick={() => {
                setPeople((all) => [...all, { id: `p${Date.now()}`, name: draft.name.trim(), email: draft.email.trim(), role: draft.role, reportsTo: draft.reportsTo }]);
                note(`Invite sent: ${draft.name.trim()} as ${draft.role.toLowerCase()}`);
                setDraft({ name: "", email: "", role: "Project lead", reportsTo: "Pranay" });
                setAdding(false);
              }}
            >
              Send invite
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Work email">
            <Input type="email" className="font-mono text-13" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@sbcllp.in" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Select
                aria-label="Role"
                size="md"
                value={draft.role}
                onChange={(e) => {
                  const role = e.target.value as Person["role"];
                  setDraft({ ...draft, role, reportsTo: role === "Admin" ? "Mithilesh" : role === "Manager" ? "Krishna" : "Pranay" });
                }}
                options={ROLES.map((r) => ({ value: r, label: r }))}
                className="w-full [&>select]:w-full"
              />
            </Field>
            <Field label="Reports to">
              <Select aria-label="Reports to" size="md" value={draft.reportsTo} onChange={(e) => setDraft({ ...draft, reportsTo: e.target.value })} options={bosses.map((b) => ({ value: b, label: b }))} className="w-full [&>select]:w-full" />
            </Field>
          </div>
        </div>
      </Modal>
    </Cols>
  );
}

function d0(daysAgo: number) {
  return new Date(TODAY.getTime() - daysAgo * 86400000);
}
