# Handoff: 29 Oct 2026

Read this file, then `docs/STATUS.md`.

## State

- `main` holds repair rounds 1 and 2, decisions D-12 to D-16, and the click-through fixes. C-0043 to C-0046 are ✓. The last row is C-0097.
- Branch `design/spectrum` holds the VCFO Spectrum restyle (C-0098 to C-0110) and the v6 landing with the comparison section (C-0111, C-0112). The owner merges it after review. Do not merge it yourself.
- GitHub: https://github.com/abdulfarhath7/vcfo-prototype (public). Default branch `main`.
- The Spectrum worktree is `~/.cache/vcfo/spectrum` (branch `design/spectrum`). It has its own `node_modules` hard links. Run it with `npx next dev -p 3200`.

## Next steps

1. Wait for the owner's review of `design/spectrum`. Apply the review fixes on that branch.
2. Open items in `docs/STATUS.md` ("Open after this round").

## How to check

- Dev server: `npm run dev -- --port 3100`. Never pipe it into `head`.
- Screenshot: `node $R/shot.cjs <route> <out.png> [width] [light|dark] [before|after]`. `$R` is `~/Documents/reference/vcfo-prototype/repair-2026-10-28`.
- Route sweep: `node $R/sweep.cjs $R/routes.txt` (90 routes, 390 light and 1440 dark).

## Do not

- Do not edit `reference/` or the real tool.
- Do not commit unless the owner asks.
