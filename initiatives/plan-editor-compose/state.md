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
| ↳ S3 A+B | Platform render-flip (cards → `Composition`) + delete archetype/alt-group authoring (Layers 0-4)                                              | ✅ DONE — platform **982 green**; `0fe3e6c3`+`25c7080f`              | journal 2026-06-04; `feat/compose-s3`; D-10.4-S3     |
| ↳ S3 C-E | Seed composition-native (C) → contract+api-server removal (D) → Prisma drop + `db:reset` + gated suite (E)                                    | 🟡 **NEXT** — C via `/feature`; D/E mechanical                       | `phase-c-seed-conversion.md`; `10-4-recon.md` §SEED  |
| ph.5     | Scoring/execution layer                                                                                                                       | ⬜ OUT of scope (separate initiative)                                | —                                                    |

## Next action

**Resume at S3 Phase C — seed composition-native.** A+B (the UI half) are DONE + committed + green on `feat/compose-s3` (render-flip + all archetype/alt-group authoring deleted; platform 982). The remaining C→D→E is the backend half and ONE validation-unit (the seed is validated only by the gated suite at the end of E).

**Phase C (next): `/feature` full — NOT Workflow.** Discover proved the seed is domain re-authoring (64 nodes, ~20 structural + the arrangement back-patch re-key crux), not a mechanical sweep; `/feature`'s review/qa gates de-risk it. Feed `phase-c-seed-conversion.md` as the design input — it carries the full archetype→composition mapping (grounded in `algebra-spec.md` §2.5/§3), the structural-node rules, the back-patch two-phase, the coverage-gate rewrite, and the seed file map. **NO fresh recon** — the in-session discovery is durable (seed unchanged since).

**Then Phase D** (mechanical — `/feature small` or direct): contract + api-server archetype removal (ONE squash) + D-10.4-2 (`kind` strip + abolish the 2 assertions) + REVIEW-004. **Then Phase E** (direct, gated): Prisma drops + `db:reset` + `db:generate` + the **gated full api-server suite** (user pre-authorized 2026-06-04 — re-confirm presence; runs the #244 author-only qa-004 cases too).

**PR #244 / qa-004-run: MOOT** — #244 is merged (`a9904d0f`); the qa-004 author-only cases run inside Phase E's gated full suite.

## Open decisions awaiting ratification

- **None open.** All 10.4 forks ratified: D-10.4-1 (arc) · D-10.4-2 (drop `kind` → S3) · D-10.4-3 (S2 scope: full four-projection, parallel/superset last — DISCHARGED by S2-R2) · D-10.4-S1-RS · D-10.4-S1-INT · D-10.4-S2 (Run-1 calls) · **D-10.4-S2-R2 (Run-2 calls)**. See `decisions.md`.

## Live carry-forwards (authoritative list in `deferred.md`)

- **→ S3 C/D/E:** REVIEW-004 (`marshalNullableJson` dup → Phase D) · QA-006 (coverage-cell brittle → Phase C) · D-10.4-2 (`kind` strip + abolish 2 assertions → Phase D) · ADR-0023 reconcile (→ close-out). **REVIEW-005 = PARTIAL DONE** (Phase A shared the 2 const label-maps; full dedup blocked by `compose-tree.types` divergence from the contract — residual deferred, see `deferred.md`).
- **MOOT:** QA-004-run — PR #244 merged (`a9904d0f`); the author-only qa-004 cases run inside Phase E's gated full suite.
- **DEFERRED:** QA-101 (same-track `pairedWithRowId` accepted server-side — inert, client-caught) · QA-204 (multi-container phase-2 partial-wiring silent → DR-3) · QA-007 (double-submit — client latch SHIPPED, server idempotency open) · QA-008 (`deriveMinuteView` NaN if rounds=0) · QA-103 (Hook-3 TOCTOU) · QA-untilrec (frozen contract) · QA-002 (read per-block isolation).
- **OPEN (non-compose follow-up):** FLAKE-001 (`row-editor-modal` ×2 time out under full-suite contention — vitest concurrency tune or per-test timeout).
- **CLOSED:** QA-004 (S2-R2, IMPLEMENTED) · DR-1 (S2-R1) · QA-001 + QA-003 + QA-005 (S1 / 10.3).

## Gotchas a resuming session must know

- **S3 A+B (UI half) DONE this session — the platform archetype surface is fully gone:** cards render from `Composition`; all 18 forms + picker + editor-modal + use-archetypes/use-alternating-groups + endpoints + 5 routes deleted; catalog-provider/schema-form-utils slimmed. The per-schema EDIT button was removed (compose is create-only). platform 982 green. **api-server/contracts UNTOUCHED** (that is C/D/E).
- **Discover CORRECTED recon — do NOT trust the stale recon framing for C:** (1) the card render-flip was UNDONE work, not "already done" — A did it. (2) the seed is 64-node domain re-authoring, NOT mechanical (`phase-c-seed-conversion.md`). (3) a whole dead alt-group subsystem existed in platform (4 routes + 4 unused hooks) — B removed it. (4) the coverage gate is ~2× what recon listed. (5) `block.mapper.ts`/`day.mapper.ts` embed `alternatingGroups` → break in the Phase D fold (rewire, not clean delete).
- **The arrangement back-patch re-key is the Phase-C crux:** the seed authors refIds but the contract arrangement refs are `.cuid()`, and `tracks[].childSchemaId` points at a child created AFTER the parent → two-phase back-patch (mirror D-10.4-S2-R2). Plus the `superset rowIds.min(2)` cardinality bridge (a degenerate single-row pair must be fixed). Detail in `phase-c-seed-conversion.md`.
- **pre-commit no longer runs `turbo check-types`** (dropped 2026-06-04 — redundant with pre-push; commits are fast). `check-types` + `lint` + `dep:check` gate on **pre-push** (`...[origin/main]`). commitlint enforces lowercase subject + ≤150-char body lines (bit us repeatedly this session — keep commit bodies short).
- The api-server suite (~10 min, `vitest run` serial) is a **GATED MANUAL** run — **pre-push does NOT run tests** (cone only).
- The richest 10.x reasoning lived in gitignored `.feature-dev/<ts>/`; durable distillate = `decisions.md` + `deferred.md` + `10-4-recon.md`. S2 Run-2's `/feature` artifacts (`.feature-dev/1780577040/`) are distilled into D-10.4-S2-R2.
- `implementation/` is SUPERSEDED history; AlternatingGroup facts migrated to `decisions.md` D-AG-FACTS.
- The FROZEN contract is `@repo/contracts/lms/composition` — reuse, never edit. (S1/S2 edited `lms/schema` — NOT frozen. Run-2 verified `git diff -- packages/contracts` empty.)
