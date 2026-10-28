# Status

Updated 28 Oct 2026, late evening.

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
- `src/screens/staff/StaffSettingsSection.tsx` is mounted under Profile › Settings since the repair round (C-0064).
- The Chrome extension was not connected. Checks ran in headless Chromium from `~/Documents/vcfo-suite/node_modules/playwright-core`.

Owner decisions open:
1. Registration and obligation pages: should SBC fields be editable on the client portal? Now only client fields are.
2. Landing page: confirm the new Developer portal copy in `src/screens/public/content.ts`.
3. Landing quick answers: the old panel had 12 questions; all 12 are back. Cut to 3 if wanted.
4. Dark mode lifts the main button to #2B4766 (C-0051). Confirm.
5. Developer Overview dropped "Deploys this week" and "Cost this month" from the number strip to fit six tiles. Both still show lower on the page.

## Repair round (28 Oct 2026)

The owner said the parity round "ruined" the UI, the calendar first. `docs/PARITY-AUDIT.md` lists about 60 ✗ parts. Seven agents restored them from `docs/RESTORE-BRIEF.md`. Rows C-0052 to C-0071 in `CHANGES.md` record the work.

- Checks: `npx tsc --noEmit`, `npx eslint src app` and `vitest` are clean. All 90 audited routes return 200.
- Each agent took its routes at 1440 light, 1440 dark and 390 light, and ran a Playwright click script. The scripts are in the session scratchpad.
- Staff and super admin data sit on Fri 16 Oct 2026 (`STAFF_TODAY`). The client portal stays on 6 Oct; the client calendar uses 8 Oct, as in the old one.
- `PhaseRowsWithHelp` was folded into `PhaseRows` (`onAbout`).

Open after the repair round:
1. Staff Filings and Obligations keep the old statuses, so 10 and 15 Oct still show "Due soon" against 16 Oct.
2. Staff Work: calendar blocks do not drag or resize as in the old calendar.
3. Admin Work shows Status as a stacked bar (R-25), not the old donut. Owner to confirm.
4. Step page approval bar sits in the page flow, not fixed to the window bottom, so the prototype bar does not hide it.
5. Bharath has two task lists: his own Today and Work use the old lead lists; team views follow `people.ts`.
6. The old staff top bar had a "PREVIEW · All incorporating / Mixed / All compliance" switch. It is not built.
7. Board resolution signer is Rohan Kumar; the old screen showed J. Carter.

## Repair round 2 (28 Oct 2026)

An independent review compared all 93 old and new screens. Five agents finished the open items from `docs/HANDOFF.md`. Rows C-0072 to C-0084 in `CHANGES.md` record the work.

- Checks: `npx tsc --noEmit`, `npx eslint src app` and `vitest` are clean.
- `sweep.cjs` loads all 90 routes at 390 light and 1440 dark. No page error, no sideways scroll.
- Each agent took its routes at 1440 light, 1440 dark and 390 light, and clicked its tabs and dialogs.
- `AttentionRow` takes `alert`: a red alert tile in place of the date tile.
- The manager sidebar marks the picked project lead. It has no "Your admin" row.

Owner decisions after round 2: decided on 28 Oct 2026. See D-12 to D-16 in `docs/DECISIONS.md`.

## Gaps and click-through round (28 Oct 2026, evening)

Rows C-0085 to C-0093 in `CHANGES.md` record this round. C-0044, C-0045 and C-0046 are now ✓.

- Checks at the last run: `npx tsc --noEmit`, `npx eslint src app` and `vitest` are clean.
- Click scripts for each portal are in the session scratchpad: `click-dev/`, `click-super/`, `click-staff-a/`, `click-staff-b/`, `click-client/`, `step7/`. The scratchpad is `/tmp/claude-1000/-home-farhath-Documents-vcfo-prototype/49d54c99-238a-49b4-b27f-a2085755dd75/scratchpad`. `/tmp` may be gone after a restart.
- `shared-check.cjs` and `undo-check.cjs` in the scratchpad check the shared fixes.

Not finished when the session stopped:
1. The client portal and public pages click-through (C-0043) was still running. Its report did not arrive. Rerun it: every route under `app/(client)` and the public routes, both COI states, 1440 and 390 px. Then set C-0043 to ✓.
2. After that, run the full sweep (`node $R/sweep.cjs $R/routes.txt`) and the checks again.

Open after this round:
1. Done (C-0096): drag-to-plan in Work and the Leads calendar.
2. Done (C-0097): Larkspur's phase counts match "Step 2".
3. The Northwind Documents tab says 18 (D-15). The head button says 6/11 and the Documents card lists 6 files.
4. Done (C-0097): `src/data/super.ts` phase counts match the step codes.
5. Knowledge bank shelves are not links. Only the GST shelf has files. Only search reaches the reader.
6. Profile › Appearance: Density and Text size save but do not change the page.
7. Staff Profile has no Team section. R-42 names only the client. Owner to confirm.
8. Done (C-0097): `SBC_CONTACTS` is removed.
9. Board resolution "Send to client" is a `mailto:` link.

## Next refactors

- Move `src/screens/client/step-detail.ts` into `src/data/client-incorporation.ts`.
- Give `DataGrid` a row-expand slot, so Leads and Connections stop using a panel below the grid.
- Merge the two assign dialogs: `AssignClientDialog` in `today-parts.tsx` and `AssignDialog` in `record-parts.tsx`.
- Widen `StaffPortal` to include super, then drop the super copies of StepScreen and BoardResolutionScreen.

## 29 Oct 2026

- C-0043 is ✓: the client portal and public pages click-through is done (C-0094, C-0095).
- The VCFO Spectrum restyle is on branch `design/spectrum`, waiting for the owner's review. See `docs/HANDOFF.md`.
