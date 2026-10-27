# Carry-over from the old prototype

The real tool was built from an earlier copy of the old prototype. The old prototype then changed in rounds 1 to 4 (22 to 26 Oct 2026). This file lists those changes by theme, so a port session can bring the real tool up to date.

Source of each change: the audit row numbers in `reference/PROTOTYPE-AUDIT.md`. Real tool paths are relative to `~/Documents/vcfo-suite` (see `docs/REAL-TOOL-MAP.md`).

Status:
- **Port**: the change is still wanted. Check the real file. Port it if the real tool does not have it.
- **Superseded**: a round 5 row in `CHANGES.md` replaces the change. Port the round 5 row instead.
- **Prototype only**: the change concerns the prototype or the landing page only.

Rows are in ASD-STE100. Do not port a superseded change.

| No. | Theme | What changed in the old prototype | Audit rows | Real tool file | Status |
|---|---|---|---|---|---|
| K-01 | Font | Use Public Sans for the interface. Use IBM Plex Mono for identifiers only. | 17, 143 | `app/layout.tsx`, `app/globals.css` | Ported (ff4d4f1) |
| K-02 | Colours | Use the refresh palette from `docs/RULES.md`. Remove the second lead palette. | 18, 141 | `app/globals.css`, `docs/design/design-tokens.json`, `tailwind.config.ts` | Ported (a5116f6) |
| K-03 | Radii, sizes, shadows | Use 10 px card corners, 36 px buttons and the two shadow tokens only. | 19, 20, 21 | `tailwind.config.ts`, `src/components/ui/button-variants.ts` | Ported (3ac616c) |
| K-04 | Status chips | Show status as a soft chip with a dot. Do not use solid blocks. | 23, 120, 129, 142 | `src/components/ui/badge-variants.ts`, `src/components/common/IconChip.tsx` | Ported (1e6f1ed) |
| K-05 | Owner chips | Show the owner as a 96 px soft chip with a dot. Client is amber, SBC is blue. | 25, 171, 172 | `src/components/common/IconChip.tsx`, `src/components/intern/LeadCompanyChip.tsx` | Ported (a4bb14d) |
| K-06 | Card heads | Use a 52 px head, a hairline, a 14.5 px title and a tinted icon tile from the title. | 27, 107, 156 | `src/components/dash/DashSection.tsx` | Ported (7563f32) |
| K-07 | Greeting | Show a navy band with date and name. Put the numbers in a white strip with icon tiles. | 124, 147, 157 | `src/components/dash/DashHero.tsx`, `src/components/intern/LeadHero.tsx`, `src/components/client-portal/pages/home/CardsA.tsx` `GreetCard` | Ported (55bcd93) |
| K-08 | Colour lines | Remove gradient and gold lines from cards, strips and page heads. | 42, 43, 45, 68, 148, 152 | `src/components/dash/DashHero.tsx`, `src/components/client-portal/css-src/*` | Ported (1a32419) |
| K-09 | Tabs | Make tabs small inline buttons. Show the picked tab in navy. Remove the sliding highlight. | 34, 158, 164 | `src/components/client-portal/css-src/*` (`.seg`), `src/components/ui/tabs.tsx` | Ported (4903f2f) |
| K-10 | Main buttons | Use one main button per region in navy. | 29, 71, 145, 166 | `src/components/ui/button-variants.ts` | Superseded by C-0006 (navy #15263B) |
| K-11 | Table heads | Use sentence case heads with a hairline under them. | 22, 129 | `src/components/dash/DashDataTable.tsx` | Superseded by C-0007 (e-Filing grid) |
| K-12 | Sentence case | Rewrite uppercase labels and headings in sentence case. Keep acronyms. | 146 | All views; `src/components/client-portal/css-src/*` | Ported (a3dadc7) |
| K-13 | Dates | Write "14 Sep", not "14 Sept". Use 24-hour times or "12:31". Do not use "in N days" for statutory dates. | 49, 50 | `src/lib/utils.ts` date helpers | Port |
| K-14 | Shell | Use one top bar style, one search ("Ctrl K"), one theme icon, one bell style, one active rail. | 11, 12, 13, 15, 16, 150 | `src/components/shell/TopBar.tsx`, `src/components/client-portal/TopBar.tsx` | Ported (3f9957d, aec7daf) |
| K-15 | Sidebar order | Sort sidebars by priority. Client order follows incorporation state. | 151 | `src/components/client-portal/Sidebar.tsx`, `src/components/shell/RoleSidebar.tsx`, `intern-sidebar.ts` | Ported (14fdcd6) |
| K-16 | Settings into Profile | Open Profile from the account row. Remove Settings from the lead and manager sidebar. | 134 | `src/views/settings/AccountSettings.tsx`, `src/components/shell/RoleSidebar.tsx` | Ported (4c749d5) |
| K-17 | Word "Nudge" | Replace "Nudge" with "Remind" or "Send reminder" on every screen. | 125 | All staff views, `src/lib/notify/*` copy | Port |
| K-18 | Money | Remove all money from client and super admin dashboards. | 118, 126 | `src/components/client-portal/pages/home/*`, `src/views/super/*` | Port |
| K-19 | Client home order | Put the timeline and Steps first. Use two independent columns. | 72, 123 | `src/components/client-portal/pages/home/HomePage.tsx` | Port |
| K-20 | Next action strip | Show one next action under the greeting. | 118 | `src/components/client-portal/pages/home/HomePage.tsx` | Superseded by C-0012 (remove it) |
| K-21 | Steps card | Show flat phase rows with a 6 px bar and a 108 px count chip. | 122, 159 | `src/components/client-portal/pages/home/CardsB.tsx` `StepsCard` | Port |
| K-22 | Attention lists | Use full-width rows, 44 px date tiles and a red urgent row. | 32, 163 | `CardsA.tsx` `AlertsCard`, `CardsB.tsx` `NextCard` | Port (full red row per C-0013) |
| K-23 | What SBC is doing | Use bars in category colours. Remove info icons and link buttons. | 160 | `CardsA.tsx` `SbcCard` | Port |
| K-24 | Compliance status | Show the total and one stacked bar. | 149, 170 | `CardsB.tsx` `CompCard` | Port |
| K-25 | Timeline | Draw a Gantt with 46 px rows, status circles, 16 px bars and an orange COI mark. | 30, 169, 172 | `CardsB.tsx` `TimelineCard`, `pages/incorporation/Landing.tsx` | Port (one clock circle per C-0024) |
| K-26 | Incorporation COI card | Show the countdown in white, a soft chip and one bar split by phase. Remove the ring. | 165 | `src/components/client-portal/pages/incorporation/Landing.tsx` | Port |
| K-27 | Three phases | Count 25 steps in three phases. Registrations leave incorporation. | 139, 175 | `src/data/checklist.ts` (do not edit without a spec), `src/views/intern/Clients.tsx`, `Landing.tsx` | Port after a spec |
| K-28 | Registrations | Add a Registrations page and detail for client and staff. | 130, 131 | new: `src/components/client-portal/pages/registrations/*`, `app/app/*/registrations/*` | Superseded by C-0022 (layout) |
| K-29 | Obligations | Add an Obligations page and detail. | 132 | new: `src/components/client-portal/pages/compliances/Obligations*.tsx` | Superseded by C-0018 to C-0021 |
| K-30 | Compliance calendar | Use a hairline grid, tinted day badges and today in soft blue. | 162 | `src/components/client-portal/pages/compliances/CalendarPage.tsx`, `src/views/compliances/ComplianceCalendarView.tsx` | Port |
| K-31 | Lead Today cuts | Show five blocks: greeting, practice strip, Action queue with Inbox, Phase progress, overdue filings. | 108, 111, 112, 127 | `src/views/intern/Today.tsx`, `src/components/intern/*` | Port |
| K-32 | Action queue cells | Leave empty cells blank. Show counts as soft chips. | 173 | `src/components/intern/LeadActionQueue.tsx` | Port |
| K-33 | Phase progress | Show a 6 px bar per phase with the count under it. | 24, 173 | `src/components/intern/LeadPhaseProgress.tsx` | Port |
| K-34 | Task rows | Use a checkbox and one status icon. | 128 | `src/components/intern/InternWorkRow.tsx`, `src/components/staff/TeamTodosPanel.tsx` | Superseded by C-0031 (one status mark) |
| K-35 | People names | Use Bharath (lead), Pranay (manager), Krishna (admin), Mithilesh (super admin), Farhath (developer). | 57, 79, 80 | `scripts/seed-demo.ts`, `scripts/seed-demo-extras.ts` | Port |
| K-36 | Manager sidebar | Remove "Your managers". Name the item "Project leads". Fold groups. | 61, 62, 69, 76, 80 | `src/components/shell/RoleSidebar.tsx`, `intern-sidebar.ts` | Port |
| K-37 | Admin Today | Show clients with stage, step, progress, manager, next date and health. Show the managers table. | 81, 82, 109, 121 | `src/views/admin/FirmDashboard.tsx`, `FirmProjectsPanel.tsx` | Port (grid per C-0034) |
| K-38 | Wide tables | Make wide staff tables fit their cards. | 65, 174 | `src/views/admin/FirmProjectsPanel.tsx`, `src/views/super/SuperProjects.tsx` | Port |
| K-39 | Staff Vault | Use the client Documents explorer with a client dropdown first. | 135 | `src/views/vault/DocumentVaultPage.tsx`, `src/views/admin/Vault.tsx` | Port (smooth per C-0025) |
| K-40 | Email signatures | Show "Signature from Outlook · server-side signature on". | 138 | `src/views/staff/ComposeMail.tsx` | Port |
| K-41 | Dark mode | Use slate surfaces and dark twins of each colour. | 167 | `app/globals.css`, `src/components/client-portal/css-src/00-tokens.css` | Ported (a8c2cb7) |
| K-42 | Phone home | Show the navy band, then the white number strip. Remove the ring. | 168 | `src/components/client-portal/pages/home/MobileHome.tsx`, `MobileParts.tsx` | Port |
| K-43 | Team page buttons | Make WhatsApp buttons soft green. | 48, 176 | `src/components/client-portal/pages/team/TeamPage.tsx` | Superseded by C-0027 (Team moves into Profile) |
| K-44 | Developer console | Use the lcc Settings shape with full connection detail. | 98-106, 119, 153-155 | new: `app/app/dev/*` | Superseded by C-0037 to C-0039 |
| K-45 | Super admin portal | Add Overview, Clients, Practice areas, Team, Risks, Growth, Reports, Firm settings. | 87-97, 110, 117 | `src/views/super/*`, new routes under `app/app/super/*` | Port (style per C-0035, C-0036) |
| K-46 | Library shelf | Show the SBC SOPs as a book shelf. | 137 | `src/components/client-portal/pages/documents/library/LibraryPage.tsx` | Port |
| K-47 | Ask VCFO prompt home | Open Ask VCFO on a prompt home with four quick-start chips. | 136 | `src/components/ask/AskPanel.tsx` | Port (no mascot per C-0003) |
| K-48 | Landing page | Spotlight and beams on the hero; peaks on sign-in. | 140 | `src/components/marketing/*` | Prototype only |
