"use client";
import * as React from "react";
import { Modal } from "@/components/ui/Modal";

const OPEN_EVENT = "vcfo:shortcuts";

/** Open the shortcut sheet from a menu row. */
export function openShortcuts() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const GROUPS: Array<[string, Array<[string[], string]>]> = [
  [
    "Everywhere",
    [
      [["Ctrl", "K"], "Search clients, filings and documents"],
      [["/"], "Ask VCFO (on list pages: search the list)"],
      [["?"], "This list of shortcuts"],
      [["Esc"], "Close a menu, dialog or panel"],
    ],
  ],
  [
    "Tables",
    [
      [["Tab"], "Move to the next row or control"],
      [["Enter"], "Open the focused row"],
      [["R"], "Remind (focused task row)"],
      [["A"], "Assign (focused task row)"],
      [["Space"], "Tick a row's checkbox, where rows can be selected"],
    ],
  ],
  [
    "Row menus",
    [
      [["E"], "Edit"],
      [["A"], "Reassign"],
      [["C"], "Copy link"],
    ],
  ],
  [
    "Calendar",
    [
      [["↑", "↓"], "Move a block's start or end by 15 minutes (focus its edge first)"],
    ],
  ],
];

/** E-10: "?" opens a sheet with every keyboard shortcut. Not while typing. */
export function ShortcutSheet() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "?" || e.ctrlKey || e.metaKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <Modal open={open} onOpenChange={setOpen} title="Keyboard shortcuts" size="md">
      <div className="grid gap-5">
        {GROUPS.map(([group, rows]) => (
          <section key={group}>
            <h3 className="mb-1.5 text-11.5 font-medium uppercase tracking-[.07em] text-muted">{group}</h3>
            <ul className="grid">
              {rows.map(([keys, what]) => (
                <li key={what} className="flex items-center gap-3 border-t border-line-soft py-2 text-14 first:border-t-0">
                  <span className="min-w-0 flex-1 text-ink-2">{what}</span>
                  <span className="flex flex-none gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="grid h-6 min-w-6 place-items-center rounded-sm border border-line bg-raised px-1.5 font-sans text-12 font-medium text-ink">
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
