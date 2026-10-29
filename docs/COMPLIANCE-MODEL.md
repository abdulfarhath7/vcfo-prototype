# Compliances: statutory and non-statutory (owner request, 29 Oct 2026)

Written in ASD-STE100. One fact in each sentence. This file is the source of truth for the change. The build of the real VCFO Suite follows it.

## 1. What the owner asked for

| No. | Request |
|---|---|
| O-1 | Compliances has three parts: Obligations, Calendar, Filings. |
| O-2 | Obligations has two categories: Statutory and Non-statutory. |
| O-3 | Non-statutory items are tasks. An admin or a manager sets a start date, an end date and an urgency. |
| O-4 | Each non-statutory task has role access: firm only, client only, or both. |
| O-5 | An admin or a manager can add a new non-statutory task. |
| O-6 | Statutory items are the real deadlines that are already in the compliance calendar. |
| O-7 | A click on a statutory item opens its own page. The page shows what the client gave, what the lead filled in, the progress, and the exact steps on the right side. |
| O-8 | The Calendar gets a filter: All, Statutory, Non-statutory. |
| O-9 | Filings gets the same filter. |
| O-10 | Use the two owner documents: the activity master (spreadsheet) and the registration and compliance manual. |
| O-11 | Keep documentation of every change, so the build team can build the real product from the prototype. |

## 2. Sources

| Source | What it gives |
|---|---|
| `SBC_TRACK_Consolidated_Compliance_Activity_Master.xlsx`, sheet "Consolidated Activity Master" | 31 activities (ACT-001 to ACT-031): classification, frequency, module, owner role, reviewer role, notification days, workflow, notes |
| Same file, sheet "Developer Requirements" | 22 requirements (DR-01 to DR-22). Section 7 maps each one to the prototype. |
| Same file, sheets "Deduplication Mapping" and "Read Me" | Merge rules and cautions: blank dates are unconfigured; reminder days are defaults, not law |
| `SBC_Registration_Compliance_Manual_4.docx` | 15 SOPs and the due-date tables (monthly, quarterly, annual) with the penalty for each |

The data lives in `src/data/activity-master.ts`. Every row names its source.

## 3. Data model

### 3.1 Activity (the master, DR-01)

One record per activity. Fields: `id`, `name`, `kind`, `group`, `frequency`, `module`, `area`, `dueRule`, `penalty`, `applies`, `ownerRole`, `reviewerRole`, `notifyDays`, `visibility`, `note`, `confirm`, `from`.

- `kind` is one of: Statutory, Non-statutory, Policy-based, Configurable (DR-03).
- `group` is what the screens filter on. Statutory and Policy-based are in "statutory". Non-statutory and Configurable are in "non-statutory" unless an entity sets them otherwise.
- `notifyDays` defaults by frequency (DR-21): weekly 2, bi-weekly 3, monthly 5, quarterly 10, half-yearly 15, yearly 30, one-time 5.
- `confirm` marks a value the owner must confirm before production reminders go live (DR-19, DR-22).

Counts: 43 activities. 32 are in the statutory group (21 from the master, with ACT-015 split into AOC-4 and MGT-7, and 11 from the manual only). 11 are in the non-statutory group.

### 3.2 Occurrence (a task instance, DR-02, DR-04)

One record per activity, per entity, per period. Fields:

| Field | Meaning |
|---|---|
| `activityId` | The master row |
| `clientId` | The entity |
| `period` | "Sep 2026", "Q2 2026-27", "FY 2025-26" |
| `startDate` | Work starts (DR-05: the preparation date). Required for non-statutory tasks. |
| `dueDate` | Statutory: the legal due date. Non-statutory: the end date the admin or manager sets. |
| `urgency` | Non-statutory only: Low, Medium, High, Critical |
| `visibility` | firm, client or both. Statutory is always both. |
| `owner`, `reviewer` | People. Defaults come from the activity's roles. |
| `stage` | A workflow stage (3.3) |
| `steps` | The checklist, each step with who, when, and evidence |
| `clientInputs` | What the client must give: label, required or optional, status (asked, received, accepted, sent back), file, date |
| `filledBySbc` | What the lead fills in: label, value, who, when (for example tax paid, challan number, ARN, filed on) |
| `reminders` | The schedule from 3.4, with sent and acknowledged times |
| `history` | Audit trail entries (DR-16) |

### 3.3 Workflow and the six status words (DR-12)

The stages are: Not started, Ready to start, In progress, Waiting for client, Submitted for review, Rework required, Completed, Not applicable.
The chips still show only the six status words (RULES.md R-13):

| Chip word | From stages |
|---|---|
| Not started | Not started, Ready to start |
| In progress | In progress, Submitted for review, Rework required |
| Waiting | Waiting for client |
| Done | Completed |
| Due soon | Derived: due within the activity's `notifyDays` and not completed |
| Overdue | Derived: past the due date and not completed (DR-06) |

"Not applicable" hides the row. A "Show not applicable" toggle shows it again.
The stage name shows on the detail page and in the progress list, never in the chip.

### 3.4 Reminders (DR-07 to DR-10, DR-21)

Each occurrence gets six reminders. All of them are editable per entity and per activity.

| Reminder | When | To |
|---|---|---|
| First reminder | Due date − `notifyDays` | Owner |
| Due soon | Due date − ⅓ of `notifyDays` (at least 1 day) | Owner and reviewer |
| Due today | Due date | Owner and reviewer |
| Overdue | Every day after the due date | Owner |
| Escalation 1 | Due date + 2 days | Reviewer or manager |
| Escalation 2 | Due date + 5 days | Compliance admin |

Reminders go to the bell (R-38). They never show as a bar on a page.
No reminder goes live until the entity, applicability, owner, preparation date and due date are set (DR-22).

### 3.5 Roles (DR-11)

| Role | Portal | Can |
|---|---|---|
| Super admin | super | Everything, including the activity master |
| Admin | admin | Create, assign and edit any task. Set reminder rules. Confirm activities. |
| Manager | manager | Create and assign non-statutory tasks for their clients. Review and approve. |
| Project lead | lead | Work on tasks, change status, upload evidence, submit for review. Cannot create non-statutory tasks. |
| Client | client | See statutory items and the non-statutory tasks shared with the client. Upload what is asked. Comment. |

## 4. Screens

### 4.1 Obligations (staff: lead, manager, admin; and super admin › Practice)

- **S-1.** A segmented switch at the top of the list card: **Statutory** (default) · **Non-statutory** · **All**. Each label carries its count.
- **S-2.** Statutory keeps today's list: grouped "By filing" with the date band, area pill and "N of M filed". It also keeps "By frequency" and "By law". Each row opens the statutory detail page (4.2).
- **S-3.** Non-statutory lists tasks in a T1 table with these columns: Task (name + client), Start, End, Urgency, Visibility, Owner, Status. Rows group by end-date week: This week, Next week, Later, Done.
- **S-4.** Admin and manager see a primary button "New task" in the card head. Leads do not.
- **S-5.** "New task" opens a short form dialog (M2) with these fields:
  - Activity (a select of the 11 non-statutory activities, plus "Other…" with a name field)
  - Client
  - Start date and End date
  - Urgency (Low, Medium, High, Critical)
  - Visible to (Firm only, Client only, Both)
  - Owner and Reviewer (defaults come from the activity's roles)
  - Repeats (one-time, weekly, bi-weekly, monthly, quarterly, yearly)
  - Remind before (days, default from the activity)

  Save adds the row and shows the A1 toast "Task created".
- **S-6.** Urgency shows as a 88 px neutral pill with signal bars (1 to 4). The colour stays neutral: red stays for late work only (R-03). "Critical" bars use `warn-mid`.
- **S-7.** Visibility shows as an icon and a word: Firm, Client, Both.
- **S-8.** The number strip counts follow the selected category.

### 4.2 Statutory detail page (staff and client)

The page has a header card and two columns.

- **D-1. Header.**
  - A date tile and the name ("GSTR-3B · September 2026").
  - Client tile and name, regulator pill, a "Statutory" tag, and the status chip.
  - Days to due, or days overdue.
  - Primary action by role: lead "Submit for review", manager "Approve", client "Upload".
- **D-2. Left column, in this order:**
  1. **From the client.** Every client input, with its status (Asked, Received, Accepted, Sent back), its file badge, its date and who sent it. The client can upload in place. Staff can accept or send back.
  2. **Filled by SBC.** The values the lead entered, with who and when: period, taxable value, tax paid, challan number, ARN or acknowledgement number, filed on. Values are read-only once filed.
  3. **Reminders.** The six reminders from 3.4, each with its date and whether it was sent or acknowledged. Admin and manager can change the days.
  4. **Rule.** Due rule, applicability and penalty, from the manual. A `confirm` note shows only to admin and super admin.
  5. **Activity.** The audit trail: who did what and when.
- **D-3. Right column: Progress.**
  - A vertical step list in the ST5 style. The steps are: Data from client → Prepared → Submitted for review → Approved → Filed or paid → Acknowledged. Each step has who, when and evidence.
  - Under the list: the current workflow stage, the owner and reviewer with avatars, and "Previous periods" (the last 6 periods, filed on time or late).
- **D-4.** The client sees the same page without the internal parts: no reviewer notes, no `confirm` notes, no escalation reminders.

### 4.3 Non-statutory detail page

The same layout as 4.2, with these differences:

- The header shows Start, End, Urgency and Visibility.
- The left column shows **Checklist** (subtasks), **Attachments**, **Comments**, **Reminders** and **Activity**.
- The right column shows the progress steps of the workflow, plus owner and reviewer.

### 4.4 Calendar (client and staff)

- **C-1.** A segmented filter in the calendar head: **All** · **Statutory** · **Non-statutory**, with counts.
- **C-2.** Statutory events keep the solid regulator swatch.
- **C-3.** Non-statutory tasks show on their end date. They have a hollow 8 px square in `ink-2`. On hover they show "Starts 12 Oct" and the urgency.
- **C-4.** The filter applies to the month, year and timeline views, and to the rail ("Next deadline", "Coming up").

### 4.5 Filings (client and staff)

- **F-1.** The same segmented filter: **All** · **Statutory** · **Non-statutory**.
- **F-2.** Non-statutory rows are completed tasks with their deliverable (for example "MPR · September" with the report file).
- **F-3.** The counts, donut and regulator bars follow the filter.

### 4.6 Client portal

- **K-1.** Client Obligations shows Statutory and Non-statutory, but only tasks with visibility "client" or "both".
- **K-2.** The client cannot create tasks. The client can upload and comment.

## 5. Sample data (prototype only)

- Each staff client gets 3 to 5 non-statutory tasks, built from the master's non-statutory rows. They have real-looking start and end dates around 16 Oct 2026.
- Visibility and urgency are mixed, so every filter and tag has rows to show.
- Statutory occurrences keep today's data. Each one gets `clientInputs`, `filledBySbc` and `reminders`, so the detail page is complete.
- All sample values are marked as sample data in code comments. No fake "Paid" or "Filed" without a matching date and evidence row.

## 6. Open points for the owner (from `confirm`)

| Activity | Point |
|---|---|
| ACT-011 Advance tax | The manual gives Q4 as 31 Mar. The Act sets 15 Mar. The prototype uses 15 Mar. |
| ACT-012 TDS return | The manual gives Q2 as 30 Oct. The rule is 31 Oct. "Form 131" wording to confirm. |
| ACT-022 APR | Meaning and applicability to confirm. |
| ACT-028 PAS-6 | The master says yearly. The rule is half-yearly. The prototype uses half-yearly. |
| ACT-009 EDF and MPR | Meaning to confirm. |

## 7. Developer requirements → prototype

| DR | Requirement | Prototype |
|---|---|---|
| 01 | Central activity master | `src/data/activity-master.ts` |
| 02 | Entity-wise configuration | Occurrence fields (3.2) |
| 03 | Statutory vs non-statutory | `kind` and `group`; filters on Obligations, Calendar and Filings |
| 04 | Recurring tasks | "Repeats" in the New task form |
| 05 | Start and due dates kept apart | `startDate` and `dueDate` |
| 06 | Days to start and days to due | Detail header; derived Due soon and Overdue |
| 07–10 | Notifications, timing, controls, escalation | Reminders card (3.4); the bell |
| 11 | Role-based access | 3.5; New task for admin and manager only |
| 12 | Task workflow | 3.3 |
| 13 | Evidence and comments | From the client, Filled by SBC, Attachments, Comments |
| 14 | Dashboard filters | Category switch plus the existing client, area and status filters |
| 15 | Calendar and list views, export | Calendar month, year and timeline; list; Export |
| 16 | Audit trail | Activity card |
| 17 | Holidays and jurisdiction | Not in the prototype. Noted for the real build. |
| 18 | Duplicate handling | The master's dedup sheet is applied in the data file |
| 19 | Unconfirmed forms | Section 6; `confirm` shows to admin |
| 20 | Security and retention | Real build only |
| 21 | Default reminders | `notifyDays` by frequency |
| 22 | Blank dates are unconfigured | No reminder without dates and owner |

## 8. Change log

Each build step adds a row here and a row in `docs/CHANGES.md`. Each row names the real-tool file from `docs/REAL-TOOL-MAP.md`.

| Date | Change | Files |
|---|---|---|
| 29 Oct 2026 | Activity master from the two owner documents; this model | `src/data/activity-master.ts`, `docs/COMPLIANCE-MODEL.md` |
| 29 Oct 2026 | Sample occurrences: 29 staff tasks, 6 client tasks, the statutory-to-activity map, the detail builder (C-0124) | `src/data/compliance-tasks.ts` |
| 30 Oct 2026 | Staff Obligations: switch, task table, New task (C-0125) | `src/screens/staff/ObligationsScreen.tsx`, `ns-parts.tsx`, `src/components/ui/TaskMarks.tsx` |
| 30 Oct 2026 | Statutory detail page for staff and client (C-0126) | `src/screens/shared/StatDetail.tsx`, `detail-parts.tsx` |
| 30 Oct 2026 | Non-statutory detail page and its routes (C-0127) | `src/screens/shared/TaskDetail.tsx`, `app/(*)/…/obligations/tasks/[id]` |
| 30 Oct 2026 | Calendar and Filings filter (C-0128) | staff, client and super Calendar and Filings screens, `src/data/compliance-tasks-views.ts` |
| 30 Oct 2026 | Client Obligations with both categories (C-0129) | `src/screens/client/ObligationsScreen.tsx` |
| 30 Oct 2026 | Review fixes: activity list, plain dates, plurals, icons (C-0130) | `ns-parts.tsx`, `StatDetail.tsx`, `detail-parts.tsx` |

## 9. Build notes for the real product

- Tasks made in the New task form live in page state only. They have no detail page in the prototype.
- Overdue staff rows show the last due date that passed. Done rows show the period before the next due date.
- The calendar judges tasks on its own date (8 Oct on the client calendar).
- In the calendar, the donut uses its four states. A done task counts as "Filed".
- "On time vs late" on Filings uses fixed sample data. It does not follow the filter.
- Super admin has no Obligations list. Its Practice · Compliances page is the calendar, and it has the filter.

## 10. Check of each spec item

Checked on 30 Oct 2026 at 1440 px light, 1440 px dark and 390 px light. Every route returned 200 with no page errors and no sideways scroll. Click scripts are in the session scratchpad.

| Spec | Result | How it was checked |
|---|---|---|
| S-1 | ✓ | Manager, lead and admin lists in each category; counts follow the client filter. |
| S-2 | ✓ | By filing, By frequency and By law still work; rows open the detail page. |
| S-3 | ✓ | Task table grouped by end week; rows open the task page; phone keeps Task, End and Status. |
| S-4 | ✓ | Click script: no New task button for the lead, one for the manager and the admin. |
| S-5 | ✓ | Click script: empty save shows errors, Esc closes, plain dates, Enter saves, toast "Task created", row and counts update. |
| S-6 | ✓ | Urgency pill with bars on every task row; Critical bars in warn-mid. |
| S-7 | ✓ | Visibility tag with icon and word on every task row. |
| S-8 | ✓ | Strip labels and counts change with the category. |
| D-1 | ✓ | Header on manager, lead and admin pages; the role action changes steps and shows a toast. |
| D-2 | ✓ | Click script: accept, send back, edit reminder days; confirm note on the admin page only. |
| D-3 | ✓ | Progress steps with who, when and evidence; stage, owner, reviewer; six previous periods. |
| D-4 | ✓ | Click script on the client page: no escalations, reviewer note, confirm note or staff controls. |
| 4.3 | ✓ | Click script: tick a checklist item, add a comment, approve; the firm-only client task returns 404. |
| C-1 | ✓ | Staff, super and client calendars show the filter with counts. |
| C-2 | ✓ | Statutory events keep the regulator swatch. |
| C-3 | ✓ | Hollow square on the end date; hover shows the start and urgency; click opens the task page. |
| C-4 | ✓ | Month, year and timeline views, donut, Next deadline and Coming up follow the filter. |
| F-1 | ✓ | Staff, client and super Filings show the filter. |
| F-2 | ✓ | Done tasks list with their file and an Internal area. |
| F-3 | ✓ | Tiles, donut and area bars follow the filter. |
| K-1 | ✓ | Client list shows 5 tasks; the firm-only task is absent. Before the certificate the page is unchanged. |
| K-2 | ✓ | No New task button and no reviewer on the client pages. |
