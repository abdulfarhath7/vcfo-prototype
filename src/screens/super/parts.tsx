import Link from "next/link";
import { cn } from "@/lib/cn";
import { barFill } from "@/components/ui/Bar";
import type { Client } from "@/data/people";

const TILE: Record<Client["tone"], string> = {
  accent: "bg-accent-soft text-accent",
  violet: "bg-violet-soft text-violet",
  teal: "bg-teal-soft text-teal",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-ok",
  idle: "bg-raised text-ink-2",
};

const ini = (name: string) => {
  const w = name.replace(/ (Pvt Ltd|LLP)$/, "").split(" ");
  return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase();
};

/** 26 px initials tile in the client's identity colour (old .ct). No client shows "?". */
export function ClientTile({ client, className }: { client?: Pick<Client, "name" | "tone">; className?: string }) {
  return (
    <span className={cn("inline-grid h-[26px] w-[26px] flex-none place-items-center rounded-md text-[10.5px] font-semibold", client ? TILE[client.tone] : "bg-raised text-muted", className)} aria-hidden>
      {client ? ini(client.name) : "?"}
    </span>
  );
}

/** Client name with its identity colour dot (R-35). */
export function ClientName({ client, href, sub, className }: { client: Pick<Client, "name" | "tone">; href?: string; sub?: string; className?: string }) {
  const body = (
    <>
      <i className={cn("h-2 w-2 flex-none rounded-full", barFill[client.tone])} aria-hidden />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{client.name}</span>
        {sub && <span className="block truncate text-12 text-muted">{sub}</span>}
      </span>
    </>
  );
  const cls = cn("flex min-w-0 items-center gap-2", className);
  return href ? (
    <Link href={href} className={cn(cls, "hover:underline")}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  );
}

/** Option lists for compact Select filters. */
export const opts = (all: string, values: string[]) => [{ value: "", label: all }, ...values.map((v) => ({ value: v, label: v }))];

export const clientHref = (id: string) => `/super/clients/${id}`;
