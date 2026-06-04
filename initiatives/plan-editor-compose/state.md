# plan-editor-compose — state (the board)

**Updated:** 2026-06-04

A scannable board, not prose. The narrative lives in `journal.md`; the "why" in `decisions.md`; carry-forwards in `deferred.md`. This file = where we are + the one next action. **Resume here** (the SessionStart hook force-loads it).

## Board

| #        | Step                                                                                                                                          | Status                                                               | Pointer                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| 10.0     | Algebra spec                                                                                                                                  | ✅ DONE                                                              | `algebra-spec.md`                                    |
| 10.1     | Compose prototype on mocks (canvas + axis-inspector + leaf editors + duplication)                                                             | ✅ DONE — coach-walkthrough PASSED                                   | journal 2026-06-02; `feat/compose-prototype-10-1`    |
| 10.2     | Contracts + schema freeze (axis contract, ladder-split, `.strict()`, additive `Schema.composition`)                                           | ✅ DONE — contract FROZEN                                            | journal 2026-06-03; `feat/compose-contracts-10-2`    |
| 10.3     | Backend + seed-as-compositions (mapper read + tree-validation + dual-write + derived label + 5 Gauntlet seed trees)                           | ✅ DONE — api-server 811/811                                         | journal 2026-06-03; `feat/compose-backend-10-3`      |
| **10.4** | **Destructive sweep + QA-001 write-guard** — the arc below                                                                                    | 🔵 IN PROGRESS — **S1 + S2-R1 + S2-R2 done; S3 next**                | `10-4-recon.md`; D-10.4-1/2/3 + S2 + S2-R2 RATIFIED  |
| ↳ S1     | QA-001 write-guard + QA-003 fold + nullable-archetype expand                                                                                  | ✅ DONE — api-server **813/813**; **PR #241**                        | journal 2026-06-04; D-10.4-S1-RS, D-10.4-S1-INT      |
| ↳ S2-R1  | Productionize prototype: DR-1 read-widen + converter + persistence cascade + drawer mount + simple-axes UX + EMOM/container + QA-001 feedback | ✅ DONE — round-trip green; coach re-walkthrough PASSED; **PR #242** | journal 2026-06-04; D-10.4-S2; DR-1 CLOSED           |
| ↳ S2-R2  | parallel/superset authoring + two-phase ref persist + QA-004 existence-check + property-based round-trip test                                 | ✅ DONE — platform 143 green; **PR #244**                            | journal 2026-06-04; D-10.4-S2-R2; QA-004 IMPLEMENTED |
| ↳ S3     | Mechanical sweep (**Workflow**) + Prisma drop + `db:reset`                                                                                    | 🟡 **NEXT** (unblocked by S2-R2)                                     | `10-4-recon.md` §SEED + §sequence; D-D4-REVERSAL     |
| ph.5     | Scoring/execution layer                                                                                                                       | ⬜ OUT of scope (separate initiative)                                | —                                                    |

## Next action

**Launch S3 — the mechanical archetype sweep** (the last 10.4 phase; authoring is fully migrated, so the fan-out is mechanical, risk retired). Vehicle: **ultracode `Workflow`** (discover sites → transform in parallel → verify), NOT `/feature`. The reverse-dependency order (`10-4-recon.md` §sequence): delete old authoring (picker + ~18 `*-schema-form` + `SchemaEditorModal` + `use-archetypes`) → render-flip (card → `deriveCompositionLabel` + re-pointed `axes-summary`) → seed composition-native + coverage-gate rewrite (`expectArchetypeNamesAllReferenced` → per-axis cells) → contract archetype removal + api-server mapper/endpoint removal (ONE squash — mutually type-dependent) → Prisma model/column/enum drops (`Archetype`/`archetypeId`/`archetypeParams`/`Schema.kind`/`AlternatingGroup`/`trailingConnector`) + **`db:reset`** + full suite. Rides into S3: D-10.4-2 (drop `kind` + abolish the 2 write-assertions), REVIEW-004 (`marshalNullableJson` dup), REVIEW-005 (`axes-summary` clone), QA-006 (coverage cell), the ADR-0023 reconcile. **1 gated DB run** (`db:reset` + full suite). Green floor: husky cone per commit. **Worktree note:** the mechanical transforms CAN use worktree isolation for parallel file mutation, but a fresh pnpm worktree lacks `node_modules` (see D-10.4-S2-R2 process note) — the Workflow must provision or verify centrally.

**Before merging PR #244:** run the gated `qa-004 arrangement ref` api-server cases (`admin.test.ts`) against live Neon (no `db:reset` needed — no schema change). See `deferred.md` QA-004-run.

## Open decisions awaiting ratification

- **None open.** All 10.4 forks ratified: D-10.4-1 (arc) · D-10.4-2 (drop `kind` → S3) · D-10.4-3 (S2 scope: full four-projection, parallel/superset last — DISCHARGED by S2-R2) · D-10.4-S1-RS · D-10.4-S1-INT · D-10.4-S2 (Run-1 calls) · **D-10.4-S2-R2 (Run-2 calls)**. See `decisions.md`.

## Live carry-forwards (authoritative list in `deferred.md`)

- **→ S3:** REVIEW-004 (`marshalNullableJson` dup) · REVIEW-005 (`format-composition-summary` clones `axes-summary`) · QA-006 (coverage-cell brittle) · D-10.4-2 (`kind` column drop + abolish the 2 write-assertions) · ADR-0023 reconcile (fast-check now in the codebase).
- **BEFORE MERGE (PR #244):** QA-004-run (gated api-server `qa-004 arrangement ref` cases authored, UNRUN — owner skipped this session).
- **DEFERRED:** QA-101 (same-track `pairedWithRowId` accepted server-side — inert, client-caught) · QA-204 (multi-container phase-2 partial-wiring silent → DR-3) · QA-007 (double-submit — client latch SHIPPED, server idempotency open) · QA-008 (`deriveMinuteView` NaN if rounds=0) · QA-103 (Hook-3 TOCTOU) · QA-untilrec (frozen contract) · QA-002 (read per-block isolation).
- **OPEN (non-compose follow-up):** FLAKE-001 (`row-editor-modal` ×2 time out under full-suite contention — vitest concurrency tune or per-test timeout).
- **CLOSED:** QA-004 (S2-R2, IMPLEMENTED) · DR-1 (S2-R1) · QA-001 + QA-003 + QA-005 (S1 / 10.3).

## Gotchas a resuming session must know

- **Run-2 left an intentionally half-migrated tree (S3 cleans it):** the old archetype EDIT modal breaks on a composition-only schema; ~17 `*-schema-form` null-guards are dead-walking; no in-place edit of a saved compose block (create-only, edit via delete+recompose); the OLD AlternatingGroup render path still lives alongside the new `arrangement:parallel` authoring. All removed in S3. Acceptable per the migration philosophy (broken edges transient within the arc).
- **Worktree-parallelism caveat (CORRECTED this session):** a fresh git worktree in this pnpm monorepo has NO `node_modules` (worktree setup is a fast `git worktree add`, no `pnpm install`), so an agent in it cannot self-verify check-types/lint. Run-2 ran the independent waves as parallel agents on the SAME checkout (file/package-disjoint, orchestrator commits) instead. For S3's Workflow: worktree isolation needs node_modules provisioning, or verify centrally. (See `decisions.md` D-10.4-S2-R2.)
- **pre-commit no longer runs `turbo check-types`** (dropped 2026-06-04 — redundant with pre-push; commits are fast). `check-types` + `lint` + `dep:check` gate on **pre-push** (`...[origin/main]`). commitlint enforces lowercase subject + ≤150-char body lines (bit us repeatedly this session — keep commit bodies short).
- The api-server suite (~10 min, `vitest run` serial) is a **GATED MANUAL** run — **pre-push does NOT run tests** (cone only).
- The richest 10.x reasoning lived in gitignored `.feature-dev/<ts>/`; durable distillate = `decisions.md` + `deferred.md` + `10-4-recon.md`. S2 Run-2's `/feature` artifacts (`.feature-dev/1780577040/`) are distilled into D-10.4-S2-R2.
- `implementation/` is SUPERSEDED history; AlternatingGroup facts migrated to `decisions.md` D-AG-FACTS.
- The FROZEN contract is `@repo/contracts/lms/composition` — reuse, never edit. (S1/S2 edited `lms/schema` — NOT frozen. Run-2 verified `git diff -- packages/contracts` empty.)
