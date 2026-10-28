import Link from "next/link";
import { PORTALS } from "@/data/nav";
import { Avatar } from "@/components/ui/Avatar";

/** The portal chooser: every portal home in one list. Moved here from app/page.tsx when "/" became the landing page. */
export function PortalsScreen() {
  return (
    <main className="mx-auto grid min-h-screen max-w-[720px] content-center gap-6 px-4 py-10">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-13 font-bold text-white">V</span>
        <h1 className="text-22 font-semibold">VCFO Suite</h1>
        <span className="ml-auto font-mono text-12 text-muted">prototype · round 5</span>
      </div>
      <div className="overflow-hidden rounded-md border-1.5 border-line bg-surface">
        {Object.values(PORTALS).map((p, i) => (
          <Link key={p.key} href={p.home} className={`flex h-14 min-w-0 items-center gap-3 px-4 hover:bg-raised ${i ? "border-t border-line-soft" : ""}`}>
            <Avatar name={p.person} size={30} />
            <span className="truncate text-14 font-semibold">{p.title}</span>
            <span className="truncate text-13 text-muted">{p.person}</span>
            <span className="ml-auto hidden font-mono text-12 text-faint sm:inline">{p.home}</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-13 text-muted">
        <Link href="/client/home?state=after" className="font-semibold text-accent">
          Client · after incorporation
        </Link>
        <Link href="/" className="font-semibold text-accent">
          Landing page
        </Link>
        <Link href="/sign-in" className="font-semibold text-accent">
          Sign in
        </Link>
      </div>
    </main>
  );
}
