# Design rules

Each rule has a number. A row in `CHANGES.md` names the rule it follows. Write a rule once, here. Do not repeat it in other files.

Language: ASD-STE100 Simplified Technical English. One instruction per sentence. 20 words or fewer per sentence.

Sources: the owner's feedback (26 and 27 Oct 2026), `reference/design-book-v1.5.html`, the Portal refresh files in `reference/refresh/`, `reference/REFRESH-DIFF.md`.

## Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| canvas | #F3F5F9 | #111821 | Page background |
| surface | #FFFFFF | #18202B | Cards |
| raised | #F5F6F8 | #1F2935 | Tab tracks, hover rows |
| line | #E3E6EB | #2C3745 | Card borders, grid lines |
| line-soft | #EEF0F3 | #263140 | Hairlines between rows |
| ink | #16212F | #E6EAF0 | Text |
| ink-2 | #3F4A59 | #C3CCD8 | Secondary text |
| muted | #667180 | #9AA7B8 | Labels, hints |
| faint | #98A1AE | #6F7C8D | Placeholders, counts |
| navy | #15263B | #15263B | Sidebar, greeting band, main buttons, table heads, picked tab |
| navy-2 | #1B3049 | #1B3049 | Greeting band gradient start, button hover |
| navy-tint | #EEF2F8 | #1F2935 | Light table heads (not used for e-Filing grid) |
| btn | #15263B / hover #1B3049 | #2B4766 / hover #335378 | Main buttons and the picked tab. Dark mode lifts navy so it shows on the slate surface. |
| accent | #2563A8 / soft #E6EFFA | #6FA3E0 | Links, current step, "in progress" |
| ok | #1E7F55 / soft #E2F3EA / mid #46A87A | #8FDCB4 | Done, filed |
| warn | #A35F00 / soft #FCEFD8 / mid #E3A040 | #F2C27A | Due soon, client owns it |
| bad | #BE3434 / soft #FBE6E6 / mid #DD6262 | #F29B9B | Overdue, failed |
| violet | #6A4FB6 / soft #EFEAFB | #C4B2F2 | MCA, IDs |
| teal | #0F7C86 / soft #E0F3F4 | #7FD0D6 | Calendar, GST |
| brand | #E9792F | #E9792F | Today line, COI mark, logo only |

## Rules

| No. | Rule |
|---|---|
| R-01 | Keep every screen calm and professional. Use the income tax e-Filing portal as the model for tables and forms. |
| R-02 | Do not use decorative lines, gradients, glows or shadows. Use neutral hairlines. |
| R-03 | Use colour only to give information: status, lateness, owner, category tile. |
| R-04 | Do not show a mascot or a bot figure anywhere. "Ask VCFO" is a text button. |
| R-05 | Do not show filler text that tells the obvious, for example "Nothing is waiting on Northwind this week". |
| R-06 | Do not put explanation text or info icons next to buttons or card titles. |
| R-07 | Make every data table an e-Filing grid. Use a navy header with white text. Put a grid line on every cell. Use zebra rows. Put page numbers under the table. |
| R-08 | Put table filters (period, year, area, export) in the table head bar. Do not put them above the page. |
| R-09 | Do not repeat navigation. Do not show back links, page titles that repeat the sidebar, or pickers that repeat the sidebar. |
| R-10 | Use a few compact dropdown filters. Do not use long rows of filter chips. |
| R-11 | Make tabs small inline buttons on a quiet track. Show the picked tab in navy with white text. Do not use a sliding highlight. Tabs do not wrap. |
| R-12 | Make the main button navy #15263B with white text. Use hover #1B3049. Height is 36 px, small is 30 px. Use one main button per card. |
| R-13 | Show status as a soft chip with a 6 px dot. Height is 22 px. Corners are 5 px. In tables the chip is 108 px wide. |
| R-14 | Show the owner as a 96 px soft chip with a dot. Client is amber. SBC is blue. MCA is violet. |
| R-15 | Make a card white with a 1 px line and 10 px corners. The head is 52 px with a hairline under it. |
| R-16 | Put a 28 px tinted icon tile before each card title. The title is 14.5 px, weight 600. The tile comes from the title (see the icon table). |
| R-17 | Make the greeting card the same on every portal. A navy band holds the date, the name and the actions. A white number strip follows. |
| R-18 | In the number strip, give each number a 30 px tinted icon tile. Put 12 px between the tile and the text. Put the label above the number. |
| R-19 | Make lists in a card run the full card width. Put a hairline between rows. |
| R-20 | In attention lists, show a 44 px date tile tinted by urgency. Put the chip on the right. Tint the full urgent row soft red. Give it a small navy action. |
| R-21 | Draw the timeline as a Gantt. Rows are 46 px. Bars are 16 px with 6 px corners. Show an orange today line and an orange COI diamond. |
| R-22 | Give each timeline row one status circle. Done is a green tick. Current is one blue clock circle. Planned is a grey ring. |
| R-23 | In a thread, show done steps with their dates. Show upcoming steps faded, without dates. |
| R-24 | Make expand toggles a plain chevron. Do not put a box around the chevron. |
| R-25 | Show a split as one stacked bar with a legend. Use a donut only at the head of Calendar and Filings. |
| R-26 | Colour file badges by type. PDF is red. DOCX is blue. XLSX is green. JPG and PNG are violet. ZIP is grey. |
| R-27 | Use Lucide icons with a 1.5 stroke. Use 16 px in text and 15 px in tiles. Use plain glyphs. |
| R-28 | Use Public Sans for the interface. Use IBM Plex Mono only for identifiers such as CIN, PAN, GSTIN, SRN, ARN and file names. |
| R-29 | Use sentence case. Write plain dates, for example "14 Oct". Show a late date in red. Do not write "please" or "successfully". |
| R-30 | In dark mode, use slate surfaces from the token table. Mix chip and tile colours with the panel colour. |
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
