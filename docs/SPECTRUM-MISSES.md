# Spectrum misses: what the build left out of the design

Written in ASD-STE100. One fact in each cell. Audit of `design/spectrum` at 1f6dff9 on 29 Oct 2026, 05:30 UTC.

Each row is a part of the design that the prototype build did not copy. The owner found some rows. The design chat found the other rows in its reviews.

Key: ✓ = fixed and checked in the running app. ✗ = still missing.
"Found by" shows who saw the miss first.

## A. Misses that are now fixed

| No. | Miss | Design (canvas) | What the build did | Found by | Fix | Status |
|---|---|---|---|---|---|---|
| M-01 | Graphs in the number tiles | Each number tile has a 64 × 26 trend line in the colour of what it measures | The trend lines were left out of the tiles | Owner | Commit 1f6dff9 adds the trend lines to every portal home | ✓ |
| M-02 | Greeting card height | The card must use little space and keep its meaning | The first card was about 220 px tall. A later one-row card dropped the graphs. | Owner | "H3 tight": about 160 px, with all graphs, icons and notes | ✓ |
| M-03 | Notes under the numbers | Each tile shows a short note, for example "3 new today" | The tiles showed only a label and a number | Design chat | Notes added on every home | ✓ |
| M-04 | Six status words | Only Not started, In progress, Waiting, Due soon, Overdue, Done | Chips used "Filed", "Upcoming", "Pending", "Stuck" and others (more than 500 uses) | Design chat | Commit 465f228 maps every chip to the six words | ✓ |
| M-05 | Compliances by filing | Rows grouped by filing, with a date tile, an area pill and a "3 of 5 filed" bar | A flat list of filings | Design chat | "By filing" is now the first tab | ✓ |
| M-06 | Compliances number tiles | Due this month, Filed, Due in 7 days, Overdue | Only a donut | Design chat | Four tiles added | ✓ |
| M-07 | On-time vs late chart | Stacked columns, one for each month | Not built | Design chat | Chart added on Compliances | ✓ |
| M-08 | Labour in the regulator bars | Six regulators, Labour included | Five regulators | Design chat | Labour added | ✓ |
| M-09 | Phone tab bar | Home, Steps, Documents, Ask, More, with a tinted active tab | A menu button only | Design chat | Tab bar added on phones | ✓ |
| M-10 | Big logo in the middle of the landing page | The big logo is not in the middle of the page | The big logo was above the comparison table | Design chat | Logo removed | ✓ |
| M-11 | Old screenshots on the landing page | The landing page shows the new portal | The images showed the old portal | Design chat | Images replaced | ✓ |
| M-12 | Approvals rows | One title line and one detail line | Titles went to two lines. Details were cut off. | Design chat | Short client names, one line each | ✓ |
| M-13 | Danger confirm | Type the word to confirm | Not built | Design chat | `DangerConfirm` added | ✓ |
| M-14 | Loading shapes | Grey shapes of the content while it loads | `Skeleton` existed. No screen used it. | Design chat | Tables show the shapes on first load | ✓ |
| M-15 | Stacked people | People stack with a ring and "+N" | Not used | Design chat | `AvatarStack` on Team and client grids | ✓ |
| M-16 | Steps in client lists | Four small bars for each client | Not built | Design chat | ST5 compact bars added | ✓ |
| M-17 | Filter chips in search | Regulator, Status and Client chips under the search field | Not built | Design chat | Chips added to the Ctrl K search | ✓ |
| M-18 | Terms explained | A white card explains form codes (GSTR-3B, ADT-1 and others) | Not built | Design chat | `Term` tooltip with a glossary | ✓ |
| M-19 | Bulk actions | A bar with Assign, Remind, Mark done, Export when rows are selected | Not built (new idea) | Design chat | `BulkBar` in data tables | ✓ |
| M-20 | Row actions | Open, Remind, Reassign show when the pointer is on a row | Not built (new idea) | Design chat | Row actions in data tables | ✓ |
| M-21 | Change status from the chip | Click the chip to choose one of the six words | Not built (new idea) | Design chat | `StatusMenu` added | ✓ |
| M-22 | "How is this counted?" | Each number tile explains its count | Not built (new idea) | Design chat | Tooltip on every home tile | ✓ |
| M-23 | Saved views | "My overdue", "This week", "Waiting on clients" | Not built (new idea) | Design chat | `SavedViews` on big tables | ✓ |
| M-24 | Row density | Comfortable 44 px or Compact 32 px | Not built (new idea) | Design chat | Density switch on big tables | ✓ |
| M-25 | New since the last visit | A small blurple square before changed rows | Not built (new idea) | Design chat | Dot added in data tables | ✓ |
| M-26 | Shortcut sheet | "?" opens a list of all shortcuts | Not built (new idea) | Design chat | `ShortcutSheet` added | ✓ |

## B. Misses that are still open

| No. | Miss | Design (canvas) | What the build did | Found by | Action | Status |
|---|---|---|---|---|---|---|
| M-27 | Shortcut keys in menus | Row menus show the key for each action (E Edit, A Reassign, C Copy link) | The parity table says ✓, but `ActionMenu` shows no keys | Design chat | Show the keys at the right of each menu row | ✗ |
| M-28 | White "Saved" toast (A1) | A white toast with a green status tile for Saved, Filed and Uploaded | Only the dark Undo toast exists | Design chat | Add the white toast. Use it when an action has no Undo. | ✗ |
| M-29 | Empty gap on the landing page | No large empty space between sections | Removing the big logo left an empty gap of about 200 px above the comparison table | Design chat | Remove the gap. Use the normal section spacing. | ✗ |
| M-30 | Client home on phones | The home card stays short on phones, with no empty half-rows | On a 390 px screen the card is about 430 px tall. The fifth tile sits alone in its row, so half of that row is empty. | Design chat | Make Report an icon button. Let the fifth tile span both columns as a short strip (label and value on one line). Aim for about 340 px. | ✗ |

## C. Why the misses happened

| No. | Cause | Fix for the future |
|---|---|---|
| W-01 | The build copied the written rules. It did not compare each screen with its canvas board. | Compare every changed screen with its board, side by side, before marking it ✓ |
| W-02 | Some rows were marked ✓ from the code alone, without a look at the screen. | Mark ✓ only after a screenshot check in light, dark and 390 px |
| W-03 | Owner picks changed during the build: compact card, then H3 tight. Some messages replaced earlier messages. | Record each owner pick in `RULES.md` with the date. The newest pick wins. |
