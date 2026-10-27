# Screen list of the old prototype

The old prototype has 141 screens. Each row gives the route key, the screen title and the screen file. The screen files are in `reference/old-screens/` (extracted from `reference/vcfo-suite-v6.html`). The new prototype must have every screen in this list, unless a row in `CHANGES.md` removes it.

Routes for manager (`mgr-`), admin (`admin-`) and super admin (`super-`) reuse the lead screens where the lead file is shared. A route that ends in `-search` or `-chat` is an overlay (search palette, Ask VCFO chat), not a page.

| Route key | Title | Old screen file |
|---|---|---|
| **Client (27)** | | |
| home | Home | s/home/v7_before.dc.html |
| home-chat | Home · Ask VCFO chat | s/home/v7_before.dc.html#chat |
| incorporation | Incorporation | s/inc/incorporation.html |
| compliances | Compliances · Calendar | s/comp/index.html#cal-redesign |
| filings | Compliances · Filings | s/comp/index.html#fil-redesign |
| documents | Documents | s/docs/docs_a_refined.dc.html |
| knowledge-bank | Library | s/docs/lib_shelf_a.dc.html |
| kb-reader | Library · reading view | s/docs/lib_reader.dc.html |
| team | Team | s/team/team_redesign.dc.html |
| announcements | Announcements | s/team/ann_redesign.dc.html |
| notifications | Notifications | s/team/notif_redesign.dc.html |
| audit | Audit | s/team/audit_redesign.dc.html |
| settings | Settings | s/team/settings_redesign.dc.html |
| doc-viewer | Shared · document viewer | s/home/v7x_doc_viewer.dc.html |
| ids-password | Shared · password reveal | s/home/v7p_ids_password.dc.html |
| inc-phase | Incorporation · Phase 2 · Incorporation | s/inc/phase.html#p=2 |
| inc-step7 | Incorporation · step 7 | s/inc/step.html#n=7 |
| inc-step10 | Incorporation · step 10 | s/inc/step.html#n=10 |
| board-resolution | Board resolution | s/inc/board.html |
| inc-phase-a | Incorporation · Phase 1 · Name Application | s/inc/phase.html#p=1 |
| inc-phase-3 | Incorporation · Phase 3 · Post-Incorporation | s/inc/phase.html#p=3 |
| credentials | Credentials | s/home/v7p_credentials.dc.html |
| registrations | Client · Registrations | s/home/v7p_registrations.dc.html |
| registration | Client · Registration | s/home/v7p_registration.dc.html |
| obligations | Client · Obligations | s/home/v7p_obligations.dc.html |
| obligation | Client · Obligation | s/home/v7p_obligation.dc.html |
| profile | Client · Profile | s/home/v7p_profile.dc.html |
| **Lead (29)** | | |
| lead-home | Lead · Today | s/lead/Main.dc.html |
| lead-home-inc | Lead · Today · all incorporating | s/lead/TodayBefore.dc.html |
| lead-home-cmp | Lead · Today · all compliance | s/lead/TodayAfter.dc.html |
| lead-work | Lead · Work | s/lead/Work.dc.html |
| lead-work-plan | Lead · Work · Planning my week | s/lead/WorkPlan.dc.html |
| lead-work-board | Lead · Work · Board and list | s/lead/WorkBoard.dc.html |
| lead-work-drawer | Lead · Work · Task drawer | s/lead/WorkDrawer.dc.html |
| lead-clients | Lead · Clients | s/lead/Clients.dc.html |
| lead-overview | Lead · Clients · Northwind · phases | s/lead/Overview.dc.html |
| lead-step | Lead · Step page | s/lead/Step.dc.html |
| lead-documents | Lead · Documents | s/lead/Documents.dc.html |
| lead-board-resolution | Lead · Board resolution | s/lead/BoardRes.dc.html |
| lead-email | Lead · Email | s/lead/Email.dc.html |
| lead-vault | Lead · Vault | s/lead/Vault.dc.html |
| lead-knowledge-bank | Lead · Knowledge Bank | s/lead/Knowledge.dc.html |
| lead-announcements | Lead · Announcements | s/lead/Announcements.dc.html |
| lead-notifications | Lead · Notifications | s/lead/Notifications.dc.html |
| lead-compliances | Lead · Compliances · Calendar | s/lead/CompCal.dc.html |
| lead-filings | Lead · Compliances · Filings | s/lead/Filings.dc.html |
| lead-analytics | Lead · Analytics | s/lead/Analytics.dc.html |
| lead-audit | Lead · Audit | s/lead/Audit.dc.html |
| lead-settings | Lead · Settings | s/lead/Settings.dc.html |
| lead-search | Lead · Search and bells | s/lead/Palette.dc.html |
| lead-chat | Lead · Ask VCFO chat | s/lead/Chat.dc.html |
| lead-registrations | Lead · Registrations | s/lead/Registrations.dc.html |
| lead-registration | Lead · Registration | s/lead/RegItem.dc.html |
| lead-obligations | Lead · Compliances · Obligations | s/lead/Obligations.dc.html |
| lead-obligation | Lead · Obligation | s/lead/ObItem.dc.html |
| lead-profile | Lead · Profile | s/lead/ProfilePage.dc.html |
| **Manager (30)** | | |
| mgr-home | Manager · Today | s/mgr/Main.dc.html |
| mgr-home-inc | Manager · Today · all incorporating | s/mgr/TodayBefore.dc.html |
| mgr-home-cmp | Manager · Today · all compliance | s/mgr/TodayAfter.dc.html |
| mgr-work | Manager · Work | s/mgr/Work.dc.html |
| mgr-work-plan | Manager · Work · Planning my week | s/mgr/WorkPlan.dc.html |
| mgr-work-board | Manager · Work · Board and list | s/mgr/WorkBoard.dc.html |
| mgr-work-drawer | Manager · Work · Task drawer | s/mgr/WorkDrawer.dc.html |
| mgr-clients | Manager · Clients | s/mgr/Clients.dc.html |
| mgr-overview | Manager · Clients · Northwind · phases | s/mgr/Overview.dc.html |
| mgr-step | Manager · Step page | s/mgr/Step.dc.html |
| mgr-documents | Manager · Documents | s/mgr/Documents.dc.html |
| mgr-board-resolution | Manager · Board resolution | s/mgr/BoardRes.dc.html |
| mgr-email | Manager · Email | s/mgr/Email.dc.html |
| mgr-vault | Manager · Vault | s/mgr/Vault.dc.html |
| mgr-knowledge-bank | Manager · Knowledge Bank | s/mgr/Knowledge.dc.html |
| mgr-announcements | Manager · Announcements | s/mgr/Announcements.dc.html |
| mgr-notifications | Manager · Notifications | s/mgr/Notifications.dc.html |
| mgr-compliances | Manager · Compliances · Calendar | s/mgr/CompCal.dc.html |
| mgr-filings | Manager · Compliances · Filings | s/mgr/Filings.dc.html |
| mgr-analytics | Manager · Analytics | s/mgr/Analytics.dc.html |
| mgr-audit | Manager · Audit | s/mgr/Audit.dc.html |
| mgr-settings | Manager · Settings | s/mgr/Settings.dc.html |
| mgr-search | Manager · Search and bells | s/mgr/Palette.dc.html |
| mgr-leads | Manager · My Leads | s/mgr/Leads.dc.html |
| mgr-chat | Manager · Ask VCFO chat | s/mgr/Chat.dc.html |
| mgr-registrations | Manager · Registrations | s/mgr/Registrations.dc.html |
| mgr-registration | Manager · Registration | s/mgr/RegItem.dc.html |
| mgr-obligations | Manager · Compliances · Obligations | s/mgr/Obligations.dc.html |
| mgr-obligation | Manager · Obligation | s/mgr/ObItem.dc.html |
| mgr-profile | Manager · Profile | s/mgr/ProfilePage.dc.html |
| **Admin (25)** | | |
| admin-home | Admin · Today | s/admin/Main.dc.html |
| admin-work | Admin · Work | s/admin/Work.dc.html |
| admin-managers | Admin · Managers | s/admin/Managers.dc.html |
| admin-clients | Admin · Clients | s/admin/Clients.dc.html |
| admin-overview | Admin · Clients · Northwind | s/admin/Overview.dc.html |
| admin-step | Admin · Step page | s/admin/Step.dc.html |
| admin-documents | Admin · Documents | s/admin/Documents.dc.html |
| admin-board-resolution | Admin · Board resolution | s/admin/BoardRes.dc.html |
| admin-email | Admin · Email | s/admin/Email.dc.html |
| admin-vault | Admin · Vault | s/admin/Vault.dc.html |
| admin-knowledge-bank | Admin · Knowledge bank | s/admin/Knowledge.dc.html |
| admin-announcements | Admin · Announcements | s/admin/Announcements.dc.html |
| admin-notifications | Admin · Notifications | s/admin/Notifications.dc.html |
| admin-compliances | Admin · Compliances · Calendar | s/admin/CompCal.dc.html |
| admin-filings | Admin · Compliances · Filings | s/admin/Filings.dc.html |
| admin-analytics | Admin · Analytics | s/admin/Analytics.dc.html |
| admin-audit | Admin · Audit | s/admin/Audit.dc.html |
| admin-settings | Admin · Settings | s/admin/Settings.dc.html |
| admin-search | Admin · Search and bells | s/admin/Palette.dc.html |
| admin-chat | Admin · Ask VCFO chat | s/admin/Chat.dc.html |
| admin-registrations | Admin · Registrations | s/admin/Registrations.dc.html |
| admin-registration | Admin · Registration | s/admin/RegItem.dc.html |
| admin-obligations | Admin · Compliances · Obligations | s/admin/Obligations.dc.html |
| admin-obligation | Admin · Obligation | s/admin/ObItem.dc.html |
| admin-profile | Admin · Profile | s/admin/ProfilePage.dc.html |
| **Super admin (18)** | | |
| super-home | Super admin · Overview | s/super/Main.dc.html |
| super-clients | Super admin · Clients | s/super/Clients.dc.html |
| super-overview | Super admin · Clients · Northwind | s/super/Overview.dc.html |
| super-incorporation | Super admin · Practice · Incorporation | s/super/Incorporation.dc.html |
| super-registrations | Super admin · Practice · Registrations | s/super/Registrations.dc.html |
| super-compliances | Super admin · Compliances · Calendar | s/super/CompCal.dc.html |
| super-filings | Super admin · Compliances · Filings | s/super/Filings.dc.html |
| super-team | Super admin · Team | s/super/Team.dc.html |
| super-risks | Super admin · Risks | s/super/Risks.dc.html |
| super-growth | Super admin · Growth | s/super/Growth.dc.html |
| super-reports | Super admin · Reports | s/super/Reports.dc.html |
| super-settings | Super admin · Firm settings | s/super/Settings.dc.html |
| super-step | Super admin · Step page | s/super/Step.dc.html |
| super-documents | Super admin · Documents | s/super/Documents.dc.html |
| super-board-resolution | Super admin · Board resolution | s/super/BoardRes.dc.html |
| super-search | Super admin · Search | s/super/Palette.dc.html |
| super-chat | Super admin · Ask VCFO chat | s/super/Chat.dc.html |
| super-profile | Super admin · Profile | s/super/ProfilePage.dc.html |
| **Developer (12)** | | |
| dev-home | Developer · Overview | s/dev/Main.dc.html |
| dev-connections | Developer · Connections | s/dev/Connections.dc.html |
| dev-messages | Developer · Messages | s/dev/Messages.dc.html |
| dev-jobs | Developer · Jobs | s/dev/Jobs.dc.html |
| dev-logs | Developer · Logs | s/dev/Logs.dc.html |
| dev-deploys | Developer · Deploys | s/dev/Deploys.dc.html |
| dev-access | Developer · Access | s/dev/Access.dc.html |
| dev-data | Developer · Data and costs | s/dev/Data.dc.html |
| dev-audit | Developer · Audit | s/dev/Audit.dc.html |
| dev-search | Developer · Search | s/dev/Palette.dc.html |
| dev-chat | Developer · Ask VCFO chat | s/dev/Chat.dc.html |
| dev-profile | Developer · Profile | s/dev/ProfilePage.dc.html |
