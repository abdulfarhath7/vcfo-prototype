# Map from prototype screens to the real tool

The real tool is the Next.js app at `~/Documents/vcfo-suite`. All paths below are relative to that folder. Each path was checked on 27 Oct 2026.

Read this table before you write a row in `CHANGES.md`. Put the real file from this table in the row's "Real tool file" column. "None yet" means the real tool has no such screen. In that case write "new: <suggested path>".

Role names: the prototype says "project lead"; the real tool says `intern`.

## Client portal

Shell: `app/app/client/layout.tsx` → `src/components/client-portal/ClientPortalGate.tsx` → `src/components/client-portal/ClientPortalShell.tsx`. A signed-in client sees the `client-portal/pages/*` files. The "legacy" views show only without portal context.

| Prototype screen or card | Real route | Real view or component file |
|---|---|---|
| Home (page) | `app/app/client/overview/page.tsx` | `src/components/client-portal/pages/home/HomePage.tsx` (+ `useHome.ts`, `derive.ts`, `ui.tsx`; phone: `MobileHome.tsx`, `MobileCardsA.tsx`, `MobileCardsB.tsx`, `MobileParts.tsx`, `useMobileHome.tsx`) |
| Home · greeting and number strip | same | `src/components/client-portal/pages/home/CardsA.tsx` `GreetCard` |
| Home · "Your next action" bar | same | None yet in the portal home. Closest: `CardsA.tsx` `CurrentCard`. Unrouted: `src/components/client/overview/ClientNextAction.tsx` |
| Home · Timeline | same | `src/components/client-portal/pages/home/CardsB.tsx` `TimelineCard` (+ `pages/home/TimelineEditor.tsx`) |
| Home · Steps | same | `CardsB.tsx` `StepsCard` |
| Home · Needs from client | same | `CardsA.tsx` `NeedsCard` |
| Home · What is next | same | `CardsB.tsx` `NextCard` |
| Home · Important alerts | same | `CardsA.tsx` `AlertsCard` |
| Home · What SBC is doing | same | `CardsA.tsx` `SbcCard` |
| Home · Compliance by area | same | `CardsB.tsx` `AreaCard` |
| Home · Compliance status | same | `CardsB.tsx` `CompCard` (popup: `pages/home/Popups.tsx` `CompliancePopup`) |
| Home · Company IDs | same | `CardsB.tsx` `IdsCard` |
| Home · Recent documents | same | `CardsA.tsx` `DocsCard` |
| Home · Recent activity | same | `CardsA.tsx` `ActivityCard` |
| Home · Post-incorporation setup | same | `CardsB.tsx` `PostIncCard` |
| Home · Registrations card | same | `CardsB.tsx` `RegCard` |
| Incorporation page (COI card, This week, Timeline, charts) | `app/app/client/incorporation/page.tsx` | `src/components/client-portal/pages/incorporation/index.tsx` `IncorporationRoute` → `pages/incorporation/Landing.tsx` (+ `StatusBrief.tsx`, `TimelineEdit.tsx`). Legacy: `src/views/client/Incorporation.tsx` |
| Incorporation phase page | `app/app/client/incorporation/phase/[n]/page.tsx` | `pages/incorporation/PhasePage.tsx` (+ `StepTable.tsx`) |
| Incorporation step page | `app/app/client/incorporation/step/[stepId]/page.tsx` | `pages/incorporation/StepPage.tsx`. Legacy: `src/views/engagement/EngagementStepDetailClient.tsx` |
| Board resolution | `app/app/client/board-resolution/page.tsx` | `pages/incorporation/BoardPage.tsx` (+ `BoardLink.tsx`). Legacy: `src/views/client/BoardResolutionView.tsx` |
| Compliances · Calendar | `app/app/client/compliances/calendar/page.tsx` | `src/components/client-portal/pages/compliances/index.tsx` → `CalendarPage.tsx` (+ `CalendarMobile.tsx`, `MonthNav.tsx`, `YearView.tsx`, `TimelineView.tsx`, `DonutCard.tsx`, `CompDrill.tsx`, `ctx.tsx`, `bits.tsx`) |
| Compliances · Filings | `app/app/client/compliances/filings/page.tsx` | `pages/compliances/FilingsPage.tsx` (+ `Detail.tsx` `DetailModal`, `SidePanel`) |
| Compliances · Obligations list and detail | None yet | None yet. Nearest: `pages/compliances/Detail.tsx`. New: `pages/compliances/ObligationsPage.tsx`, `ObligationPage.tsx` |
| Registrations list and detail | None yet | None yet. Only `CardsB.tsx` `RegCard`. New: `pages/registrations/RegistrationsPage.tsx`, `RegistrationPage.tsx` |
| Documents | `app/app/client/documents/page.tsx` | `src/components/client-portal/pages/documents/DocumentsPage.tsx`, `Explorer.tsx`, `Drill.tsx`, `DocViewer.tsx`, `UploadDialog.tsx`, `Mobile.tsx`, `MobilePreview.tsx`, `States.tsx`, `shared-ui.tsx`. Legacy: `src/views/client/Documents.tsx` |
| Library | `app/app/client/library/page.tsx`; reader `app/app/client/library/[id]/page.tsx`, `app/app/client/learn/[slug]/page.tsx` | `pages/documents/library/LibraryPage.tsx`, `Reader.tsx`, `library-model.ts`. Legacy: `src/views/client/ask/ClientLibrary.tsx`, `ClientLibraryItem.tsx`, `ClientLearnTopic.tsx` |
| Credentials | `app/app/client/credentials/page.tsx` | `src/components/client-portal/pages/credentials/CredentialsPage.tsx` (+ `sheet-grid.tsx`, `id-tiles.tsx`, `IdsRevealDialog.tsx`, `OtpDialog.tsx`, `AccessLog.tsx`, `CrBot.tsx`, `use-credentials-state.ts`) |
| Team | `app/app/client/team/page.tsx` | `src/components/client-portal/pages/team/TeamPage.tsx` (via `pages/team/index.tsx`). Legacy: `src/views/client/ClientTeam.tsx` |
| Announcements | `app/app/client/announcements/page.tsx` | `pages/team/AnnouncementsPage.tsx`. Legacy: `src/views/announcements/AnnouncementsPage.tsx` |
| Notifications | `app/app/client/notifications/page.tsx` | `pages/team/NotificationsPage.tsx`. Legacy: `src/views/notifications/NotificationHistoryPage.tsx` |
| Audit | `app/app/client/audit/page.tsx` | `pages/team/AuditPage.tsx`. Legacy: `src/views/admin/AuditLog.tsx` |
| Settings and Profile | `app/app/client/settings/page.tsx` | `pages/team/SettingsPage.tsx` (+ `pages/team/common.tsx`). Legacy: `src/views/settings/AccountSettings.tsx` |
| Sidebar | all client routes | `src/components/client-portal/Sidebar.tsx` (keys in `src/components/client-portal/routes.ts`) |
| Top bar | all client routes | `src/components/client-portal/TopBar.tsx` (+ `SearchPalette.tsx`, `PortalIntro.tsx`, `IconTips.tsx`, `PortalProvider.tsx`) |
| Ask VCFO panel | mounted in the shell | `src/components/client-portal/AskLauncher.tsx` (+ `Visor.tsx`); provider `src/components/ask/AskProvider.tsx` |

## Project lead (`intern`)

Shell: `app/app/intern/layout.tsx` → `src/components/shell/AppShell.tsx`.

| Prototype screen or card | Real route | Real view or component file |
|---|---|---|
| Today | `app/app/intern/today/page.tsx` | `src/views/intern/Today.tsx` |
| Today · greeting | same | `src/components/intern/LeadHero.tsx` (wraps `DashHero`) |
| Today · practice strip | same | None yet. Closest: `LeadHero.tsx` stat strip, `src/components/intern/LeadWeekStrip.tsx` |
| Today · Action queue | same | `src/components/intern/LeadActionQueue.tsx` |
| Today · Inbox | same | None yet. Nearest: `src/components/intern/LeadFocusCard.tsx`, `src/views/admin/ApprovalsInbox.tsx` |
| Today · Waiting on client | same | `src/components/intern/LeadSideRail.tsx` ("Waiting on" section) |
| Today · Phase progress | same | `src/components/intern/LeadPhaseProgress.tsx` |
| Today · Clients × filings | same | None yet on Today. Matrix: `src/views/compliances/FilingsView.tsx` `PeriodMatrix` |
| Today · managers card | same | `src/components/intern/LeadManagersCard.tsx` |
| Work (list, board, timeline) | `app/app/intern/tasks/page.tsx` | `src/views/intern/MyWork.tsx` (rows: `src/components/intern/InternWorkRow.tsx`, `InternWorkCtaButton.tsx`, `InternWorkDenseLayout.tsx`, `LeadCompanyChip.tsx`, `intern-tones.ts`) |
| Work · planner | same | Partly: the timeline view in `MyWork.tsx` |
| Work · task drawer | same | None yet |
| Clients | `app/app/intern/clients/page.tsx` | `src/views/intern/Clients.tsx` (sub-nav `src/components/shell/InternClientsNav.tsx`) |
| Client page (record tabs) | `app/app/intern/engagements/[id]/page.tsx` | `src/views/admin/EngagementDetailClient.tsx` → `src/views/admin/EngagementDetail.tsx`; tabs `src/components/incorporation/InternOverviewProgress.tsx`, `src/components/incorporation/InternEngagementOverview.tsx`, `src/views/incorporation/intern-section-tab-strip.ts` |
| Step page | `app/app/intern/engagements/[id]/step/[stepId]/page.tsx` | `src/views/engagement/EngagementStepDetailClient.tsx` → `EngagementStepDetail.tsx` (forms `src/views/incorporation/MilestoneResponseForm*.tsx`) |
| Board resolution editor | `app/app/intern/engagements/[id]/board-resolution/page.tsx` | `src/views/intern/BoardResolutionEditor*.tsx`, `useBoardResolutionEditorState.tsx` |
| Documents | `app/app/intern/engagements/[id]/documents/page.tsx` | `src/views/engagement/DocPackViewClient.tsx` → `DocPackView.tsx` (+ `src/components/doc-pack/*`) |
| Email | `app/app/intern/mail/page.tsx` | `src/views/staff/ComposeMail.tsx` |
| Vault | `app/app/intern/vault/page.tsx` | `src/views/vault/DocumentVaultPage.tsx` |
| Knowledge bank | `app/app/intern/knowledge-bank/page.tsx` | `src/views/knowledge-bank/KnowledgeBankPage.tsx` (+ `KnowledgeBankPageSections.tsx`) |
| Announcements | `app/app/intern/announcements/page.tsx` | `src/views/announcements/AnnouncementsPage.tsx` |
| Notifications | `app/app/intern/notifications/page.tsx` | `src/views/notifications/NotificationHistoryPage.tsx` |
| Compliances · Calendar | `app/app/intern/compliances/calendar/page.tsx` | `src/views/compliances/CompliancePages.tsx` `ComplianceCalendarPage` → `ComplianceCalendarView.tsx` |
| Compliances · Filings | `app/app/intern/compliances/filings/page.tsx` | `CompliancePages.tsx` `FilingsPage` → `src/views/compliances/FilingsView.tsx` |
| Analytics | `app/app/intern/analytics/page.tsx` | `src/views/admin/Analytics.tsx` (+ `AnalyticsCharts.tsx`) |
| Audit | `app/app/intern/audit-log/page.tsx` | `src/views/admin/AuditLog.tsx` |
| Settings | `app/app/intern/settings/page.tsx` | `src/views/settings/AccountSettings.tsx` (+ `src/views/settings/account/*`, `AppearanceSettings.tsx`) |
| Staff sidebar | all staff layouts | `src/components/shell/RoleSidebar.tsx` (+ `SidebarNavGroup.tsx`, `SidebarComplianceMini.tsx`, `intern-sidebar.ts`, `nav-tones.ts`, `MotionActivePill.tsx`); shell `AppShell.tsx`; `src/components/noir/` |
| Staff top bar | all staff layouts | `src/components/shell/TopBar.tsx` (+ `NotificationsBell.tsx`, `AnnouncementsBell.tsx`, `CommandPalette.tsx`, `shell-crumbs.ts`, `PageBackButton.tsx`) |
| Staff Ask VCFO | all staff layouts | `src/components/ask/AskShellMount.tsx`, `AskPanel.tsx`, `AskLauncher.tsx` |

## Manager

The manager uses the lead files above for shared screens.

| Prototype screen or card | Real route | Real view or component file |
|---|---|---|
| Today | `app/app/manager/dashboard/page.tsx` | `src/views/admin/Dashboard.tsx` → `src/views/admin/DashboardSections.tsx` `AdminDashboardView` |
| Today · Team tasks | same | Closest: `src/components/staff/TeamTodosPanel.tsx` and the "Process / By project" section in `DashboardSections.tsx`. No table yet |
| Today · Task status | same | None yet as a card. Process section: `src/components/admin/PhaseTimeline.tsx` |
| Today · Waiting for your approval | same | `src/views/admin/DashboardApprovalsPanel.tsx`; page `app/app/manager/approvals/page.tsx` → `src/views/admin/ApprovalsInbox.tsx` |
| Today · upcoming filings | same | `src/views/admin/DashboardSecondaryRow.tsx` `AdminDashboardFilingsPanel` |
| Project leads | `app/app/manager/team/page.tsx` | `src/views/admin/Team.tsx` (+ `src/components/admin/CreateInternForm.tsx`) |
| People | `app/app/manager/people/page.tsx` | `src/views/admin/FirmPeople.tsx` (+ `src/views/admin/firm-people/*`) |
| Work and projects | `app/app/manager/projects/page.tsx` | `src/views/admin/Projects.tsx` (+ `ProjectsSections.tsx`) |
| Client page | `app/app/manager/projects/[slug]/page.tsx`, `engagements/[id]/page.tsx` | `src/views/admin/ProjectDetail.tsx`, `src/views/admin/EngagementDetailClient.tsx` |
| Step page | `app/app/manager/projects/[slug]/step/[stepId]/page.tsx` | `src/views/admin/StepDetailPage.tsx` (+ `src/components/admin/StepDetailContent*.tsx`, `StepWorkspaceRail.tsx`) |
| Documents | `app/app/manager/projects/[slug]/documents/page.tsx` | `src/views/engagement/DocPackViewClient.tsx` |
| Email, Vault, Knowledge bank, Announcements, Notifications, Calendar, Filings, Analytics, Audit, Settings | `app/app/manager/{mail,vault,knowledge-bank,announcements,notifications,compliances/calendar,compliances/filings,analytics,audit-log,settings}/page.tsx` | Same files as the lead rows; Vault is `src/views/admin/Vault.tsx` |

## Admin

| Prototype screen or card | Real route | Real view or component file |
|---|---|---|
| Today | `app/app/admin/dashboard/page.tsx` | `src/views/admin/FirmDashboard.tsx` |
| Today · practice cards | same | None yet. Only the `DashHero` strip in `FirmDashboard.tsx` |
| Today · Clients · where each one is | same | `src/views/admin/FirmProjectsPanel.tsx` |
| Today · Phase progress | same | None yet. `FirmDashboard.tsx` has a "Portfolio health" donut |
| Today · Managers table | same | `FirmDashboard.tsx` "Managers" section |
| Today · Needs your decision | same | None yet as a card. Approvals: `app/app/admin/approvals/page.tsx` → `src/views/admin/ApprovalsInbox.tsx` |
| Managers | `app/app/admin/people/page.tsx` | `src/views/admin/FirmPeople.tsx`, `src/views/admin/firm-people/manager-view.tsx` (+ `person-row.tsx`, `dialogs.tsx`, `use-firm-people.ts`) |
| Project leads | `app/app/admin/team/page.tsx` | `src/views/admin/Team.tsx` |
| Firm settings | `app/app/admin/settings/page.tsx` | None yet. The route shows `src/views/settings/AccountSettings.tsx` |
| Work | `app/app/admin/projects/page.tsx` (+ `new`, `[slug]`, `[slug]/edit`, `recycle-bin`) | `src/views/admin/FirmProjects.tsx`, `ProjectsNew.tsx`, `ProjectDetail.tsx`, `ProjectEdit.tsx`, `ProjectRecycleBin.tsx` |
| Ask VCFO sources and gaps | `app/app/admin/ask-vcfo/{sources,gaps}/page.tsx` | `src/views/admin/ask/AskSources.tsx`, `AskQuestionGaps.tsx` |

## Super admin

| Prototype screen or card | Real route | Real view or component file |
|---|---|---|
| Overview | `app/app/super/dashboard/page.tsx` | `src/views/super/SuperOverview.tsx` (+ `src/components/super/overview/SuperAttentionPanel.tsx`, `SuperWorkloadPanel.tsx`, `SuperSideRail.tsx`, `SuperPortfolioCharts.tsx`) |
| Clients | `app/app/super/projects/page.tsx`; detail `app/app/super/projects/[id]/page.tsx` | `src/views/super/SuperProjects.tsx`; `src/views/super/SuperProjectDetail.tsx` (+ `src/components/super/project/*`) |
| Practice areas (Incorporation, Registrations, Compliances) | None yet | None yet. The super sidebar links to `app/app/admin/compliances/{calendar,filings}/page.tsx` |
| Team | None yet | None yet. The super sidebar links to `app/app/admin/people/page.tsx` |
| Risks | None yet | None yet. Closest: `SuperAttentionPanel.tsx` |
| Growth, Reports | None yet | None yet |
| Firm settings | `app/app/super/settings/page.tsx` | None yet. The route shows `src/views/settings/AccountSettings.tsx` |

## Developer console

| Prototype screen | Real route | Real file |
|---|---|---|
| Connections, Messages, Jobs, Logs, Deploys, Access, Data and costs, Audit | None yet | None yet. Only `app/api/outlook/connect` exists. New: `app/app/dev/*` |

## Shared parts, tokens and CSS

| Part | Path |
|---|---|
| Greeting card | `src/components/dash/DashHero.tsx` (+ `DashHeroSettings.tsx`) |
| Section card, donut, legend row | `src/components/dash/DashSection.tsx` (`DashDonut`, `DashLegendRow`) |
| Stat card | `src/components/dash/StatCard.tsx` |
| Data table | `src/components/dash/DashDataTable.tsx` |
| Filter chip | `src/components/dash/DashFilterChip.tsx` |
| Icon chip and tones | `src/components/common/IconChip.tsx` |
| Buttons | `src/components/ui/button-variants.ts`, `src/components/ui/button.tsx` |
| Badges | `src/components/ui/badge-variants.ts`, `src/components/ui/badge.tsx` |
| Design tokens | `app/globals.css`, `docs/design/design-tokens.json`, `tailwind.config.ts`, `docs/design/TOKENS.md`, `scripts/design-tokens-css.mjs` |
| Client portal CSS | Edit `src/components/client-portal/css-src/`; `scripts/cp-css.mjs` builds `src/components/client-portal/css/`; order in `src/components/client-portal/portal-css.ts` |
