# Board resolution (NOC) page: build spec

Owner decision: 30 Oct 2026 ("go with your proposals"). Rule: R-52.
Design reference (read first, it is a working model): https://claude.ai/artifact/8gV4tEcxrf2ZPi2VySW879
A copy is in `docs/proposals/board-resolution-page.html`.

Write UI words in ASD-STE100: short sentences, active voice, one instruction each.
Use the Spectrum rules (`docs/RULES.md`): six status words, 104 px chips, ST5 step marks, red only for late,
no page notification bars (R-38), one radius.

## 1. Facts from VCFO Suite (the code wins)

| # | Fact | Where |
|---|---|---|
| F1 | The NOC **is** the parent's board resolution (Pre-2). It is one document. | `src/lib/noc/templates.ts` |
| F2 | It has three variants: `foreign-parent` "NOC — Foreign subsidiary", `indian-name-only` "NOC — Indian subsidiary (name use)", `indian-investing` "NOC — Indian subsidiary (investing)". | `src/lib/noc/templates.ts` |
| F3 | `resolveNocVariant()` picks the variant from three project answers: `ownershipType` (independent or subsidiary), `companyType` (foreign or domestic) and `parentIndianRelationship` (name_only or investing). A standalone company needs no NOC. An Indian parent with no role chosen is "incomplete", not "no NOC". | `src/lib/noc/variant.ts` |
| F4 | Staff set these answers in Create project (Entity section). The client does not answer them in Pre-1. | `src/components/admin/CreateProjectEntitySection.tsx` |
| F5 | The client page is `BoardPage.tsx`. It covers checklist steps 2 (Draft Board Resolution) and 3 (Signed Board Resolution). | `src/components/client-portal/pages/incorporation/BoardPage.tsx`, `src/data/checklist.ts` |

## 2. Decisions

| # | Decision |
|---|---|
| D1 | A foreign parent's resolution gets two more steps: Notarised and Apostilled. SBC can turn them off for one client. Indian parents do not get them. |
| D2 | One document (F1). Title: **"Board resolution (NOC)"**. The subtitle names the variant, for example "NOC — Foreign subsidiary". This replaces "two files" in the proposal page. |
| D3 | A director selected from the parent's director list certifies the true copy. |
| D4 | An Indian parent follows the same track without the notary and apostille steps. |
| D5 | Everyone sees the full decision tree. The chosen path lights up. Each decision shows the real project answer. |

## 3. The page (client)

| # | Part | Rule |
|---|---|---|
| C1 | Head | Title "Board resolution (NOC)", status chip (six words), the line "Passed by: Board of {parent name} (the parent) · Phase 1 · Steps 2–3". Buttons "‹ Previous step" and "Next step ›" only (no links to steps 2 and 3, P6). |
| C2 | Track | ST5 marks. Foreign parent: Drafted · Released · Signed · Notarised · Apostilled · Accepted. Indian parent: Drafted · Released · Signed · Accepted. Each done step shows who and when. Every date comes from one record (P2). |
| C3 | Key facts card | Values only: new company, capital, shares (parent and nominee), who signs the forms, who files, the variant name. Values come from the engagement. A missing value shows "Not given yet" in faint ink. |
| C4 | What you do | A numbered list. The current step has the accent-soft fill. Done steps show a tick. Foreign: 1 Download the Word file · 2 Print it on the parent's letterhead · 3 A director signs · 4 Notarise, then apostille · 5 Upload the scan. Indian: steps 1, 2, 3 and 5. One main button: Released → "Download the Word file", waiting for scan → "Upload signed copy", Accepted → no button. |
| C5 | Preview, Draft tab | The generated text on the parent's letterhead (from Pre-1 when it exists; else a plain page with the parent's name). Margin labels: Purpose · Decision · Who signs · Filing agent · Certifies. Two date labels: "Meeting · {date}" and "Certified · {date}" (P3). Values filled from answers have the accent-soft tint. A click on a value opens the field that holds it, or names it when the user cannot edit it. |
| C6 | Preview, Signed copy tab | The uploaded PDF only. Never draw a signature or a seal (P7). Empty state: "No signed copy yet". |
| C7 | Files | The Word draft and the signed copy. The client never sees the internal file name (P5). Replace zone under the files until Accepted. |
| C8 | Why VCFO chose this template | Full width under the two columns. The full tree: Ownership → Standalone (No NOC) or Subsidiary → Foreign subsidiary (NOC — Foreign subsidiary) or Indian subsidiary → Parent's role → Name use only · Investing · Not chosen yet → NOC — Indian (name use) · NOC — Indian (investing) · No NOC yet. Chosen path in primary with numbered badges 1, 2, 3 and "CHOSEN" under the result. Other branches grey; "Not chosen yet" and "No NOC yet" grey dashed (never amber, P4). Under it a table: # · VCFO asked · The answer · So VCFO chose, from F3 (label "Project setup · Ownership type", "Project setup · Company type", "Project setup · Parent's role"). A result line: "This choice adds {n} steps" (foreign: Notarise · Apostille). A Replay button lights the path again in about one second; reduced motion shows it at once. |

## 4. The page (staff: lead, manager, admin, super admin)

| # | Part | Rule |
|---|---|---|
| T1 | Same page as the client | Plus the parts below. |
| T2 | Template card | The variant, the internal file name, "Change template" (admin, super admin, manager; asks for a reason; writes an audit line). |
| T3 | Out of date | When a project answer that feeds the draft changes after release, show the chip "Answers changed after release" and the button "Make the draft again". |
| T4 | Versions | "Compare versions" lists the changed values between two versions. |
| T5 | Receive checklist | Six checks: signature of a parent director · date and place filled · on the parent's letterhead · notary stamp · apostille certificate · names match the draft. Indian parents: four (no notary, no apostille). "Accept" unlocks when all are ticked. "Send back" asks for a reason and tells the client. |
| T6 | After Accept | The signed copy goes to Documents › Vault under Incorporation › Board resolution, and to the SPICe+ attachment list when it exists. |

## 5. Shared document part (build it once)

One component for the track, files, preview tabs, receive checklist and audit lines. The board resolution (NOC) uses it first.
Later users: resolution by circulation, notice and agenda, minutes (see `docs/proposals/board-meeting-agendas.html`).
Each document type gives its steps, its letterhead source and its checklist.

## 6. Not in this build

- E-sign. The board meeting agenda and resolution by circulation features (they wait for SBC).
- SBC's final legal wording: keep the current template text.

## 7. Tests

- Client: the head shows "Passed by"; the track has 6 steps for a foreign parent and 4 for an Indian parent; the tree lights the path that `resolveNocVariant()` returns for each of the four cases (foreign, Indian name use, Indian investing, Indian not chosen); the client never sees the internal file name.
- Staff: Accept is disabled until every check is ticked; Send back needs a reason.
- Smoke: every board resolution route for every role.
