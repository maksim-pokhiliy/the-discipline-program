# profile-axis-catalog — deferred

Carry-forwards with disposition + status. `OPEN` (live) · `SCHEDULED` (assigned to a step) · `CLOSED` · `DROPPED`.

| ID    | One-liner                                                                                  | Disposition                                                                                               | Status         |
| ----- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------- |
| PAC-1 | Existing `byProfile` loads use free-string axis `name`; need migration to `axisId`/`human` | W2 data migration (probe prod first — likely near-empty per athlete-core seeding none)                    | SCHEDULED (W2) |
| PAC-2 | `profileSelections` keys are free strings; re-home to `axisId`                             | W3 data migration                                                                                         | SCHEDULED (W3) |
| PAC-3 | masters/age as a human attribute (dob → auto age-group resolution)                         | default: masters is a CUSTOM catalog axis; promote to a human attribute only if Denys runs age-resolution | OPEN           |
| PAC-4 | `ProfileAxisValue` as its own table                                                        | deferred — `String[]` on the axis until cardinality / per-value metadata demands it                       | OPEN           |
| PAC-5 | Per-coach axis scoping                                                                     | global catalog now (single-coach); revisit at multi-tenant                                                | OPEN           |
| PAC-6 | Full-cartesian `cells` authoring burden grows with axis-value count                        | existing `loadSchema` constraint, not new; watch the coach UX as level gains values                       | OPEN           |
| PAC-7 | plan-editor-compose four-projection re-check + cross-ref decision for the VO change        | W2 FIRST task, BEFORE VO code (D-3 gate)                                                                  | SCHEDULED (W2) |

## Detail on the live ones

**PAC-1 / PAC-7 (the W2 gate).** The sacred-VO change can't be coded until the four-projection re-check passes and a cross-ref decision lands in plan-editor-compose. Probe prod for real `byProfile` loads before writing the migration — athlete-core seeds none, so it's likely near-greenfield (a find-or-create backfill over whatever axis-name strings exist).

**PAC-3 (age/masters — the one genuinely-ambiguous attribute).** dob is human, masters-division is a coach classification. Owner default (2026-06-22): keep masters a custom catalog axis; do NOT add a `dob` human attribute until auto age-resolution is actually needed. Revisit if Denys runs age-based load routinely.

## Closed history

(none yet)
