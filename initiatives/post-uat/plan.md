# post-uat — plan (waves + the item registry)

Lifecycle: `TRIAGED → REPRO'D → SPEC'D → IN-EXEC → PR → MERGED → VERIFIED → CLOSED` (or `DROPPED`). Evidence + STR per item: `triage.md`.

## Registry

| ID    | Type        | Area             | Item                                                             | Size | Wave | Status                       |
| ----- | ----------- | ---------------- | ---------------------------------------------------------------- | ---- | ---- | ---------------------------- |
| PU-01 | bug         | platform/records | 1RM movement picker is a dead end (record-scoped options)        | S/M  | W1   | TRIAGED                      |
| PU-02 | bug         | platform/session | RX/SC spread line clips mid-token on phones                      | S    | W1   | TRIAGED                      |
| PU-03 | bug         | platform/session | Level picker unreachable (resolved rows + grouped rows)          | S    | W1   | TRIAGED                      |
| PU-04 | bug         | platform/session | In-session 1RM weight write-once, no correction path             | S/M  | W1   | TRIAGED                      |
| PU-05 | bug         | domain/editor    | kg load grid abused for cal targets ("Ski @ 14 kg") — mitigation | S    | W1   | TRIAGED                      |
| PU-06 | bug ×2      | admin            | User delete: HEAD_COACH 403 + latent soft-delete list-brick      | S+M  | W3   | TRIAGED (Fix B gated D-2)    |
| PU-07 | feature     | admin            | Editable user email (login identity change)                      | M    | W3   | TRIAGED (access per D-2)     |
| PU-08 | ux          | mobile-publish   | Link ≠ publish: per-link publish status → **MP-22**              | M    | W2   | SPEC'D (owner spec 16.07)    |
| PU-09 | feature     | marketing        | "Log in" entry point → platform                                  | XS   | W4   | TRIAGED                      |
| PU-10 | feature     | marketing        | Socials on /contact + footer (+ restore `sameAs`)                | S    | W4   | TRIAGED (handles to confirm) |
| PU-11 | feature     | notifications    | Contact notify: email + resurrect Telegram bot + prod env check  | S    | W4   | TRIAGED (gated D-3)          |
| PU-12 | feature     | platform         | Guided workout timer (cadence/interval/timeCap v1)               | M/L  | W5   | SCOPED                       |
| PU-13 | feature     | domain           | Per-gender volume (M/F calories) — true fix of PU-05             | L    | W6   | SCOPED (sacred-VO gate)      |
| PU-14 | initiative  | payments         | Self-serve weekly plan purchase — charter after Tetiana's brief  | —    | W7   | AWAITING BRIEF               |
| PU-15 | ops         | infra            | `head-coach@` mailbox (owner, mail provider)                     | —    | ops  | OPEN (owner)                 |
| PU-16 | investigate | platform         | Stas: platform showed plan "without the changes"                 | ?    | —    | NEEDS INFO                   |

## Waves

- **W1 — athlete pack** (`/fix`, one branch `fix/uat-athlete-pack`): PU-01..PU-05. All platform/api-server; the three session items converge on `row-group.tsx`. Only additive contract change: `exerciseId` on rowView (PU-04) + optional resolved-coords (PU-05c). Exit: owner + Tetiana re-verify the reported flows.
- **W2 — publish status** (`/feature small`, inside `mobile-publish` as MP-22): PU-08. Additive GET /links aggregate + strip status + REV-I4 copy. Exit: owner walk-through of the 16.07 incident scenario — status makes the unpublished state obvious.
- **W3 — admin** (`/fix` after D-2 ratified): PU-06 Fix A (urgent, decision-free) + Fix B + PU-07. Exit: Denys can manage non-admin users end-to-end on prod (or the D-2 alternative shipped).
- **W4 — reach & notify** (`/fix` or `/feature small`, after D-3): PU-09 + PU-10 + PU-11. Exit: login reachable from the site; socials live; a test submission notifies email + Telegram; prod env verified.
- **W5 — guided timer** (`/feature`, UI-first on mocks): PU-12. Own Gate A.
- **W6 — per-gender volume** (`/feature` + design doc, four-projection gate): PU-13. Supersedes the PU-05 mitigation.
- **W7 — payments charter** (docs only): PU-14 → new initiative.

**Proposed order:** W1 → W2 → W3 → W4 → W5 → W6 → W7 (W3 Fix A and W4 can interleave earlier if a slot frees up — both are small and independent).
