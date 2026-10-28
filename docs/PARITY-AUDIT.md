# Parity audit: old prototype against new prototype

Date: 28 Oct 2026.

Method: the auditor took a screenshot of every old screen in `reference/vcfo-suite-v6.html` and of the matching new route, at 1440 px. The auditor compared the 93 pairs side by side. The auditor also clicked the dialogs, drawers and calendar tabs.

Marks:

- ✓ The part is the same as the old prototype, or it changed because an owner rule or request said so.
- ✗ The build changed the part or lost it, and no owner request asked for that.

Cause column: "Build" means the first build session or its agents. A rule or row number means the owner asked for the change.

## 1. Calendar

The client calendar lost 8 parts. Only the Year, Timeline and List views survived.

| Part | Old | New | | Cause |
|---|---|---|---|---|
| Filter bar | Month ‹ October 2026 ›, FY 2026-27 chip, area chips (All 13, MCA 2, GST 3, Income tax 4, Payroll 2, FEMA 2), Month / Year / Timeline, Filings | Card head "Deadlines", Month / List / Year / Timeline tabs, month dropdown, "All areas" dropdown | ✗ | Build |
| Day numbers | Tinted by urgency: 7 red; 10, 11 and 15 amber | Plain numbers. None are tinted. | ✗ | Build |
| Today | Whole cell framed in blue | Small blue number only | ✗ | Build |
| Day items | Tags with a coloured left edge, and a count in the cell corner | Filled colour chips, no count | ✗ | Build |
| Donut | Top of the right rail, "13 October" | Moved into a new "Status this month" card | ✗ | Build |
| Next deadline | 3 DAYS tile, GST tag, "Data received", "Open filing →", "Remind me", "ECB-2 return · 1 day late" | Different tile, "1 day left", "Open", "Add to my calendar". The late row is gone. | ✗ | Build |
| Coming up | Date tile, area tag, status chip with icon | Date tile, area tag, relative text ("In 4 days"). The status chips are gone. | ✗ | Build |
| Data | 13 filings in October | 14 filings, on different days | ✗ | Build |
| Year, Timeline, List views | Present | Present, and they work | ✓ | |
| Staff calendar (lead, manager, admin, super admin) | Filing names on each day | Client names on each day | ✗ | Build |

## 2. Everywhere (shell and data)

| Part | Old | New | | Cause |
|---|---|---|---|---|
| Logo | VCFO Suite logo image; SBC logo in the top bar | Orange "V" square; "SBC" as text | ✗ | Build. The images in v6 were not taken. |
| Sidebar icons | An icon on every item | No icons | ✗ | Build |
| Client sidebar team block | "Northwind's team": Pranay, Bharath, Customer support | Missing | ✗ | Build |
| Before / After switch | In the top bar | Missing. Only `?state=after` in the URL works. | ✗ | Build |
| Prototype bar | Portal switch, Desktop / Mobile 390, screen picker | Missing | ✗ | Build |
| Staff dates | "Fri 16 Oct 2026 · 12:31 PM" | "Tuesday 6 October 2026". All staff data moved 10 days earlier. | ✗ | Build |
| Client names | Orchid Lane Foods, Brightwave Robotics, Kestrel Health, Larkspur Analytics, Juniper Bio, Tidewater Logistics, Halcyon Fintech | Zenith, Arcadia, Bluefin, Corvid, Delta, Ember Studios, Fjord | ✗ | Build. The first build invented these names. |
| Project lead names | Bharath, Sneha Kulkarni, Meera Nair | Bharath, Divya, Meera Nair | ✗ | Build |
| Search, bells, theme | Present | Same | ✓ | |
| Ask VCFO button | Bot figure and text | Text only | ✓ | R-04 |
| Landing page and sign-in | Present | Restored | ✓ | |
| Tables as e-Filing grids, soft chips | Card lists, solid chips | e-Filing grids, soft chips | ✓ | C-0007, R-13 |

## 3. Client portal

| Screen | Part | Old | New | | Cause |
|---|---|---|---|---|---|
| Home | "Your next action" bar | Present | Removed | ✓ | C-0012 |
| Home | Timeline rows | Phase 1 · Name Application, Phase 2 · Incorporation, MCA review, COI | Name application, Incorporation, MCA review, Post-incorporation. The COI row is gone. | ✗ | Build |
| Home | Right column | Important alerts at the top | "Who holds it now" at the top | ✗ | Build |
| Home | All other cards | Present | Same | ✓ | |
| Incorporation | COI card, This week | Present | Same | ✓ | |
| Incorporation | Timeline | SPICe+ Part A (100%, "3 days late"), SPICe+ Part B (11%), Post-incorporation (0%) | A copy of the home timeline | ✗ | Build |
| Incorporation | Phases card | Not on this page | Added | ✗ | Build |
| Incorporation | Four summary cards | Donuts | Stacked bars | ✓ | R-25 |
| Filings | Layout | Donut and list | Chart and progress bars on top, e-Filing grid below | ✓ | C-0016, C-0017 |
| Filings | Date tiles in rows; "‹ Sep to Oct 2026 ›" period switch | Present | Missing | ✗ | Build |
| Documents | Tree, preview, filters | Present | Same | ✓ | |
| Library | Shelf | Book shelf with coloured spines | Plain tile grid | ✗ | Build |
| Library reader | Look | Navy head band, 3-step timeline, amber "Why it matters" box | White head, dot list, plain text | ✗ | Build |
| Team | Place | Own page | Profile → Team tab | ✓ | C-0027, C-0028 |
| Announcements | Next-deadline bar | Present | Removed | ✓ | R-38 |
| Notifications | Split | Donut | Stacked bar | ✓ | R-25 |
| Audit | Layout | Bar chart and timeline | e-Filing grid | ✓ | C-0029 |
| Settings | Look | Navy profile card, icons on alert rows, Theme Light / Dark / System | No navy card, no icons, no "System" | ✗ | Build |
| Document viewer | Form | Overlay over the page, SAMPLE mark, zoom pill | A full page | ✗ | Build |
| Password reveal | Dialog | "Confirm it's you" dialog | Code dialog inside Credentials | ✓ | |
| Credentials | Look | Tinted ID tiles, Address tab first, spreadsheet columns A–F, "Auto from registered office" tags, Before / After COI switch | White tiles, Login tab first, e-Filing grid | ✗ | Build |
| Phase pages | Look | Navy head band, 11% ring, previous and next phase in the head, dark current-step card with a mini stepper | White head; the ring and the mini stepper are gone; previous and next at the bottom | ✗ | Build |
| Step pages | Look | Amber drop zone; bottom bar "Awaiting Northwind's approval · Request a change · Approve" | 4-stage tracker; Approve inside a card | ✗ | Build |
| Board resolution | Look | Navy head band, large "Received by SBC" tile, signature and company stamp on the page | White head, a line track, no signature or stamp | ✗ | Build |
| Registrations, Obligations | Layout | Number strip and table | Card grid, tabs in the card head, three-card rail | ✓ | C-0018 to C-0022 |
| Registrations, Obligations and their detail pages | Before-COI data | Everything "Not started" or "Upcoming"; the client fills a form | Granted and filed data shows before the company exists | ✗ | Build |
| Profile | Look | Left section menu and an editable form | Tab head and a read-only card | ✗ | Build |

## 4. Project lead, manager and admin portals

| Screen | Part | Old | New | | Cause |
|---|---|---|---|---|---|
| Today | Layout, greeting | Present | Same | ✓ | K-31, C-0040 |
| Today | Action queue counts | Soft grey boxes | Solid red, amber and blue boxes | ✗ | Build |
| Today (manager) | Team tasks | Checkboxes and half-circle icons | e-Filing grid, one status mark per row | ✓ | C-0031 |
| Today (admin) | Numbers | In compliance 7, Incorporating 7 | 8 and 6 | ✗ | Build |
| Work | Week calendar | Hours 9 AM to 6 PM with blocks | Day columns without hours | ✗ | Build |
| Work | "Plan my week" dialog | Hour grid | The dialog opens, but has no hour grid | ✗ | Build |
| Work | Board view, task drawer | Present | Present and working | ✓ | |
| Work (admin) | Page | Manager items: escalations, approvals, assignments; Status donut; Open by manager; By kind | Replaced by the project lead planner | ✗ | Build |
| Project leads (manager) | Week calendar | Hours with blocks | Missing | ✗ | Build |
| Managers (admin) | Page | Manager detail page | Same, plus a grid on top | ✓ | |
| Clients | Table | Plain table | e-Filing grid | ✓ | C-0007 |
| Client record | Head, timeline, steps | Present | Same | ✓ | |
| Client record | "What's this?" on each step row | Present | Moved to the step page | ✗ | Build |
| Step page, board resolution | Page | Present | Same | ✓ | |
| Documents | Page | Document pack: Ready / Needs inputs / Waiting, Part A and Part B tabs, MOA preview, "Download ready as .zip" | A plain documents explorer | ✗ | Build |
| Email | Page | Compose open first, "To" chips with suggestions, templates on the right | Inbox with three panes; compose behind a button | ✗ | Build. The agent's brief asked for that layout. |
| Vault | Page | Present | Same | ✓ | |
| Knowledge bank | Page | Folder shelves per area, "Upload to library" form, file list | The client's book tiles | ✗ | Build |
| Announcements, notifications, audit | Page | Present | Same, or changed by rule | ✓ | R-38, R-25, R-07 |
| Analytics | Page | Present | Same, plus more charts | ✓ | |
| Filings | Page | Donut and area bars, area chips, date tiles | Month chart, donut and grid. C-0016 asked for this on the client portal only. | ✗ | Build |
| Calendar | Page | See section 1 | See section 1 | ✗ | Build |
| Settings | Page | Photo, name, phone and role form; password fields; Outlook | Missing. The section exists but is not mounted. | ✗ | Build |
| Registrations | Page | Number strip, table grouped by area, five-card rail | Client card grid. C-0022 asked for this on the client portal only. | ✗ | Build |
| Obligations | Page | Number strip, table, rail with "Filed recently" | Client card grid. C-0018 to C-0020 asked for this on the client portal only. | ✗ | Build |
| Registration and obligation detail | Page | Present | Same | ✓ | |
| Profile | Page | Left menu and a form (name, designation, ICAI number, mobile) | A read-only card | ✗ | Build |

## 5. Super admin portal

| Screen | Old | New | | Cause |
|---|---|---|---|---|
| Overview: layout | Present | Same | ✓ | |
| Overview: numbers | 20 registrations open, 84% filed on time | 15 and 60% | ✗ | Build |
| Client record | Staff-style page: timeline and steps first | A company details tab first | ✗ | Build |
| Practice · Incorporation | Present | Same | ✓ | |
| Practice · Registrations matrix | Solid colour cells | Small tick marks | ✗ | Build |
| Practice · Compliances | Client-style calendar with filing names and a next-deadline card | Client-name chips and a "Stuck" list | ✗ | Build |
| Filings | Its own filings list page | The same page as Compliances | ✗ | Build |
| Risks | 10 risks, a row of kind chips, Remind on each row | Only 4 open risks show; tabs and a dropdown | ✗ | Build |
| Reports | The partner report page opens first | A report list opens first | ✗ | Build |
| Clients, Team, Growth, Settings, Step | Present | Same, sometimes with more | ✓ | |

## 6. Developer portal

| Screen | Old | New | | Cause |
|---|---|---|---|---|
| All 9 pages | Heavy cards and uptime bar blocks | Plain grids; uptime as a number | ✓ | C-0037, C-0038, C-0039 |
| Connections | A list on the left, detail on the right | A grid; detail opens under it | ✓ | C-0037 |

## 7. Count

About 60 parts are ✗. About 45 parts are ✓.

The fix is to restore the old look of each ✗ row from the old screen files. Start with the client calendar.
