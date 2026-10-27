import Link from "next/link";
import { PORTALS } from "@/data/nav";
import { Avatar } from "@/components/ui/Avatar";

export default function Chooser() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[720px] content-center gap-6 px-4 py-10">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-13 font-bold text-white">V</span>
        <h1 className="text-22 font-semibold">VCFO Suite</h1>
        <span className="ml-auto font-mono text-12 text-muted">prototype · round 5</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {Object.values(PORTALS).map((p, i) => (
          <Link key={p.key} href={p.home} className={`flex h-14 items-center gap-3 px-4 hover:bg-raised ${i ? "border-t border-line-soft" : ""}`}>
            <Avatar name={p.person} size={30} />
            <span className="text-14 font-semibold">{p.title}</span>
            <span className="text-13 text-muted">{p.person}</span>
            <span className="ml-auto font-mono text-12 text-faint">{p.home}</span>
          </Link>
        ))}
      </div>
      <div className="flex gap-4 text-13 text-muted">
        <Link href="/client/home?state=after" className="text-accent font-semibold">
          Client · after incorporation
        </Link>
      </div>
    </main>
  );
}
