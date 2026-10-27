# Context: VCFO Suite prototype

Read this file before you start work. Then read `docs/RULES.md` and `docs/CHANGES.md`.

## 1. What this is

VCFO Suite is a compliance tool for SBC (sbcllp.in), an Indian chartered-accountant firm. It runs company incorporation (the SPICe+ steps), registrations (GST, PF, ESI, trademark and others) and the recurring compliance calendar.

This project is a clickable prototype of the whole tool. It shows every screen with sample data. It has no database and no real sign-in. It is not the real tool.

Six people use the tool. Each has a portal.

| Portal | Person in the sample data | Real tool role |
|---|---|---|
| Client | Rohan Kumar, Northwind Technologies India Pvt Ltd | `client` |
| Project lead | Bharath | `intern` |
| Manager | Pranay | `manager` |
| Admin | Krishna | `admin` |
| Super admin | Mithilesh | `super_admin` |
| Developer | Farhath | none yet |

The real tool is the Next.js app at `~/Documents/vcfo-suite`. It is in development, built from the old prototype. Each change here must go to the real tool later. For that reason, record each change in `docs/CHANGES.md` with the real file to change.

## 2. Source material (in `reference/`, never edit)

| File | What it is |
|---|---|
| `reference/vcfo-suite-v6.html` | The old single-file prototype, version 6 (27 Oct 2026). Open it in a browser. Use the "Before / After" switch for the two client states. |
| `reference/old-screens/` | The screens of the old prototype, extracted from the HTML. `routes.js` lists the routes. `s/<area>/*.html` are the screens. |
| `reference/old-patch/` | The scripts and CSS that built the old prototype (`patch.mjs`, `ds.css`, `shared/`, `dev/`, `super/`, `admin/`). Read them for sample data and screen logic. |
| `reference/PROTOTYPE-AUDIT.md` | Rows 1 to 176: every change of rounds 1 to 4. |
| `reference/REFRESH-DIFF.md` | The Portal refresh rules and their status in version 6. |
| `reference/design-book-v1.5.html` | The design book: tokens and components, version 1.5. |
| `reference/refresh/` | The Portal refresh reference pages (`client-home.html`, `incorporation.html`, `compliance-calendar.html`, `manager-today.html`), `vcfo.css` and images. |

Other sources outside this folder: the SBC registration and compliance manual (`~/Downloads/SBC_Registration_Compliance_Manual 4.docx`), the real tool's `docs/context/STATE.md`, and the lcc project (`~/Documents/lcc/design/boards/Settings.dc.html`) for the developer console shape.

## 3. The owner's taste

The owner wants calm, professional screens. "Professional" means the income tax e-Filing portal (incometax.gov.in): plain grids, clear heads, nothing decorative. The full rules are in `docs/RULES.md`. The main points:

- No decorative lines, gradients, glows, mascots or filler text.
- Colour only as information.
- Tables as e-Filing grids, with filters in the table head bar.
- Compact controls, few filters, no repeated navigation, no back links.
- No explanations on screen. A user understands the obvious.
- One look for one kind of card, on every portal.
- When the owner asks for a change on one card, change every similar card on every portal. Do this for every later request too.

## 4. Stack and structure

The stack is the same as the real tool, so a change ports almost line for line.

| Part | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styles | Tailwind 3 with the tokens in `src/styles/tokens.css` (from `docs/RULES.md`) |
| Parts | shadcn-style components on Radix, as in the real tool's `src/components/ui/` |
| Icons | `lucide-react`, stroke 1.5 |
| Charts | Recharts |
| Data | Typed sample data in `src/data/`. No database. No API. |
| Fonts | Public Sans; IBM Plex Mono for identifiers |

Folder map (to create):

| Folder | Content |
|---|---|
| `app/` | Routes only. `app/(client)/…`, `app/(lead)/…`, `app/(manager)/…`, `app/(admin)/…`, `app/(super)/…`, `app/(dev)/…`, and a portal chooser at `/`. |
| `src/screens/<portal>/` | One file per screen. A screen places cards; it does not style them. |
| `src/components/cards/` | One component per card type: `GreetingCard`, `NumberStrip`, `SectionCard`, `AttentionList`, `GanttTimeline`, `Thread`, `WeekList`, `DataGrid`, `StackedBar`, `PhaseRows`, and the rest. |
| `src/components/ui/` | Buttons, chips, tabs, `FileBadge`, `Chevron`, inputs. |
| `src/components/shell/` | `Sidebar`, `TopBar`, `AskButton`. |
| `src/data/` | Sample data, ported from `reference/old-patch/shared/regcat.js`, `reference/old-patch/dev/data.js`, `detail.js`, `admin/data.js`, `super/data.js` and the screen files. |
| `src/styles/` | `tokens.css` and the Tailwind setup. |
| `docs/` | `RULES.md`, `CHANGES.md`, `CARRYOVER.md`, `SCREENS.md`, `REAL-TOOL-MAP.md`, `DECISIONS.md`. |
| `reference/` | Source material. Never edit. |

## 5. Rules for every build session

1. Read `CONTEXT.md`, `docs/RULES.md` and the open rows of `docs/CHANGES.md` first.
2. Make one component for each card type. Use it on every portal that shows the card.
3. Take every colour, size and radius from `src/styles/tokens.css`. Do not write hex values in components.
4. For each change, add a row to `docs/CHANGES.md`. Fill every column, including the real tool file from `docs/REAL-TOOL-MAP.md`.
5. Open each changed screen in a browser before you set a row to ✓. Check light mode, dark mode and a 390 px phone width.
6. Write docs in ASD-STE100: one fact per sentence, 20 words or fewer, active voice.
7. Do not edit anything in `reference/`. Do not edit the real tool from this project.
8. Do not commit unless the owner asks.

## 6. Screens

The new prototype has every screen of the old prototype. The list of 141 routes is in `docs/SCREENS.md`. Round 5 removes the client Team page (C-0027) and changes several layouts.

Build order (owner, 27 Oct 2026):

| Order | Portal | Why |
|---|---|---|
| 1 | Shell and shared cards | Every portal uses them. |
| 2 | Client | The owner reviewed the client portal first. |
| 3 | Project lead | Its cards reuse the client cards. |
| 4 | Manager | Same cards, plus Team tasks and approvals. |
| 5 | Admin | Same cards, plus managers. |
| 6 | Developer | Full redesign (C-0037 to C-0039). |
| 7 | Super admin | Tables, chips, layout and spacing (C-0035, C-0036). |

## 7. Round 5 requirements

The round 5 requirements (owner review of 27 Oct 2026) are rows C-0001 to C-0040 in `docs/CHANGES.md`. All start as ✗.

Owner decisions of 27 Oct 2026 for round 5:

| Topic | Decision |
|---|---|
| Table look | e-Filing grid: navy #15263B header with white text, a grid line on every cell, zebra rows, page numbers under the table. |
| Obligations and Registrations rail | Three cards: Due in the next 15 days, Waiting on client, Progress flow. |
| Team | One Team section in Profile: the SBC team card on top, the client's people in a large card below. |
| File badges | PDF red, DOCX blue, XLSX green, JPG and PNG violet, ZIP grey. |
| Icons | Lucide, stroke 1.5, plain glyphs. |
| Main button | Sidebar navy #15263B. |
| Developer and super admin | Fix everything. Developer first. |

## 8. Mapping to the real tool

`docs/REAL-TOOL-MAP.md` names the real file for each prototype screen and card. Use it to fill the "Real tool file" column in `CHANGES.md`.

`docs/CARRYOVER.md` lists the changes of rounds 1 to 4 that the real tool may not have yet. A port session reads `CARRYOVER.md` (status "Port") and `CHANGES.md` (status ✓) to update the real tool.
