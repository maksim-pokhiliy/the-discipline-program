# post-uat — plan (waves + the item registry)

Lifecycle: `TRIAGED → REPRO'D → SPEC'D → IN-EXEC → PR → MERGED → VERIFIED → CLOSED` (or `DROPPED`). Evidence + STR per item: `triage.md`. Owner feedback rounds 27.07 (both) folded in; all decisions D-1..D-6 resolved.

## Registry

| ID    | Type       | Area             | Item                                                                             | Size | Wave | Status                                             |
| ----- | ---------- | ---------------- | -------------------------------------------------------------------------------- | ---- | ---- | -------------------------------------------------- |
| PU-01 | bug        | platform/records | 1RM picker dead end → athlete read-only movement catalog (D-6 = a)               | S/M  | W1   | SPEC'D (`prompt-w1-athlete-pack.md`)               |
| PU-02 | bug        | platform/session | RX/SC spread line clips mid-token on phones                                      | S    | W1   | SPEC'D (`prompt-w1-athlete-pack.md`)               |
| PU-03 | ux         | platform/session | Active level invisible in the session (switch itself works, on the Profile page) | S    | W1   | SPEC'D (`prompt-w1-athlete-pack.md`)               |
| PU-04 | bug        | platform/session | In-session 1RM write-once → append-correction path (D-5)                         | S/M  | W1   | SPEC'D (`prompt-w1-athlete-pack.md`)               |
| PU-05 | bug        | domain           | "Ski @ 14 kg" — kg grid abused for cal targets                                   | —    | W6   | **FOLDED into PU-13** (D-4: no interim mitigation) |
| PU-06 | bug        | admin            | Soft-delete list-brick (URGENT) + honest-UI hide for HEAD_COACH                  | S+XS | now  | SPEC'D (`prompt-fix-a-admin.md`)                   |
| PU-07 | feature    | admin            | Editable user email (login identity change), ADMIN-only                          | M    | W3   | APPROVED                                           |
| PU-08 | ux         | mobile-publish   | Link ≠ publish: per-link publish status → **MP-22**                              | M    | W2   | APPROVED (spec'd 16.07)                            |
| PU-09 | feature    | marketing        | "Log in" entry point → platform                                                  | XS   | W4   | APPROVED                                           |
| PU-10 | feature    | marketing        | Socials on /contact + footer (+ restore `sameAs`)                                | S    | W4   | APPROVED (links from Denys pending)                |
| PU-11 | feature    | notifications    | Contact notify: email + resurrect Telegram bot + prod env check                  | S    | W4   | APPROVED (D-3)                                     |
| PU-12 | feature    | platform         | Athlete session screen v2 — guided execution (timers + full screen rework)       | L    | W5   | SCOPED (design-first; likely spin-off)             |
| PU-13 | feature    | domain           | Profiling v2 — per-gender/level values beyond kg (absorbs PU-05)                 | L    | W6   | SCOPED (design-first; sacred-VO gate)              |
| PU-14 | initiative | payments         | Storefront subscription commerce: product→plan, buy→auto-enroll, recurring       | —    | W7   | SCOPE SET (owner 27.07); charter at W7             |
| PU-15 | ops        | infra            | ALL `@thedisciplineprogram.com` mailboxes (head-coach@ + sender identities)      | —    | ops  | OPEN (owner)                                       |
| PU-16 | —          | platform         | Stas: platform "without the changes"                                             | —    | —    | **CLOSED** (plan was simply unpublished)           |
| PU-17 | feature    | email            | Email template redesign — de-generic, Claude Design pass                         | S/M  | W4+  | NEW (after PU-11)                                  |

## Waves

- **Fix-A mini-fix (now, ahead of everything):** PU-06 — soft-delete excluded from all admin reads + honest-UI hide for HEAD_COACH. Prompt: `prompt-fix-a-admin.md`, branch `fix/admin-soft-delete-reads`. Until merged: **no user deletion in prod admin.**
- **W1 — athlete pack** (`/fix`, one branch `fix/uat-athlete-pack`): PU-01 + PU-02 + PU-03 + PU-04. Prompt: `prompt-w1-athlete-pack.md`. Contract changes additive only (athlete movements response, resolved-arm coords, exercise identity on resolved rows). Can run in PARALLEL with Fix-A — disjoint file zones (platform/lms vs admin/iam). Exit: owner + Tetiana re-verify the reported flows on prod.
- **W2 — publish status** (`/feature small`, inside `mobile-publish` as MP-22): PU-08. Prompt next after W1 lands (or interleaved).
- **W3 — admin rest** (`/fix`): PU-07 email edit under ADMIN (D-2).
- **W4 — reach & notify** (`/fix` or `/feature small`): PU-09 + PU-10 (once links arrive) + PU-11; then **PU-17** as a follow-on Claude-Design pass over the full template inventory.
- **W5 — athlete session screen v2** (design-first; likely its own initiative): PU-12.
- **W6 — profiling v2** (design-first; likely its own initiative; four-projection + sacred-VO gate): PU-13, absorbing PU-05 as the evidence case. Until it ships, the Ski-type rows stay as-is (D-4 — owner's explicit call).
- **W7 — subscriptions charter** (docs only): PU-14 → new initiative from the owner-set scope: storefront products bound to training plans, purchase → auto-enroll, recurring subscription until cancel. The schema skeleton already exists (Price / Subscription / Transaction / RequestIdempotency); missing: Product→TrainingPlan link, payment provider (checkout/recurring/webhooks), subscription→enrollment lifecycle, UI. Tetiana's brief = additional input (the away-mode case), not a gate.

**Proposed order:** Fix-A ∥ W1 → W2 → W3 → W4 (PU-10 whenever links arrive) → W5 → W6 → W7.
