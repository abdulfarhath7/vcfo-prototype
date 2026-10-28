# Restore brief for repair agents

Date: 28 Oct 2026.

The owner said the build "ruined" the UI. The worst case is the client calendar. `docs/PARITY-AUDIT.md` lists every part. Your task: make each ✗ row in your scope look and work like the old prototype again.

Read these files first: `CLAUDE.md`, `docs/RULES.md`, `docs/PARITY-AUDIT.md`, `docs/BUILD-BRIEF.md` (components, routes, checks). Then this file.

## The target is the old screen

1. The old screenshot is the target. The old screenshots are in `$S/old/old-<key>.png` (1440 px wide). The current new screenshots are in `$S/new/new-<key>.png`. `$S` is `/tmp/claude-1000/-home-farhath-Documents-vcfo-prototype/67740829-0e16-4552-980a-a18de2c523a3/scratchpad`. Open both with the Read tool before you change a screen.
2. The old source is the spec. `docs/SCREENS.md` gives the old file for each key. The files are in `reference/old-screens/s/`. Strip a file with `python3 -I $S/strip.py <file> | grep -v '^\s*$'`. Read the `<script>` parts with `grep` or `sed -n` for data and behaviour. Old files import fragments with `<dc-import name="x">`. The fragment is `x.dc.html` in the same folder.
3. Copy the old layout, the old order of cards, the old controls, the old labels and the old sample data (names, dates, counts). Copy the old visual devices: tinted tiles, coloured left edges, framed cells, navy head bands, rings, stamps, icons.
4. Use tokens only. Never write hex values in components. If a colour has no token, use the nearest token. Opacity modifiers (`bg-ok/20`) do not work on token colours. Use the `-soft` tokens.
5. Keep a change only when an owner rule or row names it. The audit "Cause" column names those rules (R-xx, C-xxxx, K-xx). The ✓ rows stay as they are. Do not "improve" anything. Do not invent cards, labels or data.

## Shared data that the lead already fixed

- Client names are the old names now: Kestrel Health, Halcyon Fintech, Orchid Lane Foods, Tidewater Logistics, Brightwave Robotics, Larkspur Analytics, Juniper Bio. Project leads are Bharath, Sneha Kulkarni and Meera Nair. See `src/data/people.ts`. Juniper Bio is now "incorporating": remove any filings it still has in your data files.
- `src/lib/dates.ts` has `STAFF_TODAY` (Fri 16 Oct 2026). Lead, manager, admin and super admin data uses that day, as in the old prototype. The client portal keeps `TODAY` (6 Oct), except where your brief says otherwise. Pass `STAFF_TODAY` as the `from` argument of `relative`, `urgency` and `daysFrom`.

## File ownership

- Edit only the files your task lists. You may add new files anywhere under `src/` with unique, descriptive names.
- Do not edit existing files in `src/components/cards/`, `src/components/ui/`, `src/lib/`, `src/styles/` and `tailwind.config.ts`. Add a new card instead. If you need a token, list it in your report.
- If you need data from a file that another agent owns, read it. Do not edit it. Put your own data in a new file.
- Do not edit `docs/CHANGES.md` or `docs/PARITY-AUDIT.md`. Do not commit. Do not start a dev server: one runs on port 3100. If curl gets no answer, wait 30 s and try again.

## Checks before you report

1. `npx tsc --noEmit` passes for the whole project. If an error is in another agent's file, wait one minute and run it again. Report it if it stays.
2. `npx eslint <your files>` passes.
3. Take screenshots: `node $S/shot.cjs <route> $S/fix/<key>.png [width] [light|dark] [before|after]`. The script prints `sidewaysScroll` and page errors. Take each route at 1440 light, 1440 dark and 390 light. Open each screenshot with Read. Put it next to the old screenshot. Fix every difference that is not a rule.
4. Click every dialog, drawer, tab and menu that you built. Write a short Playwright script in `$S/` for this if needed (Playwright is at `/home/farhath/Documents/vcfo-suite/node_modules/playwright-core`).

## Report

A table: `Audit row | Fixed / Not fixed | What you did | Files`. Then the gaps in shared files and the tokens you needed. Keep it short.
