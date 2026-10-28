# Handoff: 28 Oct 2026, late evening

The owner closed the laptop. Continue from here. Read this file, then `docs/STATUS.md` ("Gaps and click-through round").

## State

- Repair round 2 is done (C-0072 to C-0084).
- Owner decisions are done (D-12 to D-16). The decision page is https://claude.ai/artifact/4xJTErL4HDwCZvj3xnitf5.
- Gaps and the click-through are done for staff, super admin and developer (C-0085 to C-0093). C-0044, C-0045 and C-0046 are ✓.
- Nothing is committed. The owner commits.

## Next steps

1. Run `npx tsc --noEmit`, `npx eslint src app` and `npx vitest run`.
2. Rerun the client portal and public pages click-through (C-0043). The agent was still running when the session stopped. It may have left half-done edits in `src/screens/client/`, `src/screens/shared/` or `src/screens/public/`. Check `git diff` on those folders first.
3. Run the route sweep: `node $R/sweep.cjs $R/routes.txt`. `$R` is `~/Documents/reference/vcfo-prototype/repair-2026-10-28`.
4. Set C-0043 to ✓ when the client click-through is clean. Add rows from C-0094.
5. Then work through "Open after this round" in `docs/STATUS.md`. Item 1 (drag-to-plan) is the largest.

## How to check

- Dev server: `npm run dev -- --port 3100`. Never pipe it into `head`.
- Screenshot: `node $R/shot.cjs <route> <out.png> [width] [light|dark] [before|after]`.
- Old screens (the target): `$R/old/old-<key>.png`. `$R/pairs.json` maps each key to a route.

## Do not

- Do not commit. The owner commits.
- Do not edit `reference/` or the real tool.
