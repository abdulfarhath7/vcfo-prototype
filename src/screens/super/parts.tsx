import Link from "next/link";
import { cn } from "@/lib/cn";
import { barFill } from "@/components/ui/Bar";
import type { Client } from "@/data/people";

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
