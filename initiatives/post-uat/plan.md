# post-uat — plan (waves + the item registry)

Lifecycle: `TRIAGED → REPRO'D → SPEC'D → IN-EXEC → PR → MERGED → VERIFIED → CLOSED` (or `DROPPED`). Evidence + STR per item: `triage.md`. Owner feedback round 27.07 folded in.

## Registry

| ID    | Type       | Area             | Item                                                                                 | Size | Wave | Status                                             |
| ----- | ---------- | ---------------- | ------------------------------------------------------------------------------------ | ---- | ---- | -------------------------------------------------- |
| PU-01 | bug        | platform/records | 1RM picker dead end — scope = athlete's own records, NOT coach benchmarks            | S/M  | W1   | TRIAGED (gated **D-6**)                            |
| PU-02 | bug        | platform/session | RX/SC spread line clips mid-token on phones                                          | S    | W1   | REPRO'D (owner ✔ 27.07)                           |
| PU-03 | ux         | platform/session | Level switch is invisible (popover slams shut, no level label) + no picker in groups | S    | W1   | REPRO'D (owner reframe 27.07)                      |
| PU-04 | bug        | platform/session | In-session 1RM weight write-once, no correction path                                 | S/M  | W1   | REPRO'D (owner ✔; D-5 ratified)                   |
| PU-05 | bug        | domain/editor    | kg load grid abused for cal targets ("Ski @ 14 kg") — interim mitigation             | S    | W1   | TRIAGED (gated **D-4**; true fix = PU-13)          |
| PU-06 | bug        | admin            | Soft-delete list-brick (Fix A URGENT — Denys now on ADMIN) + honest-UI for coach     | S+XS | W3   | RE-FRAMED (D-2 ratified; Fix B dropped)            |
| PU-07 | feature    | admin            | Editable user email (login identity change), ADMIN-only                              | M    | W3   | APPROVED                                           |
| PU-08 | ux         | mobile-publish   | Link ≠ publish: per-link publish status → **MP-22**                                  | M    | W2   | APPROVED (owner ✔ 27.07; spec'd 16.07)            |
| PU-09 | feature    | marketing        | "Log in" entry point → platform                                                      | XS   | W4   | APPROVED                                           |
| PU-10 | feature    | marketing        | Socials on /contact + footer (+ restore `sameAs`)                                    | S    | W4   | APPROVED (links from Denys pending)                |
| PU-11 | feature    | notifications    | Contact notify: email + resurrect Telegram bot + prod env check                      | S    | W4   | APPROVED (D-3 ratified)                            |
| PU-12 | feature    | platform         | Athlete session screen v2 — guided execution (timers + full screen rework)           | L    | W5   | SCOPED (owner expanded 27.07; likely spin-off)     |
| PU-13 | feature    | domain           | Profiling v2 — per-gender/level values beyond kg (design-first rework)               | L    | W6   | SCOPED (owner: "профайлинг сырой"; sacred-VO gate) |
| PU-14 | initiative | payments         | Self-serve weekly plan purchase / billing — charter after Tetiana's brief            | —    | W7   | AWAITING BRIEF (owner: deliberate post-UAT piece)  |
| PU-15 | ops        | infra            | ALL `@thedisciplineprogram.com` mailboxes (head-coach@ + sender identities)          | —    | ops  | OPEN (owner)                                       |
| PU-16 | —          | platform         | Stas: platform "without the changes"                                                 | —    | —    | **CLOSED** (27.07 — plan was simply unpublished)   |
| PU-17 | feature    | email            | Email template redesign — de-generic, Claude Design pass                             | S/M  | W4+  | NEW (owner 27.07; after PU-11)                     |

## Waves

- **W1 — athlete pack** (`/fix`, one branch `fix/uat-athlete-pack`): PU-02 + PU-03 + PU-04, plus PU-01 per **D-6** and PU-05 mitigation per **D-4**. All platform/api-server; the session items converge on `row-group.tsx`. Contract changes are additive only: `exerciseId` on rowView (PU-04) + resolved `coords` label (now CORE — it is both the PU-03 switch-feedback and the PU-05 honesty fix). Exit: owner + Tetiana re-verify the reported flows.
- **W2 — publish status** (`/feature small`, inside `mobile-publish` as MP-22): PU-08. Additive GET /links aggregate + strip status + REV-I4 copy. Exit: the 16.07 incident scenario is impossible to misread.
- **W3 — admin** (`/fix`): PU-06 Fix A (**URGENT — live risk now that Denys holds ADMIN**; may ship as an immediate standalone mini-fix ahead of the wave) + Fix A′ honest-UI + PU-07 (ADMIN-only per D-2). Exit: delete works without bricking the list; coach account shows no dead controls; email editable under ADMIN.
- **W4 — reach & notify** (`/fix` or `/feature small`): PU-09 + PU-10 (once links arrive) + PU-11. Then **PU-17** as a follow-on Claude-Design pass over the full template inventory. Exit: login reachable; socials live; a test submission notifies email + Telegram; prod env verified; templates branded.
- **W5 — athlete session screen v2** (design-first; likely its own initiative): PU-12. UI-first on mocks; timer-core v1 = cadence/interval/timeCap.
- **W6 — profiling v2** (design-first; likely its own initiative; four-projection + sacred-VO gate): PU-13. Supersedes the PU-05 mitigation.
- **W7 — payments charter** (docs only): PU-14 → new initiative after Tetiana's brief.

**Proposed order:** W3-Fix-A immediately → W1 → W2 → W3-rest → W4 → W5 → W6 → W7. (W4 can interleave — small and independent.)
