# CLAUDE.md — VCFO Suite prototype

## What this is

A clickable prototype of VCFO Suite, SBC's compliance tool. It shows every screen of six portals (client, project lead, manager, admin, super admin, developer) with sample data. It has no database. The real tool is `~/Documents/vcfo-suite`; every change here must later go there.

Read `CONTEXT.md` first. Then read `docs/RULES.md` and the open rows of `docs/CHANGES.md`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 3 · shadcn-style parts on Radix · lucide-react (stroke 1.5) · Recharts. Public Sans; IBM Plex Mono for identifiers only. This matches the real tool on purpose.

## How to run (once the app exists)

```bash
npm install
npm run dev        # http://localhost:3000, portal chooser at /
npm run check      # typecheck, lint, test
```

## Folder map

- `app/` — routes only, one group per portal: `(client)`, `(lead)`, `(manager)`, `(admin)`, `(super)`, `(dev)`.
- `src/screens/<portal>/` — one file per screen; a screen places cards.
- `src/components/cards/` — one component per card type, shared by every portal.
- `src/components/ui/` — buttons, chips, tabs, file badges, inputs.
- `src/components/shell/` — sidebar, top bar, Ask VCFO button.
- `src/data/` — typed sample data.
- `src/styles/tokens.css` — every colour, size and radius (from `docs/RULES.md`).
- `docs/` — `RULES.md`, `CHANGES.md`, `CARRYOVER.md`, `SCREENS.md`, `REAL-TOOL-MAP.md`, `DECISIONS.md`.
- `reference/` — the old prototype and its sources. Never edit.

## Rules

1. One component per card type. A change to a card changes it on every portal.
2. No hex values in components. Use the tokens.
3. Every change gets a row in `docs/CHANGES.md`, with the real tool file from `docs/REAL-TOOL-MAP.md`.
4. Check each changed screen in a browser (light, dark, 390 px) before you set a row to ✓.
5. The owner's taste rules in `docs/RULES.md` win over any default: no decorative lines, gradients, mascots, filler text, back links or explanations; tables as income tax e-Filing grids.
6. Write docs in ASD-STE100: one fact per sentence, 20 words or fewer, active voice.
7. Do not edit `reference/` or the real tool from here. Do not commit unless the owner asks.

## Status

Built on 27 Oct 2026: shell, 16 shared cards, all six portals. See `docs/STATUS.md` for open items and `docs/CHANGES.md` for each round 5 row (C-0001 to C-0040). `docs/BUILD-BRIEF.md` is the brief for screen-building agents.
