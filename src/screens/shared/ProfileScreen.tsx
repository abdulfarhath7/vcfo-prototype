"use client";
import * as React from "react";
import { Camera } from "lucide-react";
import { PORTALS, type Portal } from "@/data/nav";
import { SBC, CLIENT_PEOPLE, NORTHWIND, type Person } from "@/data/people";
import { PROFILE_EXTRA, COMPANY_FACTS, MEMBERS } from "@/data/updates-team";
import { useClientState } from "@/components/shell/ClientState";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip, Tag } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { useUndoToast } from "@/components/ui/UndoToast";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { EditableFacts, type FactRow } from "@/components/cards/EditableFacts";
import { Cols, Col } from "@/components/shell/Page";
import { TeamSection } from "./profile-team";
import { SettingsSection } from "./profile-settings";

function AboutCard({ portal, me }: { portal: Portal; me: Person }) {
  const x = PROFILE_EXTRA[portal];
  const staff = portal !== "client";
  const initial: FactRow[] = [
    { k: "Full name", v: me.name },
    { k: "Designation", v: x.designation },
    ...(staff && x.membership ? [{ k: "Membership number", v: x.membership, mono: true }] : []),
    { k: "Mobile", v: x.mobile, mono: true },
  ];
  const [rows, setRows] = React.useState(initial);
  const toast = useUndoToast();
  return (
    <>
      <EditableFacts
        title="Profile"
        rows={rows}
        editable
        onSave={(next) => {
          const before = rows;
          setRows(next);
          toast.show("Profile saved", () => setRows(before));
        }}
      />
      {toast.node}
    </>
  );
}

/** Client only: company facts from the questionnaire and who can sign in. */
function CompanyCard() {
  const { incorporated } = useClientState();
  const toast = useUndoToast();
  const people = MEMBERS.filter((m) => m.kind !== "invited");
  return (
    <SectionCard
      title="Company"
      flush
      right={
        <Button size="sm" onClick={() => toast.show("Request sent to Bharath and Pranay")}>
          Ask for a change
        </Button>
      }
    >
      <div className="px-4 py-4 md:px-5">
        <KeyValue
          cols={1}
          wrap
          rows={[
            { k: "Name", v: NORTHWIND.name },
            { k: "PAN", v: NORTHWIND.pan, mono: true },
            { k: "Stage", v: incorporated ? <Chip tone="ok">Incorporated 28 Oct</Chip> : <Chip tone="prog">Incorporating</Chip> },
            { k: "Employees", v: COMPANY_FACTS.employees },
            { k: "State", v: COMPANY_FACTS.state },
            { k: "Exports", v: COMPANY_FACTS.exports },
            { k: "Manager", v: NORTHWIND.manager },
            { k: "Project lead", v: NORTHWIND.lead },
          ]}
        />
      </div>
      <p className="border-t border-line-soft bg-raised px-4 py-1.5 text-11.5 font-semibold text-faint md:px-5">People who can sign in</p>
      {people.map((m) => (
        <ListRow key={m.id} href="/client/profile?tab=team" className="py-2.5">
          <Avatar name={m.ini} size={24} />
          <span className="min-w-0 flex-1 truncate font-semibold">{m.name}</span>
          <span className="text-12.5 text-muted">{m.role}</span>
        </ListRow>
      ))}
      {toast.node}
    </SectionCard>
  );
}

export function ProfileScreen({ portal }: { portal: Portal }) {
  const meta = PORTALS[portal];
  const [tab, setTab] = React.useState("profile");
  const toast = useUndoToast();
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "profile" || t === "settings" || (t === "team" && portal === "client")) setTab(t);
  }, [portal]);
  const pick = (k: string) => {
    setTab(k);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("tab", k);
      window.history.replaceState(null, "", u.toString());
    } catch {}
  };
  const me: Person = portal === "client" ? CLIENT_PEOPLE[0] : (SBC.find((p) => p.name === meta.person) ?? SBC[0]);
  const items = [{ key: "profile", label: "Profile" }, ...(portal === "client" ? [{ key: "team", label: "Team" }] : []), { key: "settings", label: "Settings" }];

  return (
    <div className="grid grid-cols-1 gap-5">
      <SectionCard bare title="Profile head" bodyClassName="flex flex-wrap items-center gap-4">
        <span className="relative flex-none">
          <Avatar name={me.ini ?? me.name} size={44} />
          <button
            type="button"
            onClick={() => toast.show("Photo picker opens here")}
            className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-md border border-line bg-surface text-muted hover:bg-raised hover:text-ink"
            aria-label="Change photo"
            title="Change photo"
          >
            <Camera size={13} strokeWidth={1.5} />
          </button>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-16 font-semibold">{me.name}</span>
            {portal === "client" && <Tag tone="prog">Primary</Tag>}
          </span>
          <span className="block truncate text-13 text-muted">
            {PROFILE_EXTRA[portal].designation}
            {portal === "client" ? ` · ${NORTHWIND.short}` : " · SBC"}
            <span className="mx-1.5 text-faint">·</span>
            <span className="font-mono text-12.5">{me.email}</span>
          </span>
        </span>
        <Tabs items={items} value={tab} onChange={pick} size="md" />
      </SectionCard>

      {tab === "profile" && (
        <Cols>
          <Col>
            <AboutCard portal={portal} me={me} />
          </Col>
          <Col>
            {portal === "client" ? (
              <CompanyCard />
            ) : (
              <SectionCard title="Work">
                <KeyValue
                  cols={1}
                  rows={[
                    { k: "Office", v: "SBC · Hyderabad" },
                    { k: "Clients", v: portal === "lead" ? 8 : portal === "manager" ? 8 : portal === "dev" ? "All" : 14 },
                    { k: "Reports to", v: portal === "lead" ? "Pranay" : portal === "manager" ? "Krishna" : portal === "super" ? "Partners" : "Mithilesh" },
                    { k: "Since", v: PROFILE_EXTRA[portal].since },
                  ]}
                />
              </SectionCard>
            )}
          </Col>
        </Cols>
      )}
      {tab === "team" && portal === "client" && <TeamSection />}
      {tab === "settings" && <SettingsSection portal={portal} />}
      {toast.node}
    </div>
  );
}
