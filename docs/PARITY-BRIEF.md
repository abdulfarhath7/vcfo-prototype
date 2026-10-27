# Parity brief for porting agents

The owner reviewed the new prototype on 27 Oct 2026 and said: "you have missed a lot of things from the actual prototype". Your task is parity: every card, control, state and interaction of the old prototype must exist in the new one, in the new design language, unless a rule in `docs/RULES.md` or a row in `docs/CHANGES.md` removes it.

Read `docs/BUILD-BRIEF.md` first (it still applies: components, data, routes, rules, checks). Then this file.

## Method, screen by screen

1. Take the old screen file(s) from `docs/SCREENS.md` for your scope. Strip them: `python3 -I /tmp/claude-1000/-home-farhath-Documents-vcfo-prototype/67740829-0e16-4552-980a-a18de2c523a3/scratchpad/strip.py <file> | grep -v '^\s*$'`. Old screens import fragments with `<dc-import name="...">`; the fragment file is `<same folder>/<name>.dc.html`. Follow every import. Read the `<script>` of the old file for data and behaviour (the strip script removes scripts; use `sed -n` or `grep` on the raw file for those).
2. Write down every element the old screen has: cards, tabs, filters, buttons, lists, popovers, drawers, dialogs, empty states, loading states, phone layout, keyboard shortcuts, state changes on click.
3. Open the new screen file and compare.
4. Port everything missing. Reuse the shared cards. Keep the e-Filing look. Keep sample names and numbers from the old data.
5. Keep out only what a rule removes, and name the rule. The removals are: bot mascot (R-04), filler sentences (R-05), info icons next to buttons and titles (R-06), back links and repeated page titles (R-09), long chip filter rows (R-10), notification bars such as "Your next action" (R-38), money on dashboards (R-37), the client Team page as its own page (R-42), the Obligations number strip (C-0018), the "Filed recently" rail card (C-0020), the "Nudge" word (K-17: write "Remind" or "Send reminder"), and on the developer portal the uptime bar blocks (C-0037). Everything else comes back.
6. Interactions must work in the browser: a button that opened a dialog in the old prototype opens one now. Use Radix Dialog or Popover from `@radix-ui/*` (already installed) or a fixed panel like `src/components/cards/TaskDrawer.tsx`. Never `window.alert` or `window.confirm`.
7. Phone layouts: the old prototype had phone variants (`mobile.html`, `*_mobile*.dc.html`, `TodayPhone`, `WorkPhone`). The new screens must match their content at 390 px with Tailwind breakpoints, not with separate routes.

## Rules for shared files

- You may ADD new files in `src/components/cards/` and `src/components/ui/` with unique, descriptive names. You may NOT edit existing files there, or anything in `src/lib/`, `src/styles/`, `tailwind.config.ts`, `src/data/nav.ts`. If an existing shared component blocks you, work around it and list the gap in your report; the lead applies it.
- Do not edit screens outside your scope. Data files: edit only your portal's data files; add new ones freely.
- Do not start a dev server. One runs on :3100. If a curl gets no answer, wait 30 s and retry.
- Finish with `npx tsc --noEmit` (whole project), `npx eslint` on your files, and a curl of every route in your scope for 200.

## Report format

A table with one row per old element: `Old screen | Element | Status (Ported / Already there / Kept out: rule) | New file`. Then: new shared files added, gaps in shared components, data files touched.
