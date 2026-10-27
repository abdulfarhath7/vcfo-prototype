# Change register

One row for each change in the prototype. Add rows at the end. Do not delete or rewrite a row. To correct a row, add a new row that names the old ID.

Language: ASD-STE100. One fact per cell. 20 words or fewer per sentence. Active voice.

Real tool paths are relative to `~/Documents/vcfo-suite`. Find them in `docs/REAL-TOOL-MAP.md`. "new:" means the real tool has no such file yet.

Status: ✓ done · ◐ partly · ✗ not done. A row starts as ✗. Set ✓ only after you check the screen in a browser.

## Columns

| Column | Content |
|---|---|
| ID | C-0001, C-0002 … in order |
| Date | Date of the request |
| Portal | Client, Lead, Manager, Admin, Super admin, Developer, All |
| Screen | The page |
| Component | The card or part |
| Before | What the old prototype shows |
| After | What the new prototype shows |
| Rule | Rule numbers from `docs/RULES.md` |
| Prototype file | Path in this project |
| Real tool file | Path in the real tool |
| Status | ✓ ◐ ✗ |

## Round 5 · owner review of 27 Oct 2026

| ID | Date | Portal | Screen | Component | Before | After | Rule | Prototype file | Real tool file | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| C-0001 | 27 Oct 2026 | All | All | Every card type | A card change applied to one portal only. | A change to a card applies to every portal that shows the card. | R-31 | `src/components/cards/*` | All matching files in `REAL-TOOL-MAP.md` | ✓ |
| C-0002 | 27 Oct 2026 | All | All | Filler text | Cards show lines such as "Nothing is waiting on Northwind this week". | Remove these lines. Show an empty card body only when the list is empty. | R-05 | `src/components/cards/*` | `src/components/client-portal/pages/incorporation/Landing.tsx` and others | ✓ |
| C-0003 | 27 Oct 2026 | All | All | Bot mascot | A robot figure shows in This week, Ask VCFO, the Library, Credentials and the launcher. | Remove the robot figure everywhere. Ask VCFO is a text button. | R-04 | `src/components/shell/AskButton.tsx` | `src/components/client-portal/AskLauncher.tsx`, `Visor.tsx`, `pages/credentials/CrBot.tsx`, `src/components/ask/AskLauncher.tsx` | ✓ |
| C-0004 | 27 Oct 2026 | All | Detail pages | Back link | Detail pages show a back link, for example "← Obligations". | Remove every back link. | R-09 | `src/screens/**/*Detail*.tsx` | `src/components/shell/PageBackButton.tsx` and its users | ✓ |
| C-0005 | 27 Oct 2026 | All | All | Icons | Icons are heavy and mixed. | Use Lucide icons with a 1.5 stroke and plain glyphs. | R-27 | `src/components/icons.ts` | `src/components/common/IconChip.tsx`, shell sidebars | ✓ |
| C-0006 | 27 Oct 2026 | All | All | Main buttons | Main buttons use navy-action #1F3B5C or blue #2563A8. | Main buttons use the sidebar navy #15263B. Hover is #1B3049. | R-12 | `src/components/ui/button.tsx` | `src/components/ui/button-variants.ts` | ✓ |
| C-0007 | 27 Oct 2026 | All | All | Data tables | Tables are lists of cards or plain rows. | Tables are e-Filing grids: navy header, grid lines, zebra rows, page numbers. | R-07, R-08 | `src/components/cards/DataGrid.tsx` | `src/components/dash/DashDataTable.tsx` | ✓ |
| C-0008 | 27 Oct 2026 | All | All | Expand toggles | A chevron sits in a bordered box. | A plain chevron without a box. | R-24 | `src/components/ui/Chevron.tsx` | `src/components/client-portal/pages/incorporation/Landing.tsx`, `pages/home/CardsB.tsx` | ✓ |
| C-0009 | 27 Oct 2026 | All | All | Info icons next to buttons | An info icon explains the timeline Edit button. | Remove info icons next to buttons and titles. | R-06 | `src/components/cards/SectionCard.tsx` | `src/components/client-portal/pages/home/CardsB.tsx` `TimelineCard` | ✓ |
| C-0010 | 27 Oct 2026 | All | Home | Greeting card | The greeting differs between portals. | One greeting card on every portal. | R-17, R-18 | `src/components/cards/GreetingCard.tsx` | `src/components/dash/DashHero.tsx`, `src/components/client-portal/pages/home/CardsA.tsx` `GreetCard`, `src/components/intern/LeadHero.tsx` | ✓ |
| C-0011 | 27 Oct 2026 | Client | Home | Number strip | The icon tile touches the label and the number. | Put 12 px between the icon tile and the text. | R-18 | `src/components/cards/NumberStrip.tsx` | `src/components/client-portal/pages/home/CardsA.tsx` `GreetCard` | ✓ |
| C-0012 | 27 Oct 2026 | Client | Home | "Your next action" bar | A bar shows the next action with a button. | Remove the bar. Do not show such bars on any page. | R-38 | `src/screens/client/HomeScreen.tsx` | `src/components/client-portal/pages/home/HomePage.tsx`, `src/components/client/overview/ClientNextAction.tsx` | ✓ |
| C-0013 | 27 Oct 2026 | Client | Home | Important alerts, urgent row | The urgent row has a red fade on the left half. | The full urgent row has a soft red tint. | R-20 | `src/components/cards/AttentionList.tsx` | `src/components/client-portal/pages/home/CardsA.tsx` `AlertsCard`; `CardsB.tsx` `NextCard` | ✓ |
| C-0014 | 27 Oct 2026 | Client | Home | Recent documents | All file badges are red. | Each file type has its own badge colour. | R-26 | `src/components/ui/FileBadge.tsx` | `src/components/client-portal/pages/home/CardsA.tsx` `DocsCard`; `pages/documents/Explorer.tsx` | ✓ |
| C-0015 | 27 Oct 2026 | Client | Sidebar | Compliances group | Order: Calendar, Filings, Obligations. | Order: Obligations, Calendar, Filings. | R-33 | `src/components/shell/Sidebar.tsx` | `src/components/client-portal/Sidebar.tsx`, `routes.ts`; `src/components/shell/RoleSidebar.tsx` | ✓ |
| C-0016 | 27 Oct 2026 | Client | Filings | Page layout | Year, period, Export and Calendar controls sit above the page. The list is a card list. | Chart top left. Progress bars top right. Filters under them. The list is an e-Filing grid. | R-07, R-08 | `src/screens/client/FilingsScreen.tsx` | `src/components/client-portal/pages/compliances/FilingsPage.tsx`; `src/views/compliances/FilingsView.tsx` | ✓ |
| C-0017 | 27 Oct 2026 | Client | Filings | Period filter | Monthly, Quarterly and Annual sit above the page. | Put Monthly, Quarterly, Annual, year and Export in the grid head bar. | R-08, R-11 | `src/components/cards/DataGrid.tsx` | `src/components/client-portal/pages/compliances/FilingsPage.tsx` | ✓ |
| C-0018 | 27 Oct 2026 | Client | Obligations | Number strip | A strip shows Overdue, Due in 15 days, Waiting on client, Filed, Upcoming. | Remove the strip. | R-05 | `src/screens/client/ObligationsScreen.tsx` | new: `src/components/client-portal/pages/compliances/ObligationsPage.tsx` | ✓ |
| C-0019 | 27 Oct 2026 | Client | Obligations | List | Obligations show as a table list. "By frequency / By law" sits above the table. | Show obligations as a grid of cards. Put "By frequency / By law" in the card head. | R-11 | `src/screens/client/ObligationsScreen.tsx` | new: `src/components/client-portal/pages/compliances/ObligationsPage.tsx` | ✓ |
| C-0020 | 27 Oct 2026 | Client | Obligations | Right rail | Four cards: progress flow, due in 15 days, waiting on client, filed recently. | Three cards: Due in the next 15 days, Waiting on client, Progress flow. | R-05 | `src/screens/client/ObligationsScreen.tsx` | new: `src/components/client-portal/pages/compliances/ObligationsPage.tsx` | ✓ |
| C-0021 | 27 Oct 2026 | Client | Obligation and registration pages | Thread | Only done and current steps show. | Show upcoming steps faded, without dates. | R-23 | `src/components/cards/Thread.tsx` | new: `src/components/client-portal/pages/compliances/ObligationPage.tsx`, `pages/registrations/RegistrationPage.tsx` | ✓ |
| C-0022 | 27 Oct 2026 | Client | Registrations | Page layout | Registrations use a grouped list with a number strip. | Use the Obligations layout: card grid, tabs in the head, three-card rail. | R-11, R-31 | `src/screens/client/RegistrationsScreen.tsx` | new: `src/components/client-portal/pages/registrations/RegistrationsPage.tsx` | ✓ |
| C-0023 | 27 Oct 2026 | Client | Incorporation | This week | The owner chip runs into the task text. | Put a 12 px gap between the owner chip and the text. | R-14 | `src/components/cards/WeekList.tsx` | `src/components/client-portal/pages/incorporation/Landing.tsx` | ✓ |
| C-0024 | 27 Oct 2026 | Client | Incorporation | Timeline status | The in-progress status shows two circles. | Show one blue clock circle. | R-22 | `src/components/cards/GanttTimeline.tsx` | `src/components/client-portal/pages/incorporation/Landing.tsx` | ✓ |
| C-0025 | 27 Oct 2026 | Client | Documents and Vault | Explorer | The tree and the preview flicker and sometimes stick. | The tree and the preview change without flicker. | R-41 | `src/screens/shared/DocumentsExplorer.tsx` | `src/components/client-portal/pages/documents/Explorer.tsx`; `src/views/vault/DocumentVaultPage.tsx`; `src/views/admin/Vault.tsx` | ✓ |
| C-0026 | 27 Oct 2026 | Client | Team | Contact buttons | The contact buttons run into each other. | Put an 8 px gap between the buttons. | R-19 | `src/screens/client/ProfileScreen.tsx` | `src/components/client-portal/pages/team/TeamPage.tsx` | ✓ |
| C-0027 | 27 Oct 2026 | Client | Team | Page | Team is its own page and sidebar item. | Move Team into Profile as one section. Remove the Team page and sidebar item. | R-42 | `src/screens/client/ProfileScreen.tsx` | `src/components/client-portal/pages/team/TeamPage.tsx`, `SettingsPage.tsx`, `src/components/client-portal/Sidebar.tsx` | ✓ |
| C-0028 | 27 Oct 2026 | Client | Profile · Team | Layout | Each SBC person has a separate card. | One card for the SBC team. One large card for the client's people. | R-42 | `src/screens/client/ProfileScreen.tsx` | `src/components/client-portal/pages/team/TeamPage.tsx` | ✓ |
| C-0029 | 27 Oct 2026 | Client | Audit | Page | A bar chart sits above an event list. | Remove the bar chart. Show the events in an e-Filing grid. | R-07 | `src/screens/shared/AuditScreen.tsx` | `src/components/client-portal/pages/team/AuditPage.tsx`; `src/views/admin/AuditLog.tsx` | ✓ |
| C-0030 | 27 Oct 2026 | Lead | All | Cards with a client twin | Lead cards look different from the client cards. | Lead cards use the client card components. | R-31 | `src/components/cards/*` | `src/views/intern/Today.tsx`, `src/components/intern/*` | ✓ |
| C-0031 | 27 Oct 2026 | Manager | Today | Team tasks | The table breaks. A half-circle icon and a checkbox show together. | Show the tasks in an e-Filing grid. Show one status mark only. | R-07, R-13 | `src/screens/manager/TodayScreen.tsx` | new card in `src/views/admin/DashboardSections.tsx`; `src/components/staff/TeamTodosPanel.tsx` | ✓ |
| C-0032 | 27 Oct 2026 | Manager | Client page | Record tabs | Registrations, Obligations and other tabs open another page. | The tabs switch in place. | R-36 | `src/screens/staff/ClientRecordScreen.tsx` | `src/views/admin/ProjectDetail.tsx`, `src/views/admin/EngagementDetail.tsx`, `src/views/incorporation/intern-section-tab-strip.ts` | ✓ |
| C-0033 | 27 Oct 2026 | Admin | All | Colours | Admin colours differ from the other portals. | Admin uses the shared tokens only. | R-03, R-31 | `src/styles/tokens.css` | `src/views/admin/FirmDashboard.tsx`, `FirmProjectsPanel.tsx` | ✓ |
| C-0034 | 27 Oct 2026 | Admin | Today | Managers table | The table breaks like the manager Team tasks table. | Show the managers in an e-Filing grid. | R-07 | `src/screens/admin/TodayScreen.tsx` | `src/views/admin/FirmDashboard.tsx` "Managers" section | ✓ |
| C-0035 | 27 Oct 2026 | Super admin | All | Tables and chips | Tables and chips differ from the other portals. | Use the e-Filing grid and the shared chips. | R-07, R-13 | `src/screens/super/*` | `src/views/super/SuperOverview.tsx`, `SuperProjects.tsx`, `src/components/super/*` | ✓ |
| C-0036 | 27 Oct 2026 | Super admin | All | Layout and spacing | Card sizes and gaps differ from the client and lead portals. | Use the shared page frame, card sizes and gaps. | R-15, R-31 | `src/screens/super/*` | `src/views/super/*` | ✓ |
| C-0037 | 27 Oct 2026 | Developer | All | Every card | Cards, uptime bars and buttons look heavy and unattractive. | Redesign every page in the e-Filing style: plain grids, quiet buttons, no uptime bar blocks. | R-01, R-07, R-12 | `src/screens/dev/*` | new: `app/app/dev/*` | ✓ |
| C-0038 | 27 Oct 2026 | Developer | All | Sidebar | The sidebar scrolls away with the page. | The sidebar stays fixed. | R-39 | `src/components/shell/Sidebar.tsx` | new: `app/app/dev/layout.tsx` | ✓ |
| C-0039 | 27 Oct 2026 | Developer | All | Content | Pages show content the developer does not need. | Keep only connections, jobs, logs, deploys, access, data and costs, audit. Remove extra cards. | R-05 | `src/screens/dev/*` | new: `app/app/dev/*` | ✓ |
| C-0040 | 27 Oct 2026 | Manager | Today | Greeting card | The manager greeting differs from other portals. | Use the shared greeting card. | R-17 | `src/components/cards/GreetingCard.tsx` | `src/views/admin/DashboardSections.tsx`, `src/components/dash/DashHero.tsx` | ✓ |
