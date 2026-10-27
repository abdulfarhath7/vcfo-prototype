# Build brief for screen agents

Read this file, then `CONTEXT.md`, `docs/RULES.md` and `docs/SCREENS.md`. Build only the screens in your task. Do not touch other agents' folders.

## What exists

- Dev server runs at `http://localhost:3100`. Do not start another one. Hot reload is on.
- Shell: `src/components/shell/` (`Shell`, `Sidebar`, `TopBar`, `AskButton`, `Page` with `Cols`, `Col`, `Row`, `Stack`). The client layout is `app/(client)/layout.tsx`. The client "before/after" state is `useClientState()` from `src/components/shell/ClientState.tsx`.
- Nav: `src/data/nav.ts` holds every sidebar item and href. Use those hrefs for your routes. Do not change the nav without a reason; if you must, say so in your report.
- Cards (`src/components/cards/`): `SectionCard` (+ `Empty`, `ListRow`, `HeadLink`), `GreetingCard` (+ `NumberStrip`), `AttentionList` (+ `DateTile`), `GanttTimeline` (+ `StatusCircle`), `PhaseRows`, `ProgressList`, `DocList`, `ActivityList`, `WeekList`, `Thread`, `DataGrid`, `StackedBar`, `Donut`, `KeyValue`.
- UI (`src/components/ui/`): `Button` (variants primary/outline/ghost/link/onNavy/onNavyPrimary/soft; sizes md/sm/icon/iconSm), `Chip` + `OwnerChip` + `Tag` + `toneFor`, `Tabs` + `useTabs`, `FileBadge` + `fileType`, `Chevron`, `IconTile`, `Avatar`, `Bar`, `Select` + `SelectOnNavy`, `Input` + `Field` + `Switch` + `Checkbox`.
- Icons: `src/components/icons.ts` (`iconFor(title)` maps a card title to a Lucide icon and tone). Use `lucide-react` with `strokeWidth={1.5}`.
- Dates: `src/lib/dates.ts` (`TODAY` = 6 Oct 2026, `d(y,m,day)`, `fmt`, `fmtLong`, `relative`, `urgency`, `tile`).
- Data: `src/data/people.ts` (SBC staff, client people, `CLIENTS`), `src/data/incorporation.ts` (25 steps, phases, timeline), `src/data/client-home.ts`.
- Example screen: `src/screens/client/HomeScreen.tsx` and its route `app/(client)/client/home/page.tsx`.

## Rules you must keep

1. Do not edit files in `src/components/`, `src/lib/`, `src/styles/`, `tailwind.config.ts` or `src/data/nav.ts`. If a shared component lacks a prop you need, build the screen with what exists and list the gap in your report. Do not fork a card into your own folder.
2. New card types are allowed only when no existing card fits. Put them in `src/components/cards/` with a unique, descriptive file name and say so in your report.
3. No hex colours in screens. Use Tailwind classes from the token names (`bg-surface`, `text-muted`, `border-line`, `bg-navy`, `text-accent`, `bg-ok-soft`, ...).
4. Every data table is a `DataGrid` (R-07). Filters go in the grid head bar as `filters` (R-08), as compact `Select` or `Tabs`.
5. No filler text, no back links, no page titles that repeat the sidebar, no info icons, no mascot, no money on dashboards, no "please", no "successfully". Sentence case. Dates as "14 Oct".
6. Lists inside a card run full width with hairlines: use `SectionCard flush` and `ListRow`.
7. One main (navy) button per card.
8. Record pages switch tabs in place with `Tabs`; do not open another page for a tab (R-36).
9. Sample data lives in `src/data/<portal>-<topic>.ts` (typed). Port names, dates and counts from the old screen files in `reference/old-screens/s/<area>/` and the scripts in `reference/old-patch/`. Strip SVG and style with: `python3 -I /tmp/claude-1000/-home-farhath-Documents-vcfo-prototype/67740829-0e16-4552-980a-a18de2c523a3/scratchpad/strip.py <file> | grep -v '^\s*$'`.
10. Routes: `app/(<portal>)/<portal>/.../page.tsx`, each a one-liner that renders a screen from `src/screens/<portal>/`. Staff portals (lead, manager, admin) share screens: put them in `src/screens/staff/` and pass `portal` as a prop. The staff layouts are `app/(lead)/layout.tsx`, `app/(manager)/layout.tsx`, `app/(admin)/layout.tsx` with `<Shell portal="lead">` and so on.
11. Overlays (`*-search`, `*-chat`) already exist in the shell. Do not build them.
12. Phone width 390 px must not scroll sideways: wrap wide things in `overflow-x-auto`, use `truncate` with `min-w-0`, use `grid-cols-1` on phone.
13. Run `npx tsc --noEmit` and `npx eslint <your files>` before you report. Then `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3100/<route>` for each route: all must be 200.
14. Do not edit `docs/CHANGES.md`; the lead agent does. Do not commit.

## Report format

List: routes built (one per line), data files added, new cards added (if any), gaps in shared components, anything you could not port.
