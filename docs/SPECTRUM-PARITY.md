# Spectrum parity: design canvas vs prototype

Written in ASD-STE100. One fact in each cell. Audit of `design/spectrum` at 05e5509 on 28 Oct 2026.

Key: ✓ = present and correct. ◐ = present, but not as designed. ✗ = missing.
Source: the Spectrum canvas (https://claude.ai/artifact/Mthtcsro8KnEd5xHyJ9pTi), the owner's picks and the owner's messages.

## A. Foundations

| No. | Part | Design | Prototype | Status | Action |
|---|---|---|---|---|---|
| A-01 | Colour tokens | P1 light, P2 dark, one token set | Tokens match | ✓ | None |
| A-02 | Fonts | Roboto; Roboto Mono for codes | Roboto and Roboto Mono | ✓ | None |
| A-03 | One radius | 6 px; 4 px marks; 3 px bars | Matches | ✓ | None |
| A-04 | Edges | 1.5 px on cards and controls | Matches | ✓ | None |
| A-05 | Regulator ribbon | 3 px, six colours, top of every screen | Shown | ✓ | None |
| A-06 | Six status words | Not started, In progress, Waiting, Due soon, Overdue, Done | "Filed" (176 uses), "Upcoming" (166), "Pending" (52), "Stuck", "Failed", "Missing", "Working", "Proof pending", "At risk", "Sent back" also show in status chips | ✓ | Done: `Chip` maps every synonym to the six words. Filed → Done, Upcoming → Not started, Pending → Waiting. Words with extra meaning (Sent back, Stuck, At risk) show as a grey note after the chip. Developer service health keeps its own words (`raw`). |

## B. Components

| No. | Part | Design | Prototype | Status | Action |
|---|---|---|---|---|---|
| B-01 | Buttons | 7 kinds, 3 sizes, focus ring, loading state | Kinds present | ✓ | Check the loading state on Submit and File now. |
| B-02 | Icon buttons | 6 px squares with tooltip | Present | ✓ | None |
| B-03 | Status chip | 104 px, square dot | Present | ✓ | None |
| B-04 | Area pill | 104 px, swatch | Present | ✓ | None |
| B-05 | Filter chips (Q3) | Set chip in blurple with ×; dashed "+ Add"; "Clear all"; "More filters" after 4 | Dashed add chips present. No set-chip state is shown on first load. No "More filters". | ✓ | Done: shared `FilterChip` and `FilterChipRow` (set chip with ×, dashed add chip, Clear all, "More filters" after 4). Four local copies use it. Team tasks starts with "Status: Open". |
| B-06 | Date tile | 44 px, tinted by urgency | Present | ✓ | None |
| B-07 | Inputs | Focus glow, error text, hint | Present | ✓ | None |
| B-08 | Switch and checkbox | Rounded-rectangle switch, 18 px checkbox | Present | ✓ | None |
| B-09 | Segmented switch | Selected option filled blurple | Present | ✓ | None |
| B-10 | Underline tabs with counts | 2 px blurple line, count badge | Present on record pages | ✓ | Use them on Compliances (C-05). |
| B-11 | Menus D1 / D2 | Light roomy menu; dark menu with letter shortcuts | Action menus present. No shortcut keys shown. | ✓ | Done: `ActionMenu` rows take a letter key, shown as a key cap. C Copy link is wired in document and lead menus. No row menu has Edit or Reassign yet, so E and A have no row to run. |
| B-12 | Tooltips TP2 / TP3 | White info card for terms; dark tip with shortcut | Plain tooltips only | ✓ | Done: `Term` (TP2) with a glossary of 15 form codes, on client Filings and super Reports. `Tip` (TP3) with key caps on top bar icon buttons and the sidebar Ask button. |
| B-13 | Command bar (Q3) | Filter chips in the bar; grouped results; key footer | Grouped results and keys present. No filter chips. | ✓ | Done: the search palette has Regulator, Status and Client chips with Clear all. They narrow the results. |
| B-14 | Danger confirm (M1) | Type the word to confirm | Not found | ✓ | Done: `DangerConfirm` (type the word). Used for Remove lead, Delete document, Rotate key and Disconnect. |
| B-15 | Short form (M2) | Three fields, one decision | Assign dialog present | ✓ | None |
| B-16 | Toasts A1 / A2 | White toast with status tile; dark toast with Undo | Undo toast present. A1 white toast not found. | ✓ | Done: `useUndoToast().show(text, { kind })` gives the white A1 toast for Saved and Uploaded. The dark Undo toast (A2) stays the default. |
| B-17 | Banners A3 / A4 | Only inside the card they are about | Present | ✓ | None |
| B-18 | Empty state (E3) | Dashed drop area with the action | Present in some cards | ✓ | Done: tables show a dashed empty area with "Clear filters". Cards use the dashed `Empty`. |
| B-19 | Loading (L1) | Grey shapes of the content | `Skeleton.tsx` exists. No screen uses it. | ✓ | Done: `SectionCard` shows grey shapes for 300 ms on first load and on a tab switch. Reduced motion stops the pulse. |
| B-20 | Upload U1 / U2 / U3 | Per-file progress; compact chips; big drop zone | Drop zone present. No per-file progress row on Client Home. | ✓ | Done: Client Home › Recent documents shows each new upload with a progress bar, then an Uploaded tick. |
| B-21 | Table T1 | Clean rows, 44 px, uppercase head | Present | ✓ | None |
| B-22 | Number tile (KP1) | Label, number, note, trend line | Notes and trend lines missing on staff homes | ✓ | Done: home card tiles have a sub line and a trend line (D-01, H3 tight). |
| B-23 | Charts C1 / C2 / C4 | Donut, stacked person bars, on-time vs late columns | C1 and C2 present. C4 not found. | ✓ | Done: `OnTimeColumns` (C4) on Filings and on Analytics › Filings on time. |
| B-24 | Progress G1 | 10 px, 3 px corners, shine | Present | ✓ | None |
| B-25 | People and companies | People are circles; stacks with a ring; companies are 6 px squares | Present. Stacked avatars (V3) not used. | ✓ | Done: `AvatarStack` (V3) shows who works on each client in the Clients lists, and the managers of each admin on super admin Team. |
| B-26 | Steps ST5 | Phase track + step list + who holds it | Present | ✓ | None |
| B-27 | ST5 compact | Four mini bars per client in lists | Not found in client lists | ✓ | Done: the four-bar `PhaseBar` shows in the Clients lists, the phone list and "Clients · where each one is". |
| B-28 | Gantt | Hatched rest of current phase, orange Today flag | Present | ✓ | None |

## C. Screens

| No. | Screen | Design | Prototype | Status | Action |
|---|---|---|---|---|---|
| C-01 | Client Home · home card | One compact card (D-01) | Tall card, 5 tiles without trend lines | ✓ | Done: H3 tight card with a 36 px company tile, the full name, stage chip, step count, five tiles (three with trend lines), Report and Upload document. |
| C-02 | Client Home · cards | Incorporation (ST5), Timeline, Needs from Northwind, Who holds it now, Recent uploads (U1) | All present except Recent uploads with progress. Extra cards: Important alerts, What SBC is doing, Recent documents, Recent activity. | ✓ | Done: the extra cards stay. Uploads show progress (B-20). The sent-back passport no longer repeats in Important alerts; it leads Needs and the Overdue tile. |
| C-03 | Manager Today | Compact card; Team tasks with chips; Approvals; Task status; Workload | Present. Tall card. | ✓ | Done: H3 tight card. The All / Incorporating / Compliance switch is back in the home card. |
| C-04 | Other staff homes (Lead, Admin, Super admin, Developer) | Same compact card, each with its own five numbers | Tall card | ✓ | Done: lead, admin, super admin and developer use the H3 tight card with their own numbers and trend data. The lead switch is back in the card. |
| C-05 | Compliances · Filings | Tabs By filing / By client / Calendar; four KPI tiles; filter chips; rows grouped by filing (date tile, area pill, "3 of 5 filed" bar), client rows under each group with Lead, Note, Status and a File now / Open action | Flat grid of filings. Area tabs and a status switch instead of chips. No grouping. No row action. | ✓ | Done: staff Filings has underline tabs By filing (default), By client and All filings. Filings are grouped (date tile, name, area pill, "x of y filed" bar) with client rows, Lead, Note, Status and File now / Open. Filter chips replace the area tabs and status switch. |
| C-06 | Compliances · KPI row | Due this month, Filed, Due in 7 days, Overdue | Donut only | ✓ | Done: four tiles above the list: Due this month, Filed, Due in 7 days, Overdue. Each tile toggles its filter. |
| C-07 | Compliances · charts | On time vs late (C4); By regulator bars with all six regulators | By area bars without Labour; donut | ✓ | Done: "On time vs late" columns (C4) and "By regulator" bars with all six regulators. Labour shows 0 / 0: the sample data has no Labour filing. |
| C-08 | Phone · Client Home | Compact card; 2 × 2 tiles; ST5 compact; bottom tab bar (Home, Steps, Documents, Ask, More) with a tinted active tab | Tall card; 5 large tiles; menu button only | ✓ | Done: a bottom tab bar on phones for every portal (three main screens, Ask, More). Phone tiles wrap 2 × 2. |
| C-09 | Landing | v6 landing + C2 comparison table | Present. Big logo block mid-page. Old portal screenshots. | ✓ | Done (review fixes 1): the intro logo sits over the hero only; every landing screenshot is retaken from the Spectrum screens. |

## D. Owner decisions after the build

| No. | Decision | Status | Action |
|---|---|---|---|
| D-01 | Home card: H3 tight (owner pick, 29 Oct, replaces the one-row card). Two rows, about 160 px. Row 1: greeting and date, or company; scope switch and actions. Row 2: KP1 tiles with a 64 × 26 trend line where history exists. | ✓ | Done: `GreetingCard` copies OptH3t. Every home has its own trend data in `src/data/`. See D-17 in `DECISIONS.md`. |
| D-02 | Keep R-38: no "Your next action" bars on pages | ✓ | None |

## E. New ideas (my additions, approved by the owner's "bring all your ideas")

| No. | Idea | Where | Status | Action |
|---|---|---|---|---|
| E-01 | Bulk actions bar: when rows are selected, a bar shows Assign, Remind, Mark done, Export | Team tasks, Work, Filings, Clients | ✓ | Done: select rows and a bar shows Assign, Remind, Mark done and Export, with an Undo toast. On Team tasks, Work and Clients (all staff portals) and the staff Filings list. |
| E-02 | Row quick actions on hover: Open, Remind, Reassign as ghost icon buttons at the row end | All task and filing tables | ✓ | Done: Open, Remind and Reassign show at the row end on hover and focus. Enter opens, R reminds, A assigns on a focused row. |
| E-03 | Click a status chip to change the status (a small D2 menu with the six words) | Staff tables | ✓ | Done: the status chip opens a menu with the six words. The change shows an Undo toast and goes to the live audit list. On Team tasks and Work. |
| E-04 | "How is this counted?" TP2 card on each number tile | Home cards, KPI rows | ✓ | Done: every home card tile shows a white "How is this counted?" card on hover and focus, with one sentence and "Click to open the list". |
| E-05 | Each number tile is a link to the filtered list behind it | Home cards | ✓ | Done: every staff home tile links to its list: Overdue opens Work › My overdue, Waiting opens Waiting on clients, Due this week opens This week. Client tiles open their drill. |
| E-06 | Saved views: "My overdue", "This week", "Waiting on clients" as a tab row above big tables | Work, Filings, Clients | ✓ | Done: saved views above Work and Clients: All, My overdue, This week, Waiting on clients, and "+ Save view" (kept in the browser). |
| E-07 | Row density switch (Comfortable 44 px / Compact 32 px) in the table head | Big staff tables | ✓ | Done: a density menu in the table head (Comfortable 44 px, Compact 32 px), remembered per user. |
| E-08 | New-since-last-visit dot: a 6 px blurple square before rows that changed since the user last opened the page | Tables, Updates, Activity | ✓ | Done: a 6 px blurple square before rows changed since the last visit, with the time in a tooltip. |
| E-09 | Sticky table head and sticky first column on phone | All wide tables | ✓ | Done: every table head is sticky. The first column is sticky under 640 px. |
| E-10 | Keyboard shortcut sheet: "?" opens a dialog that lists every shortcut | All portals | ✓ | Done: "?" opens a sheet with every shortcut. A keyboard button next to the profile row in the sidebar opens it too. |
| E-11 | Relative due words with the exact date in a tooltip ("In 3 days" → "Mon 19 Oct 2026") | Due cells | ✓ | Done: attention lists of due items start the sub line with relative words ("In 3 days", "2 days late"). Every date tile shows the exact date as a tooltip. Tables keep plain dates. |
| E-12 | Reduced motion: no motion when the user asks for reduced motion | All | ✓ | Check it once more. |

## F. Order of work

1. D-01 and C-01, C-03, C-04, C-08 (home cards and phone tab bar).
2. A-06 (six status words).
3. C-05, C-06, C-07 (Compliances by filing).
4. B-14, B-16, B-19, B-20, B-27, B-25 (missing components).
5. B-05, B-11, B-12, B-13, B-18 (partial components).
6. E-01 to E-11 (new ideas).
7. C-09 review fixes 1, 2, 4.

After each group: run `npm run check`, sweep all routes at 1440 dark and 390 light, update this table (✗ → ✓) and `docs/CHANGES.md`, commit, push.
