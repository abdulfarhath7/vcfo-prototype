# Status

Updated 27 Oct 2026.

## Branch

`master`. Nothing is committed yet. The owner commits.

## State

The app runs. Every portal has its screens. The source of truth for each change is `docs/CHANGES.md`.

Run: `npm install`, then `npm run dev -- --port 3100`. Do not pipe the dev server into `head`; the server stops when the pipe closes.

## Built in the first build session (27 Oct 2026)

| Part | Files |
|---|---|
| Shell | `src/components/shell/*` (sidebar fixed, top bar, search palette, Ask VCFO text button, theme) |
| Cards | `src/components/cards/*` (16 card types, one per kind, shared by every portal) |
| UI | `src/components/ui/*` |
| Client | `src/screens/client/*`, `src/screens/shared/*` |
| Staff (lead, manager, admin) | `src/screens/staff/*` |
| Super admin | `src/screens/super/*` |
| Developer | `src/screens/dev/*` |
| Data | `src/data/*` |

## Open items

1. All 40 round 5 rows are ✓ (light, dark and 390 px checked on 27 Oct 2026). Grid date cells wrap on phones; the e-Filing portal does the same, so this stays.
2. `src/data/incorporation.ts` `stepHref` and `phaseHref` point at Northwind only. Staff screens build their own links.
3. "Waiting on client" does not fit the 108 px table chip. Staff grids say "With client".
4. Done: `KeyValue` takes `wrap` for long values.
5. Done: `iconFor` knows due, thread, capacity, reassign, integration, reminder, pipeline and source.
6. Ported in the parity round: calendar Year and Timeline views, VCFO Assist filing card, drag-to-plan in Work, step explainer, and the Money tables as a Reports view. Dev uptime bar blocks stay out (C-0037).
7. `docs/CARRYOVER.md` rows with status "Port" still need a port session into the real tool.
8. `obHref` in `src/data/compliance.ts` builds `/<portal>/obligations/<id>` for staff; the nav uses `/<portal>/compliances/obligations/<id>`. Staff screens use `staffObHref` from `src/data/staff-compliance.ts`. Fix `obHref` and drop the copy.
9. The lead's compliance screens show Bharath's 3 compliance clients; Today and Clients show all 8 of Pranay's. Pick one scope.

## Parity round (27 Oct 2026)

The owner found the new prototype missing many parts of the old one, plus the landing page. Five agents ported them from `docs/PARITY-BRIEF.md`. Rows C-0041 to C-0051 in `CHANGES.md` record the work.

- Checks: `npx tsc --noEmit`, `npx eslint .` and `vitest` are clean.
- A headless Chromium sweep loads 127 pages in four modes (1440 and 390 px, light and dark). All 508 loads return 200, with no page error, no console error and no sideways scroll.
- A smoke test passes for search, sidebar folds, bell menus, Ask VCFO, the upload dialog, sign-in demo accounts and the dev connection detail.
- C-0043 to C-0046 stay ◐. Each portal has many more dialogs, drags and timers than the smoke test covers. Click through them before you set ✓.
- `src/screens/staff/StaffSettingsSection.tsx` is not mounted. The shared Settings tab already holds password, Outlook and alerts for staff. Delete the file or merge its photo controls into `profile-settings.tsx`.
- The Chrome extension was not connected. Checks ran in headless Chromium from `~/Documents/vcfo-suite/node_modules/playwright-core`.

Owner decisions open:
1. Registration and obligation pages: should SBC fields be editable on the client portal? Now only client fields are.
2. Landing page: confirm the new Developer portal copy in `src/screens/public/content.ts`.
3. Landing quick answers: the old panel had 12 questions; all 12 are back. Cut to 3 if wanted.
4. Dark mode lifts the main button to #2B4766 (C-0051). Confirm.
5. Developer Overview dropped "Deploys this week" and "Cost this month" from the number strip to fit six tiles. Both still show lower on the page.

## Next refactors

- Move `src/screens/client/step-detail.ts` into `src/data/client-incorporation.ts`.
- Give `DataGrid` a row-expand slot, so Leads and Connections stop using a panel below the grid.
- Merge the two assign dialogs: `AssignClientDialog` in `today-parts.tsx` and `AssignDialog` in `record-parts.tsx`.
- Widen `StaffPortal` to include super, then drop the super copies of StepScreen and BoardResolutionScreen.
