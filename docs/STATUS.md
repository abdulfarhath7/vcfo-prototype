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
4. `KeyValue` cuts long values (addresses). Add a `wrap` prop.
5. `iconFor` has no entry for: due, thread, capacity, reassign, integration, reminder, pipeline, source. Screens pass `icon` by hand.
6. Not ported from the old prototype: calendar Year and Timeline views, VCFO Assist filing card, drag-to-plan in Work, step explainer panel, super admin Money screen (R-37 removes money), dev uptime tiles (C-0039 removes them).
7. `docs/CARRYOVER.md` rows with status "Port" still need a port session into the real tool.
8. `obHref` in `src/data/compliance.ts` builds `/<portal>/obligations/<id>` for staff; the nav uses `/<portal>/compliances/obligations/<id>`. Staff screens use `staffObHref` from `src/data/staff-compliance.ts`. Fix `obHref` and drop the copy.
9. The lead's compliance screens show Bharath's 3 compliance clients; Today and Clients show all 8 of Pranay's. Pick one scope.

## Next refactors

- Move `src/screens/client/step-detail.ts` into `src/data/client-incorporation.ts`.
- Give `DataGrid` a row-expand slot, so Leads and Connections stop using a panel below the grid.
- Add a `title` slot to `SectionCard` for a client colour dot (R-35).
