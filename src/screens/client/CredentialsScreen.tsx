"use client";
import * as React from "react";
import { Copy, Eye, EyeOff, ExternalLink, KeyRound } from "lucide-react";
import { fmt } from "@/lib/dates";
import { CREDENTIALS, type Credential } from "@/data/shared";
import { Button } from "@/components/ui/Button";
import { Chip, OwnerChip, type ChipTone } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { DataGrid } from "@/components/cards/DataGrid";
import { SectionCard, ListRow } from "@/components/cards/SectionCard";
import { KeyValue } from "@/components/cards/KeyValue";
import { Cols, Col } from "@/components/shell/Page";

const tone: Record<Credential["status"], ChipTone> = { Active: "ok", Expiring: "warn", "Needs reset": "bad" };

/** C-0003: no bot figure. Password reveal (ids-password) is an inline step, not a page. */
export function CredentialsScreen() {
  const [pick, setPick] = React.useState<Credential | null>(null);
  const [pw, setPw] = React.useState("");
  const [shown, setShown] = React.useState(false);
  const [ok, setOk] = React.useState(false);

  const reveal = (c: Credential) => {
    setPick(c);
    setPw("");
    setShown(false);
    setOk(false);
  };

  return (
    <Cols>
      <Col>
        <DataGrid
          title="Credentials"
          meta={`${CREDENTIALS.length} portals`}
          columns={[
            { key: "portal", label: "Portal", render: (c) => (
                <span>
                  <span className="font-semibold">{c.portal}</span>
                  <a href={`https://${c.host}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-12 text-muted hover:text-accent">
                    {c.host} <ExternalLink size={11} strokeWidth={1.5} />
                  </a>
                </span>
              ) },
            { key: "user", label: "User ID", mono: true },
            { key: "holder", label: "Holder", width: 120, render: (c) => <OwnerChip owner={c.holder} label={c.holder === "client" ? "Northwind" : undefined} /> },
            { key: "twoFa", label: "OTP", width: 130, className: "whitespace-nowrap" },
            { key: "lastUsed", label: "Last used", width: 100, render: (c) => fmt(c.lastUsed) },
            { key: "status", label: "Status", width: 132, render: (c) => <Chip tone={tone[c.status]} fixed>{c.status}</Chip> },
            { key: "act", label: "", width: 100, render: (c) => (
                <Button size="sm" onClick={() => reveal(c)}>
                  <KeyRound size={14} strokeWidth={1.5} /> Reveal
                </Button>
              ) },
          ]}
          rows={CREDENTIALS}
          rowKey={(c) => c.id}
        />
      </Col>
      <Col>
        {pick ? (
          <SectionCard title={pick.portal} meta={pick.host} icon={{ Icon: KeyRound, tone: "violet" }}>
            {!ok ? (
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pw.length >= 4) setOk(true);
                }}
              >
                <p className="text-13 text-ink-2">Enter your VCFO password to show this credential. The reveal is logged in Audit.</p>
                <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Your VCFO password" autoFocus />
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="sm" disabled={pw.length < 4}>
                    Show
                  </Button>
                  <Button type="button" size="sm" onClick={() => setPick(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-3">
                <KeyValue cols={1} rows={[{ k: "User ID", v: pick.user, mono: true }, { k: "OTP goes to", v: pick.twoFa }, { k: "Holder", v: <OwnerChip owner={pick.holder} label={pick.holder === "client" ? "Northwind" : undefined} /> }]} />
                <div>
                  <span className="text-12 text-muted">Password</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="flex h-9 flex-1 items-center rounded-md border border-line bg-raised px-3 font-mono text-13">{shown ? "Nw!2026#spice" : "••••••••••••"}</span>
                    <Button size="icon" variant="outline" aria-label={shown ? "Hide" : "Show"} onClick={() => setShown((s) => !s)}>
                      {shown ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                    </Button>
                    <Button size="icon" variant="outline" aria-label="Copy">
                      <Copy size={16} strokeWidth={1.5} />
                    </Button>
                  </span>
                </div>
                <p className="text-12 text-faint">Hidden again in 60 seconds.</p>
              </div>
            )}
          </SectionCard>
        ) : (
          <SectionCard title="Who holds what" flush>
            <ListRow>
              <OwnerChip owner="client" label="Northwind" />
              <span className="flex-1 text-13">{CREDENTIALS.filter((c) => c.holder === "client").length} portal, OTP to Rohan</span>
            </ListRow>
            <ListRow>
              <OwnerChip owner="sbc" />
              <span className="flex-1 text-13">{CREDENTIALS.filter((c) => c.holder === "sbc").length} portals, SBC files on your behalf</span>
            </ListRow>
          </SectionCard>
        )}
        <SectionCard title="Needs attention" flush>
          {CREDENTIALS.filter((c) => c.status !== "Active").map((c) => (
            <ListRow key={c.id}>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{c.portal}</span>
                <span className="block text-12.5 text-muted">{c.status === "Expiring" ? "Password expires in 9 days" : "Portal asked for a reset on last sign-in"}</span>
              </span>
              <Chip tone={tone[c.status]}>{c.status}</Chip>
            </ListRow>
          ))}
        </SectionCard>
      </Col>
    </Cols>
  );
}
