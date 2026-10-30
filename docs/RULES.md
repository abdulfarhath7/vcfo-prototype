# Design rules

Each rule has a number. A row in `CHANGES.md` names the rule it follows. Write a rule once, here. Do not repeat it in other files.

Language: ASD-STE100 Simplified Technical English. One instruction per sentence. 20 words or fewer per sentence.

Sources: the owner's feedback (26 and 27 Oct 2026), `reference/design-book-v1.5.html`, the Portal refresh files in `reference/refresh/`, `reference/REFRESH-DIFF.md`.

VCFO Spectrum (28 Oct 2026): the owner picked a new design system. The canvas is https://claude.ai/artifact/Mthtcsro8KnEd5xHyJ9pTi. Where a 28 Oct rule and an older rule disagree, the 28 Oct rule wins. `src/styles/tokens.css` holds every value.

## Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | #F6F8FB | #0B0C10 | Page background |
| surface | #FFFFFF | #13151A | Cards |
| raised | #F1F4F8 | #0F1115 | Tracks, sunken fills |
| hover | #F4F6FA | #1A1D23 | Hover rows, live step row |
| line | #E3E8EF | #242830 | Card edges (1.5 px) |
| line-2 | #CBD3DE | #323742 | Control edges: inputs, secondary buttons |
| line-soft | #EDF1F5 | #1D2027 | Hairlines between table rows |
| ink | #0A2540 | #F2F4F8 | Text |
| ink-2 | #3C4F69 | #B6BECA | Secondary text |
| muted | #5E6E85 | #8E97A5 | Labels, hints |
| faint | #8896A8 | #6B7482 | Placeholders |
| primary | #635BFF / hover #5249F0 | #7A72FF / hover #8C85FF | Main button, picked segment, focus |
| accent | #4A3FE0 / soft #EFEEFF | #ABA6FF / soft rgba(122,114,255,.16) | Links, in progress |
| navy | #0A2540 | #0B1424 | Sidebar, strong button |
| brand | #F26B1D | #FF7A2E | Logo, today line, COI mark only |
| danger | #D92D20 | #F04452 | Danger button |
| ok (done) | #0B7A43 / #DFF5E7 / dot #16A34A | #5BE08E | Done |
| accent (in progress) | #4A3FE0 / #EFEEFF / dot #635BFF | #B3AEFF | In progress |
| teal (waiting) | #06708C / #DFF3F9 / dot #0EA5C6 | #6AD4EE | Waiting |
| warn (due soon) | #9A4D00 / #FFF0D9 / dot #F59E0B | #FFCB5C | Due soon, client owns it |
| bad (overdue) | #C0182F / #FFE6E9 / dot #E11D48 | #FF7F8E | Overdue |
| idle (not started) | #4E5D73 / #EDF0F5 / dot #94A3B8 | #A9B2BF | Not started |
| info | #0A5FC2 / #E8F1FD / edge #BFD8F7 | #7CB4F5 | SBC owner, info banner |
| caution | #7A4100 / #FFF6E0 / edge #F5DC9C | #FFCB5C | Warning banner |
| reg-* | MCA #2F6FEB, GST #0E9F8E, Income tax #8B5CF6, Payroll #F29D12, FEMA #E8457A, Labour #6BA815 | same | Area pills, spectrum ribbon |

Sizes: corners 6 px (marks 4 px, bars 3 px). Card edge 1.5 px. Chip 24 x 104 px. Row 44 px. Button 36 px, small 30 px, large 42 px. Sidebar 248 px. Top bar 60 px.

## Rules

| No. | Rule |
|---|---|
| R-01 | Keep every screen calm and professional. Use the income tax e-Filing portal as the model for tables and forms. |
| R-02 | Use shadows only on things that float: menus, tooltips, toasts, dialogs, command bar. The home card (R-17) is the one exception: it uses the colour wash. Do not use other gradients or glows. |
| R-03 | Use colour only to give information: status, lateness, owner, category tile. |
| R-04 | Do not show a mascot or a bot figure anywhere. "Ask VCFO" is a text button. |
| R-05 | Do not show filler text that tells the obvious, for example "Nothing is waiting on Northwind this week". |
| R-06 | Do not put explanation text or info icons next to buttons or card titles. |
| R-07 | Make tables clean rows (Stripe T1). The header is 36 px, 11.5 px capitals, weight 500, .07em spacing, muted, with a 1.5 px line under it. Rows are 44 px with a 1 px hairline. Do not use column lines, zebra rows or a navy header. Put page numbers under long tables. |
| R-08 | Put table filters (period, year, area, export) in the table head bar. Do not put them above the page. |
| R-09 | Do not repeat navigation. Do not show back links, page titles that repeat the sidebar, or pickers that repeat the sidebar. |
| R-10 | Make filters rounded-rectangle chips (Q3). A set filter has a soft blurple fill and an ×. An addable filter has a dashed edge, for example "+ Lead". Show up to 4 chips, then "More filters". |
| R-11 | Use underline tabs for views of one record (N4): a 2 px blurple underline. Use a segmented switch for filters (N5): a quiet track, the picked option blurple with white text. |
| R-12 | Make the main button blurple #635BFF with white text and a faint top shine. Hover is #5249F0. Height is 36 px, small 30 px, large 42 px. Kinds: primary, strong (navy), secondary (white, 1.5 px edge), ghost (6% ink), soft (blurple tint), danger, link. Icon-only buttons are 6 px squares. |
| R-13 | Show status as a chip: 24 px high, 6 px corners, 104 px wide, a 7 px square dot and the word, 12 px, weight 500. Use six words only: Not started, In progress, Waiting, Due soon, Overdue, Done. Do not put white text on a solid colour. |
| R-14 | Show the owner as a 104 px chip like R-13. Client is amber. SBC is blue. MCA is violet. |
| R-15 | Make a card white with a 1.5 px line #E3E8EF and 6 px corners. Keep the hairline under the head. |
| R-16 | Put a 28 px tinted icon tile with 6 px corners before each card title. The title is 15 px, weight 500. |
| R-17 | Make one home card on every portal home (H3 tight, D-17), about 160 px tall. It uses the colour wash, a 1.5 px edge and 6 px corners, The padding is 14 px at the top, 20 px at the sides and 16 px at the bottom. Row 1 holds the greeting at 22 px and the date on the same line (staff). For the client, row 1 holds a 36 px company tile, the full name at 22 px, the stage chip and the step count. The scope switch and one main action sit on the right of row 1. Row 2 holds the number tiles. On phones, row 1 wraps and the tiles go two in a row. |
| R-18 | Make home card tiles white 90% (dark: 80% of the dark surface), with a 1 px light edge, 6 px corners and a soft shadow. Put them in a grid with a 170 px minimum and a 10 px gap. Show a 14 px icon and a 12.5 px label, the number in 22 px, weight 500, tabular, and a 12 px sub line ("3 new today", "2 clients"). Put a 64 x 26 trend line beside the number where history exists (48 x 22 on phones). Colour it by what it measures: overdue red, waiting teal, done green, others blurple. The last point is the live count. An overdue number is red. A done number is green. Number tiles elsewhere (KP1) keep a 13 px label with a 15 px icon and a 26 px number. |
| R-19 | Make lists in a card run the full card width. Put a hairline between rows. |
| R-20 | In attention lists, show a 44 px date tile tinted by urgency. Put the chip on the right. Tint the full urgent row soft red. Give it a small navy action. |
| R-21 | Draw the timeline as a Gantt. Bars are 14 to 16 px with 3 px corners. Keep the orange today line. In the current phase, the done part is solid and the remaining part is blurple hatch. |
| R-22 | Show steps as ST5. A phase track has four bars sized by step count. Done is green, current is blurple with a soft ring, next is grey. In the step list, a done step is a green 22 px square with a tick. The live step is a ring with a status square and a halo. An upcoming step is a dashed square. The live step shows who holds it, the lead and the status chip. On phones and in client lists, show only the four bars. |
| R-23 | In a thread, show done steps with their dates. Show upcoming steps faded, without dates. |
| R-24 | Make expand toggles a plain chevron. Do not put a box around the chevron. |
| R-25 | Use status colours only in charts: a donut with a legend (C1), stacked bars per person (C2), stacked on-time and late columns (C4). On Incorporation, use one stacked bar, not four donuts. |
| R-26 | Colour file badges by type. PDF is red. DOCX is blue. XLSX is green. JPG and PNG are violet. ZIP is grey. |
| R-27 | Use Lucide icons with a 1.6 stroke. Use 16 px in text and 15 px in tiles. Use plain glyphs. |
| R-28 | Use Roboto 400, 500 and 700 for the interface. Use Roboto Mono 500 only for identifiers: CIN, PAN, GSTIN, SRN, ARN, DIN, step codes and form codes. Use tabular numbers everywhere. Use weight 700 only for display sizes and the logo. |
| R-29 | Use sentence case. Write plain dates, for example "14 Oct". Show a late date in red. Do not write "please" or "successfully". |
| R-30 | In dark mode, use the dark tokens. Mix chip colours into the panel colour. |
| R-31 | Make one component for each card type. A change to a card changes it on every portal. |
| R-32 | Sort the sidebar by priority. Daily work comes first. Then dated work, messages, documents, reports, settings. |
| R-33 | In Compliances, order the items: Obligations, Calendar, Filings. |
| R-34 | On the client sidebar, put Incorporation after Home while the company incorporates. Put Compliances after Home after incorporation. |
| R-35 | Keep each client's identity colour on staff screens. |
| R-36 | Make tabs inside a record page switch in place. Do not open another page. |
| R-37 | Do not show money on dashboards. The developer console keeps service costs. |
| R-38 | Do not show notification bars such as "Your next action" on pages. Notifications go to the bell. |
| R-39 | Keep the sidebar fixed when the page scrolls. |
| R-40 | Ask before a risky change (rotate a key, disconnect, roll back). Save a plain setting as it changes. Log both in Audit. |
| R-41 | Use one calm motion moment per screen at most. Use no motion under reduced motion. |
| R-42 | Put Team inside Profile as one section. Show the SBC team in a top card and the client's people in a large card. |
| R-43 | Show an area or regulator as a pill: 24 px, 6 px corners, 1.5 px edge, white fill, 104 px wide, an 8 px square swatch and the word. The text stays ink. |
| R-44 | Use one radius: 6 px on every box, button, chip, input, card, menu and dialog. Marks of 12 to 23 px use 4 px. Bars under 12 px use 3 px. Nothing is a pill. People avatars are circles. Companies are 6 px squares. |
| R-45 | Make the sidebar navy #0A2540 (dark #0B1424). Rows are 34 px with 6 px corners. The active row has a soft blurple fill and lilac text. Ask VCFO is a sidebar button at the bottom with the "/" key. It is never a floating bubble. |
| R-46 | Put a 3 px regulator spectrum ribbon across the top of every screen: six equal parts in the regulator colours. It is the only decorative line. |
| R-47 | Make inputs 40 px with a 1.5 px edge and 6 px corners. Focus shows a blurple edge and a 4 px glow. An error shows a red edge and a message under the field. A switch is a 44 x 24 track with 6 px corners. A checkbox is 18 px with 4 px corners. |
| R-48 | Make light menus roomy (34 px rows) and dark menus 30 px with letter shortcuts. Use a white info card for terms and a dark tip for actions. Use toasts with a status tile or Undo. Put a banner only inside the card it is about. A danger confirm asks the person to type the word. Show empty states as a dashed area with the action. Show loading as grey shapes. |
| R-49 | Make the sidebar pinned or a rail. Pinned is 248 px, and the page sits beside it. The rail is 56 px of icons. In rail mode, hover (after 160 ms) or keyboard focus opens the full sidebar over the page; it closes 280 ms after the pointer leaves, on Esc, or when a page opens. The pin button in the sidebar head and the "[" key switch the mode. Save the mode per browser. Under 1100 px the sidebar is always a rail. Urgent counts show as a red badge on the rail icon. |
| R-50 | Obligations are statutory or non-statutory. Statutory items are legal due dates from the activity master; the client always sees them. Non-statutory items are tasks: an admin or a manager sets the start, end, urgency and visibility (firm, client or both). Leads cannot create tasks. Obligations, Calendar and Filings carry the switch All · Statutory · Non-statutory with counts. The eight workflow stages collapse to the six status words; Due soon and Overdue come from the due date. Urgency is a neutral pill with bars; red stays for late work. See `docs/COMPLIANCE-MODEL.md`. |
| R-51 | The practice block. Every practice role (lead, manager, admin, super admin, client) has the same three sidebar entries with the same labels and icons, in the client's order: Incorporation (Landmark), Compliances (Obligations, Calendar, Filings), Registrations (BadgeCheck). Staff put the block after their people and Clients rows. Staff Incorporation lists the clients still incorporating, scoped to the role, with the current step, the PhaseBar, who holds it and the status. The super admin block links to Practice pages. The developer role has no block. |
| R-52 | Board resolution (NOC). The NOC is the parent's board resolution, one document in three variants. The page says who passes it ("Passed by: Board of the parent"), shows a key facts card, a "What you do" list with one main button, a track that adds Notarised and Apostilled for a foreign parent, a Draft tab with tinted filled values and a Signed copy tab with the uploaded PDF only (never a drawn signature), and the full decision tree with the chosen path and the project answers behind it. Staff add the template card, the out-of-date mark, versions and the receive checklist. See `docs/BOARD-RESOLUTION-NOC.md`. |

## Icon tile for each card title

The first match from the top sets the icon. A title that matches nothing gets "grid".

| Icon | Tone | Title words |
|---|---|---|
| alert-triangle | red | risk, stuck, overdue, incident, escalation, broken |
| bell | amber | alert, update, notification, announcement |
| circle-check | green | approval, decision, granted |
| calendar | teal | timeline, week, calendar, what is next, coming, deadline, schedule, renewal, plan |
| inbox | blue | inbox, triage, message |
| file | amber | need, document, docs, vault, upload, file |
| shield-check | green | compliance, filing, obligation, statute, status |
| clipboard-check | teal | what SBC is doing, holds, pending with, progress flow |
| user | violet | waiting, client, people, lead, manager, team, who |
| id-card | violet | registration, IDs, identity, credential |
| clock | violet | activity, audit, recent, history, log |
| list | blue | step, queue, work, task, action, post-incorporation |
| bar-chart | blue | phase, practice, analytics, growth, report, chart, health, area, service |
| mail | blue | email, mail |
| book-open | teal | library, knowledge, SOP, book |
| layout-grid | blue | anything else |
