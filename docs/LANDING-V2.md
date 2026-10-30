# Landing page v2: build spec

Owner decision: 30 Oct 2026 ("go ahead, build it"). Rule: R-53.
Target: `src/components/marketing/landing/LandingScreen.tsx`, `content.ts`, `landing.css` and `landing-motion.ts` in VCFO Suite (the live page at app.sbctrack.in).
Keep the v6 look: Public Sans, IBM Plex Mono labels, the dark theme, the real VCFO logo and the C2 comparison table (owner decisions).

## 1. Rules

| # | Rule |
|---|---|
| R1 | Every section has one big visual. The visual is the content. |
| R2 | Text per section: one headline, one sentence and up to 3 short labels. No paragraph sits under or beside a diagram. |
| R3 | Labels sit inside the diagrams. |
| R4 | Two diagrams are pinned (sticky) and play their steps as the visitor scrolls: the stage 1–2 flow chart and the yearly ring. |
| R5 | Every diagram is complete in its resting state. Motion only adds to it. Nothing starts at opacity 0 (fixes L1, L2). |
| R6 | A diagram plays once. A click, or scrolling back, replays it. `prefers-reduced-motion` shows every diagram complete and still. |
| R7 | Target height: about 8 screens at 1440 × 900 (today: 17, 15,196 px). Target sections: 9 (today: 14). |

## 2. Sections (by the ids in LandingScreen.tsx)

| # | id today | New | Change |
|---|---|---|---|
| 1 | `.hero` | Hero | Headline, sub-line and screenshot visible on the first paint (no 2–4 s delay). Two buttons: Book a demo, Try it live (delete "See how it works", D11). The logo does not move on load (F3). New: one status chip on the screenshot changes from "In progress" to "Done" once (V2). New: the six-colour regulator ribbon under the hero (V3). |
| 2 | `.facts` | Number strip | Keep 25 · 23 · 6 · 1. One line under each number. Count up once in under 1 s. |
| 3 | `#journey` | Removed (D6) | Its 4-stage line becomes the first frame of section 4. |
| 4 | `#incorporate` | Journey · Incorporate | **Pinned.** The flow chart (client, firm, MCA) stays on screen and its 16 steps light up one by one with the scroll. Delete the step list beside it (D2). New: inside the chart, the NOC decision tree (Ownership → Subsidiary → Foreign subsidiary → NOC) as one lit node group (V1). Height ≤ 1.5 screens of scroll. |
| 5 | `#after` | Journey · First 180 days | Keep the timeline. One label per day marker (D3). New: a small Gantt of the filing windows under the line (V4). |
| 6 | `#register` | Journey · Register | Keep the company-and-regulators diagram. Regulator colours from the tokens. Delete the text under each group (D4). |
| 7 | `#comply` | Journey · Every year | **Pinned.** The yearly ring turns month by month. One portal screenshot, not three (D5). New: a heat map of busy weeks beside the ring (V5). One ring label: "each filing: owner · date · proof" (D7). |
| 8 | `#record` | Removed (D7) | Its idea is the ring label in section 7. |
| 9 | comparison (C2) | Comparison | Keep the dark three-column table with the real logo. Keep the 6 strongest rows (D9). Ticks fill in row by row; the text is always visible. |
| 10 | `#portals` | One record, every role | One screenshot with the 5 role tabs. New: the Ask VCFO bubble on the screenshot types one answer once ("Your name application is with MCA. Expected 28 Oct."), D8. |
| 11 | `#ask` | Removed (D8) | Moved into section 10. |
| 12 | `#trust` | Trust | The 4 points as one row of icon tiles. |
| 13 | `#faq` | FAQ | 4 questions, closed by default: Who is it for · What does the client do · Which filings are covered · Where is the data held. Delete "Is it only for SBC?" and "How are we reminded?" (D10). |
| 14 | `.cta` + footer | Final call to action | Keep "Your clients. Their filings. Your team. All on one record." and the footer. |

All sections: delete every paragraph longer than one sentence (D1) and remove extra empty space between sections (D12).

## 3. Not deleted

Hero headline, screenshot and floating cards · number strip · stage 1–2 flow chart · 180-day timeline · registrations diagram · yearly ring · C2 comparison table · portal screenshot with role tabs · trust tiles · final line and footer.

## 4. Checks

| # | Check |
|---|---|
| T1 | First paint (0 ms): the hero headline and both buttons are visible. |
| T2 | A full-page screenshot without scrolling shows no blank section. |
| T3 | Page height at 1440 × 900 is at most 8 screens plus the pinned scroll. |
| T4 | Reduced motion: no animation; every diagram complete. |
| T5 | 390 px phone: no sideways scroll; pinned sections become normal stacked sections. |
| T6 | Lighthouse performance on mobile does not drop below today's score. |
| T7 | The landing tests in `LandingScreen.test.tsx` pass, updated for the removed sections. |
