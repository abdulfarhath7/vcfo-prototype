"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { AskButton } from "./AskButton";
import { PrototypeBar } from "./PrototypeBar";
import type { Portal } from "@/data/nav";

/** R-39: the sidebar stays fixed when the page scrolls. On phones it is a drawer. */
export function Shell({ portal, incorporated = false, children }: { portal: Portal; incorporated?: boolean; children: React.ReactNode }) {
  const [drawer, setDrawer] = React.useState(false);
  const path = usePathname();
  React.useEffect(() => setDrawer(false), [path]);
  React.useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const updatesBase = portal === "client" ? "/client" : `/${portal}/updates`;

  return (
    <div className="flex min-h-screen pt-[3px]">
      {/* R-46: the regulator spectrum ribbon, 3 px, across the very top. The only decorative line. */}
      <div className="spectrum fixed inset-x-0 top-0 z-[90] h-[3px]" aria-hidden />
      <div className="sticky top-[3px] hidden h-[calc(100vh-3px)] flex-none md:block">
        <Sidebar portal={portal} incorporated={incorporated} />
      </div>
      {drawer && (
        <div className="fixed inset-x-0 bottom-0 top-[3px] z-[80] flex md:hidden" role="dialog" aria-modal="true">
          <div className="h-full">
            <Sidebar portal={portal} incorporated={incorporated} onClose={() => setDrawer(false)} />
          </div>
          <button type="button" className="flex-1 bg-scrim" aria-label="Close menu" onClick={() => setDrawer(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar portal={portal} incorporated={incorporated} onMenu={() => setDrawer(true)} updatesBase={updatesBase} />
        <main className="mx-auto w-full max-w-page flex-1 px-4 pb-20 pt-5 md:px-8 md:pt-7">{children}</main>
      </div>
      <AskButton portal={portal} />
      <PrototypeBar portal={portal} incorporated={incorporated} />
    </div>
  );
}
