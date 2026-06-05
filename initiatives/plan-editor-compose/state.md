# plan-editor-compose — state (the board)

**Updated:** 2026-06-05

A scannable board, not prose. The narrative lives in `journal.md`; the "why" in `decisions.md`; carry-forwards in `deferred.md`. This file = where we are + the one next action. **Resume here** (the SessionStart hook force-loads it).

## Board

| #        | Step                                                                                                                                          | Status                                                                | Pointer                                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| 10.0     | Algebra spec                                                                                                                                  | ✅ DONE                                                               | `algebra-spec.md`                                    |
| 10.1     | Compose prototype on mocks (canvas + axis-inspector + leaf editors + duplication)                                                             | ✅ DONE — coach-walkthrough PASSED                                    | journal 2026-06-02; `feat/compose-prototype-10-1`    |
| 10.2     | Contracts + schema freeze (axis contract, ladder-split, `.strict()`, additive `Schema.composition`)                                           | ✅ DONE — contract FROZEN                                             | journal 2026-06-03; `feat/compose-contracts-10-2`    |
| 10.3     | Backend + seed-as-compositions (mapper read + tree-validation + dual-write + derived label + 5 Gauntlet seed trees)                           | ✅ DONE — api-server 811/811                                          | journal 2026-06-03; `feat/compose-backend-10-3`      |
| **10.4** | **Destructive sweep + QA-001 write-guard** — the arc below                                                                                    | ✅ **DONE** — S1+S2(R1/R2)+S3(C/D/E) shipped; archetype fully excised | `10-4-recon.md`; D-10.4-1/2/3/S1/S2/S2-R2/S3-C/D/E   |
| ↳ S1     | QA-001 write-guard + QA-003 fold + nullable-archetype expand                                                                                  | ✅ DONE — api-server **813/813**; **PR #241**                         | journal 2026-06-04; D-10.4-S1-RS, D-10.4-S1-INT      |
| ↳ S2-R1  | Productionize prototype: DR-1 read-widen + converter + persistence cascade + drawer mount + simple-axes UX + EMOM/container + QA-001 feedback | ✅ DONE — round-trip green; coach re-walkthrough PASSED; **PR #242**  | journal 2026-06-04; D-10.4-S2; DR-1 CLOSED           |
| ↳ S2-R2  | parallel/superset authoring + two-phase ref persist + QA-004 existence-check + property-based round-trip test                                 | ✅ DONE — platform 143 green; **PR #244**                             | journal 2026-06-04; D-10.4-S2-R2; QA-004 IMPLEMENTED |
| ↳ S3 A+B | Platform render-flip (cards → `Composition`) + delete archetype/alt-group authoring (Layers 0-4)                                              | ✅ DONE — platform **982 green**; `0fe3e6c3`+`25c7080f`               | journal 2026-06-04; `feat/compose-s3`; D-10.4-S3     |
| ↳ S3 C   | Seed composition-native (type flip + 63 call-sites + NET-NEW two-phase back-patch + per-axis coverage gate)                                   | ✅ **DONE** — api-server check-types+lint+dep:check green; `ff8b0392` | journal 2026-06-05; `feat/compose-s3`; DEFER-001     |
| ↳ S3 D   | contract+api-server archetype removal (ONE squash; MINE-3 DROP; D-10.4-2 guard abolition; REVIEW-004)                                         | ✅ **DONE** — monorepo check-types+lint+dep:check green; `1bb52d85`   | journal 2026-06-05; D-10.4-S3-D                      |
| ↳ S3 E   | Prisma drop + `db:reset` + `db:seed` + GATED full api-server suite (1st runtime validation of the seed)                                       | ✅ **DONE** — suite **726 green**; seed runs clean; `40bd87a9`        | journal 2026-06-05; D-10.4-S3-E                      |
| ph.5     | Scoring/execution layer                                                                                                                       | ⬜ OUT of scope (separate initiative)                                 | —                                                    |

## Next action

**S3 (C+D+E) is DONE — the archetype taxonomy is fully excised across every layer.** D (`1bb52d85`) removed the contract + api-server surface (MINE-3 DROP, D-10.4-2 guard abolition, REVIEW-004); E (`40bd87a9`) dropped the Prisma columns/models/enums, reseeded composition-native, and the **GATED api-server suite is 726 green** (the first runtime validation of the Phase-C seed — it runs clean). Monorepo check-types + lint + dep:check green; FROZEN `lms/composition` untouched all S3.

**The single next action: push `feat/compose-s3` + open the PR** (the user's plan: close-out docs land IN the S3 PR, push behind it). 7 commits ahead of `origin/main` (A `0fe3e6c3`, B `25c7080f`, C `ff8b0392`+docs, D `1bb52d85`, E `40bd87a9`, + this close-out docs commit). Vercel checks are not configured — ignore them ([[project-vercel-not-configured]]); the `mirror` remote is user-managed, workflow stays origin-based ([[mirror-remote]]).

**After the PR merges, the `plan-editor-compose` core arc (10.0–10.4) is COMPLETE** — the compose-only model is fully in place (UI A/B, seed C, contract+api-server D, Prisma E; picker/archetype gone everywhere). **ph.5 (scoring/execution layer) is a SEPARATE future initiative** (charter Non-goals; D-PHASE5-SCORING) — the `scoring` axis is present-but-inert, guarded by `scoring-inert-consumers.test.ts`. Live carry-forwards (DEFER-001, ADR-0023, cosmetic-stale) are all non-blocking + future-phase (see `deferred.md`).

## Open decisions awaiting ratification

- **None open.** Every 10.4 fork ratified + EXECUTED: D-10.4-1/2/3 · S1-RS/S1-INT · S2 · S2-R2 · **S3-C (`ff8b0392`) · S3-D (`1bb52d85`) · S3-E (`40bd87a9`)**. D-10.4-2 is now LIVE (a coach can put a row in any container; sub-schema under any kind). See `decisions.md`.

## Live carry-forwards (authoritative list in `deferred.md`)

- **CLOSED in S3 D/E:** REVIEW-004 (D — `marshalNullableJson` → `utils/to-input-json`) · QA-004/QA-004-run (E — gated cases ran green in the 726) · QA-006 (C+E) · FLAKE-002 (E — block-P2002 wall-clock flake → call-count). `coverage-matrix.md` = ADDRESSED (close-out staleness banner; full rewrite OPEN-optional).
- **OPEN → later row-payload phase (NOT D/E):** DEFER-001 — `StagedProgram`/`SlotSpec` row-level home; D/E did NOT add the field. When added → re-author the 5 named-program/emom-slot nodes + re-add the 5 dropped coverage cells.
- **OPEN (non-blocking future):** ADR-0023 reconcile (`fast-check` now a real dep) · cosmetic-stale (2 out-of-zone test/seed literals) · FLAKE-001 (`row-editor-modal` ×2 under full-suite contention — platform, pre-existing).
- **DEFERRED (future phase / inert):** QA-101 · QA-204 (→ DR-3) · QA-007 (server idempotency) · QA-008 · QA-103 · QA-untilrec (frozen) · QA-002 · REVIEW-005 residual (`compose-tree.types` divergence).
- **CLOSED (trail):** QA-004 (S2-R2) · DR-1 (S2-R1) · QA-001/003/005 (S1/10.3).

## Gotchas a resuming session must know

- **S3 fully DONE 2026-06-05 — the archetype taxonomy is GONE from every layer.** C (`ff8b0392`) seed composition-native; D (`1bb52d85`) contract + api-server removal; E (`40bd87a9`) Prisma drop + reseed + gated suite **726 green** (seed runs clean at runtime). `Schema`/`SchemaShape`/`CanonicalSchemaNode` carry no archetype/kind/alternatingGroup/trailingConnector; the `Archetype`/`AlternatingGroup` Prisma models + `lms/archetype`/`lms/alternating-group` contract subpaths are deleted. The seed's NET-NEW arrangement back-patch (refId→cuid via `cuidFromSeed`) persists.
- **The contract + Prisma archetype machinery NO LONGER EXISTS** (D removed the contract/api-server surface; E dropped the Prisma columns/models/enums). Supersedes the prior "still exists after C" note. parallel/superset lives per-schema in `Composition.arrangement.parallel` — the only home ([[D-ALTGROUP-FOLD]]).
- **DEFER-001 still OPEN → later row-payload phase (D/E did NOT add the field):** `StagedProgram`/`SlotSpec` have NO row-level home (algebra §1's "program is a sacred Row-VO" was WRONG — always an archetype param). The 5 named-program/emom-slot nodes stay flat `{}` (exercise rows survive; single-minute slot = child position via D-EMOM-UX). When a future phase adds a row-payload `program`/`slotSpec` field → re-author those nodes + re-add the 5 dropped coverage cells.
- **`coverage-matrix.md` (plan-data/) — staleness banner added at close-out.** Its archetype/schemaKind/connectorForm/program/slot sections are dead; the live SSOT is the per-axis `COVERAGE_CELLS` code. NOT deletable — live `sourceRef: "coverage-matrix §N"` labels in the VO/exercise/intensity/rest cells still cite it. Full rewrite optional, low-priority.
- **S3 A+B (UI half) DONE this session — the platform archetype surface is fully gone:** cards render from `Composition`; all 18 forms + picker + editor-modal + use-archetypes/use-alternating-groups + endpoints + 5 routes deleted; catalog-provider/schema-form-utils slimmed. The per-schema EDIT button was removed (compose is create-only). platform 982 green. **api-server/contracts UNTOUCHED** (that is C/D/E).
- **Discover CORRECTED recon — do NOT trust the stale recon framing for C:** (1) the card render-flip was UNDONE work, not "already done" — A did it. (2) the seed is 64-node domain re-authoring, NOT mechanical (`phase-c-seed-conversion.md`). (3) a whole dead alt-group subsystem existed in platform (4 routes + 4 unused hooks) — B removed it. (4) the coverage gate is ~2× what recon listed. (5) `block.mapper.ts`/`day.mapper.ts` embed `alternatingGroups` → break in the Phase D fold (rewire, not clean delete).
- **The arrangement back-patch re-key is the Phase-C crux:** the seed authors refIds but the contract arrangement refs are `.cuid()`, and `tracks[].childSchemaId` points at a child created AFTER the parent → two-phase back-patch (mirror D-10.4-S2-R2). Plus the `superset rowIds.min(2)` cardinality bridge (a degenerate single-row pair must be fixed). Detail in `phase-c-seed-conversion.md`.
- **pre-commit no longer runs `turbo check-types`** (dropped 2026-06-04 — redundant with pre-push; commits are fast). `check-types` + `lint` + `dep:check` gate on **pre-push** (`...[origin/main]`). commitlint enforces lowercase subject + ≤150-char body lines (bit us repeatedly this session — keep commit bodies short).
- The api-server suite (~10 min, `vitest run` serial) is a **GATED MANUAL** run — **pre-push does NOT run tests** (cone only).
- The richest 10.x reasoning lived in gitignored `.feature-dev/<ts>/`; durable distillate = `decisions.md` + `deferred.md` + `10-4-recon.md`. S2 Run-2's `/feature` artifacts (`.feature-dev/1780577040/`) are distilled into D-10.4-S2-R2.
- `implementation/` is SUPERSEDED history; AlternatingGroup facts migrated to `decisions.md` D-AG-FACTS.
- The FROZEN contract is `@repo/contracts/lms/composition` — reuse, never edit. (S1/S2 edited `lms/schema` — NOT frozen. Run-2 verified `git diff -- packages/contracts` empty.)
