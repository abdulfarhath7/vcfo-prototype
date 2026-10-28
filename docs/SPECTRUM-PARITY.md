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
| A-06 | Six status words | Not started, In progress, Waiting, Due soon, Overdue, Done | "Filed" (176 uses), "Upcoming" (166), "Pending" (52), "Stuck", "Failed", "Missing", "Working", "Proof pending", "At risk", "Sent back" also show in status chips | ◐ | Map each status chip to the six words. "Filed" becomes Done. "Upcoming" becomes Not started. "Pending" becomes Waiting. "Stuck" and "At risk" become Overdue or Due soon. Keep other words only as a second, grey note next to the chip (for example "Sent back"). Developer service health may keep "Working / Needs attention / Failed", because it is not a task status. |

## B. Components

| No. | Part | Design | Prototype | Status | Action |
|---|---|---|---|---|---|
| B-01 | Buttons | 7 kinds, 3 sizes, focus ring, loading state | Kinds present | ✓ | Check the loading state on Submit and File now. |
| B-02 | Icon buttons | 6 px squares with tooltip | Present | ✓ | None |
| B-03 | Status chip | 104 px, square dot | Present | ✓ | None |
| B-04 | Area pill | 104 px, swatch | Present | ✓ | None |
| B-05 | Filter chips (Q3) | Set chip in blurple with ×; dashed "+ Add"; "Clear all"; "More filters" after 4 | Dashed add chips present. No set-chip state is shown on first load. No "More filters". | ◐ | Show one set chip by default where a default filter exists (Manager Today: "Status Open"). Add "More filters" after 4 chips. |
| B-06 | Date tile | 44 px, tinted by urgency | Present | ✓ | None |
| B-07 | Inputs | Focus glow, error text, hint | Present | ✓ | None |
| B-08 | Switch and checkbox | Rounded-rectangle switch, 18 px checkbox | Present | ✓ | None |
| B-09 | Segmented switch | Selected option filled blurple | Present | ✓ | None |
| B-10 | Underline tabs with counts | 2 px blurple line, count badge | Present on record pages | ✓ | Use them on Compliances (C-05). |
| B-11 | Menus D1 / D2 | Light roomy menu; dark menu with letter shortcuts | Action menus present. No shortcut keys shown. | ◐ | Show shortcut keys in row menus (E Edit, A Reassign, C Copy link). |
| B-12 | Tooltips TP2 / TP3 | White info card for terms; dark tip with shortcut | Plain tooltips only | ◐ | Add TP2 to form codes (GSTR-3B, DIR-3 KYC, ADT-1 …). Add TP3 to icon buttons with shortcuts. |
| B-13 | Command bar (Q3) | Filter chips in the bar; grouped results; key footer | Grouped results and keys present. No filter chips. | ◐ | Add Regulator / Status / Client chips under the search field. |
| B-14 | Danger confirm (M1) | Type the word to confirm | Not found | ✗ | Use it for Remove lead, Delete document, Rotate key, Disconnect. |
| B-15 | Short form (M2) | Three fields, one decision | Assign dialog present | ✓ | None |
| B-16 | Toasts A1 / A2 | White toast with status tile; dark toast with Undo | Undo toast present. A1 white toast not found. | ◐ | Add A1 for Saved, Filed, Uploaded. |
| B-17 | Banners A3 / A4 | Only inside the card they are about | Present | ✓ | None |
| B-18 | Empty state (E3) | Dashed drop area with the action | Present in some cards | ◐ | Give every list card an E3 empty state (6 words or fewer + one button). |
| B-19 | Loading (L1) | Grey shapes of the content | `Skeleton.tsx` exists. No screen uses it. | ✗ | Show L1 on first load of each card (300 ms) and on tab switch. |
| B-20 | Upload U1 / U2 / U3 | Per-file progress; compact chips; big drop zone | Drop zone present. No per-file progress row on Client Home. | ◐ | Show "Recent uploads" with a progress row and an Uploaded tick (C-02). |
| B-21 | Table T1 | Clean rows, 44 px, uppercase head | Present | ✓ | None |
| B-22 | Number tile (KP1) | Label, number, note, trend line | Notes and trend lines missing on staff homes | ◐ | Use the compact tile (D-01). |
| B-23 | Charts C1 / C2 / C4 | Donut, stacked person bars, on-time vs late columns | C1 and C2 present. C4 not found. | ◐ | Add C4 to Compliances and Analytics (C-07). |
| B-24 | Progress G1 | 10 px, 3 px corners, shine | Present | ✓ | None |
| B-25 | People and companies | People are circles; stacks with a ring; companies are 6 px squares | Present. Stacked avatars (V3) not used. | ◐ | Use V3 in client lists ("who works on this client") and on Team. |
| B-26 | Steps ST5 | Phase track + step list + who holds it | Present | ✓ | None |
| B-27 | ST5 compact | Four mini bars per client in lists | Not found in client lists | ✗ | Add it to Clients lists and the "Clients · where each one is" card. |
| B-28 | Gantt | Hatched rest of current phase, orange Today flag | Present | ✓ | None |

## C. Screens

| No. | Screen | Design | Prototype | Status | Action |
|---|---|---|---|---|---|
| C-01 | Client Home · home card | One compact card (D-01) | Tall card, 5 tiles without trend lines | ◐ | Use the compact card. |
| C-02 | Client Home · cards | Incorporation (ST5), Timeline, Needs from Northwind, Who holds it now, Recent uploads (U1) | All present except Recent uploads with progress. Extra cards: Important alerts, What SBC is doing, Recent documents, Recent activity. | ◐ | Keep the extra cards (they are real features). Add the progress row (B-20) to Recent documents. Remove the duplicate passport row: it shows in Needs, Important alerts and Overdue at once. |
| C-03 | Manager Today | Compact card; Team tasks with chips; Approvals; Task status; Workload | Present. Tall card. | ◐ | Compact card (D-01). Move the All / Incorporating / Compliance switch into the Team tasks head. |
| C-04 | Other staff homes (Lead, Admin, Super admin, Developer) | Same compact card, each with its own five numbers | Tall card | ◐ | Compact card (D-01). |
| C-05 | Compliances · Filings | Tabs By filing / By client / Calendar; four KPI tiles; filter chips; rows grouped by filing (date tile, area pill, "3 of 5 filed" bar), client rows under each group with Lead, Note, Status and a File now / Open action | Flat grid of filings. Area tabs and a status switch instead of chips. No grouping. No row action. | ◐ | Add the "By filing" grouped view as the default tab. Keep the flat grid as "All filings". Add the row actions. |
| C-06 | Compliances · KPI row | Due this month, Filed, Due in 7 days, Overdue | Donut only | ✗ | Add the four tiles above the list. |
| C-07 | Compliances · charts | On time vs late (C4); By regulator bars with all six regulators | By area bars without Labour; donut | ◐ | Add C4. Add Labour to the regulator bars. |
| C-08 | Phone · Client Home | Compact card; 2 × 2 tiles; ST5 compact; bottom tab bar (Home, Steps, Documents, Ask, More) with a tinted active tab | Tall card; 5 large tiles; menu button only | ◐ | Add the bottom tab bar on phones for every portal (four main items + More). Use 2 × 2 compact tiles. |
| C-09 | Landing | v6 landing + C2 comparison table | Present. Big logo block mid-page. Old portal screenshots. | ◐ | Review fixes 1 and 2 (already sent). |

## D. Owner decisions after the build

| No. | Decision | Status | Action |
|---|---|---|---|
| D-01 | Home card: one row, about 84 px. Greeting or company on the left, five mini tiles (label, number, short note, 52 × 24 trend line where history exists), one action on the right. | ✗ | Copy the boards OptH3cCards and OptH3c. |
| D-02 | Keep R-38: no "Your next action" bars on pages | ✓ | None |

## E. New ideas (my additions, approved by the owner's "bring all your ideas")

| No. | Idea | Where | Status | Action |
|---|---|---|---|---|
| E-01 | Bulk actions bar: when rows are selected, a bar shows Assign, Remind, Mark done, Export | Team tasks, Work, Filings, Clients | ✗ | Build it. A2 toast with Undo after each action. |
| E-02 | Row quick actions on hover: Open, Remind, Reassign as ghost icon buttons at the row end | All task and filing tables | ✗ | Build it. Keyboard: Enter opens, R reminds, A assigns. |
| E-03 | Click a status chip to change the status (a small D2 menu with the six words) | Staff tables | ✗ | Build it. Log the change in Audit. |
| E-04 | "How is this counted?" TP2 card on each number tile | Home cards, KPI rows | ✗ | One sentence + the filter it opens. Click opens the filtered list. |
| E-05 | Each number tile is a link to the filtered list behind it | Home cards | ✗ | Build it. |
| E-06 | Saved views: "My overdue", "This week", "Waiting on clients" as a tab row above big tables | Work, Filings, Clients | ✗ | Build it with three default views and "+ Save view". |
| E-07 | Row density switch (Comfortable 44 px / Compact 32 px) in the table head | Big staff tables | ✗ | Build it. Remember the choice per user. |
| E-08 | New-since-last-visit dot: a 6 px blurple square before rows that changed since the user last opened the page | Tables, Updates, Activity | ✗ | Build it. |
| E-09 | Sticky table head and sticky first column on phone | All wide tables | ◐ | Make heads sticky everywhere. Make the first column sticky under 640 px. |
| E-10 | Keyboard shortcut sheet: "?" opens a dialog that lists every shortcut | All portals | ✗ | Build it. Add a "Shortcuts" row to the profile menu. |
| E-11 | Relative due words with the exact date in a tooltip ("In 3 days" → "Mon 19 Oct 2026") | Due cells | ◐ | Use plain dates in tables (R-29). Use relative words only in home tiles and attention lists, with the date in a tooltip. |
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
