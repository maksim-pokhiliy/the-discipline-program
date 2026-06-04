# plan-editor-compose — state (the board)

**Updated:** 2026-06-04

A scannable board, not prose. The narrative lives in `journal.md`; the "why" in `decisions.md`; carry-forwards in `deferred.md`. This file = where we are + the one next action. **Resume here** (the SessionStart hook force-loads it).

## Board

| #        | Step                                                                                                                                          | Status                                                               | Pointer                                                        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| 10.0     | Algebra spec                                                                                                                                  | ✅ DONE                                                              | `algebra-spec.md`                                              |
| 10.1     | Compose prototype on mocks (canvas + axis-inspector + leaf editors + duplication)                                                             | ✅ DONE — coach-walkthrough PASSED                                   | journal 2026-06-02; `feat/compose-prototype-10-1`              |
| 10.2     | Contracts + schema freeze (axis contract, ladder-split, `.strict()`, additive `Schema.composition`)                                           | ✅ DONE — contract FROZEN                                            | journal 2026-06-03; `feat/compose-contracts-10-2`              |
| 10.3     | Backend + seed-as-compositions (mapper read + tree-validation + dual-write + derived label + 5 Gauntlet seed trees)                           | ✅ DONE — api-server 811/811                                         | journal 2026-06-03; `feat/compose-backend-10-3`                |
| **10.4** | **Destructive sweep + QA-001 write-guard** — the arc below                                                                                    | 🔵 IN PROGRESS — **S1 + S2-R1 done; S2-R2 next**                     | `10-4-recon.md`; D-10.4-1/2/3 + S2 RATIFIED                    |
| ↳ S1     | QA-001 write-guard + QA-003 fold + nullable-archetype expand                                                                                  | ✅ DONE — api-server **813/813**; **PR #241**                        | journal 2026-06-04; D-10.4-S1-RS, D-10.4-S1-INT                |
| ↳ S2-R1  | Productionize prototype: DR-1 read-widen + converter + persistence cascade + drawer mount + simple-axes UX + EMOM/container + QA-001 feedback | ✅ DONE — round-trip green; coach re-walkthrough PASSED; **PR #242** | journal 2026-06-04; D-10.4-S2; DR-1 CLOSED                     |
| ↳ S2-R2  | parallel/superset authoring + two-phase ref persist + QA-004 existence-check + property-based round-trip test                                 | ⏳ **next**                                                          | `decisions.md` D-10.4-3 (sequenced-last); `deferred.md` QA-004 |
| ↳ S3     | Mechanical sweep (**Workflow**) + Prisma drop + `db:reset`                                                                                    | ⛔ blocked on S2-R2                                                  | `10-4-recon.md` §SEED + §sequence; D-D4-REVERSAL               |
| ph.5     | Scoring/execution layer                                                                                                                       | ⬜ OUT of scope (separate initiative)                                | —                                                              |

## Next action

**Launch S2 Run-2** — parallel/superset authoring (close the `arrangement-axis-field` gap: emit valid `parallel.{interleaveOrder,tracks}` / `superset.pairs`) + the two-phase ref persist (create container → create children → collect a draft-NodeId→cuid map → `useUpdateSchema` the arrangement refs; an additive post-pass on the Run-1 cascade, design §5.4e distilled in D-10.4-S2) + **QA-004** tx-time existence/same-scope check (mirror `schema/admin.ts` `foreignIds`) + a **property-based round-trip test** (fast-check generator over compose trees; pure Tier-1, ungated — covers Run-2 axes for free + becomes S3's regression net). Vehicle: `/feature` full; run independent waves in **worktree isolation** (DR-1 ∥ converter were serially blocked this session for nothing). **Consider collapsing Run-2 + S3 into one session** (Run-2 focused-pipeline → S3 as a Workflow; S3 is mechanical, risk retired). Gate: coach re-walkthrough of Gauntlet C/E. 1 gated DB run (S3's `db:reset`).

## Open decisions awaiting ratification

- **None open.** All 10.4 forks ratified: D-10.4-1 (arc) · D-10.4-2 (drop `kind` → S3) · D-10.4-3 (S2 scope: full four-projection, parallel/superset last) · D-10.4-S1-RS · D-10.4-S1-INT · D-10.4-S2 (S2 Run-1 calls). See `decisions.md`.

## Live carry-forwards (authoritative list in `deferred.md`)

- **→ S2 Run-2:** QA-004 (arrangement-ref existence-check, rides with parallel/superset) + the property-based round-trip test.
- **→ S3:** REVIEW-004 (`marshalNullableJson` dup) · REVIEW-005 (`format-composition-summary` clones `axes-summary`) · QA-006 (coverage-cell brittle) · D-10.4-2 (`kind` column drop + abolish the 2 write-assertions).
- **DEFERRED:** QA-007 (compose double-submit dup) · QA-008 (`deriveMinuteView` NaN if rounds=0) · QA-103 (Hook-3 TOCTOU) · QA-untilrec (frozen contract) · QA-002 (read per-block isolation).
- **OPEN (non-compose follow-up):** FLAKE-001 (`row-editor-modal` ×2 time out under full-suite contention — vitest concurrency tune or per-test timeout).
- **CLOSED:** DR-1 (S2-R1) · QA-001 + QA-003 + QA-005 (S1 / 10.3).

## Gotchas a resuming session must know

- **The D-10.4-S1-INT poison is CLOSED** (S2 Run-1, DR-1, PR #242): a composition-only `Schema` round-trips create→read→render (read widened nullable + `mapToSchema` 500-guard dropped). Remaining accepted-rough intermediates that **S3 removes**: the old archetype EDIT modal breaks if opened on a composition-only schema; ~17 `*-schema-form` null-guards are dead-walking; no in-place edit of a saved compose block (Run-1 = create-only, edit via delete+recompose).
- **pre-commit no longer runs `turbo check-types`** (dropped 2026-06-04 — redundant with pre-push; commits are fast now). `check-types` + `lint` + `dep:check` still gate on **pre-push** (`...[origin/main]`).
- **Worktree-parallelism is the next-session speedup:** independent implement waves should run in `isolation:"worktree"` agents to dodge the shared-`check-types` serialization that cost ~10 min this session. S3 mechanical sweep = a `Workflow` (discover → transform-in-worktrees → verify).
- The api-server suite (~10 min, `vitest run` serial) is a **GATED MANUAL** run — **pre-push does NOT run tests** (cone only).
- The richest 10.x reasoning lived in gitignored `.feature-dev/<ts>/`; durable distillate = `decisions.md` + `deferred.md` + `10-4-recon.md`. S2 Run-1's `/feature` artifacts (`.feature-dev/1780559503/`) are distilled into D-10.4-S2.
- `implementation/` is SUPERSEDED history; AlternatingGroup facts migrated to `decisions.md` D-AG-FACTS.
- The FROZEN contract is `@repo/contracts/lms/composition` — reuse, never edit. (S1/S2 edited `lms/schema` — NOT frozen.)
