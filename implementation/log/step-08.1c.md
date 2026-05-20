# Step 08.1c — `SchemaPairing` → `AlternatingGroup` model redesign (Prisma + contract + analysis + seed)

- **Date**: 2026-05-20
- **Feature-dev artifacts**: `.feature-dev/1779259966/` (research / design / plan / tasks / review / qa).
- **Prompt**: `implementation/step-08.1c/prompt.md` (planner-written 2026-05-20; spec-only, two-voice; D14 + D-A1/A2/A3 + C-A1 ratified upfront in the thesis cycle).
- **Output**: `implementation/step-08.1c/output.md` (executor self-report — 18/21 acceptance clean + 3 user-ratified deviation marks).

## Summary

**The originally-scoped Step 8.1c (`lmsSchemaPairingApi` thin api-server slice) was cancelled during the 2026-05-20 thesis cycle.** Thesis-time verification surfaced that `SchemaPairing` was modelled as a 2-FK pair (`schemaAId` + `schemaBId`), but the `alternating-sets` archetype is an **N-ary** relation — a coach links 2..N schemas into one alternating cycle, no upper bound. Ratified as **D14**: replace `SchemaPairing` with `AlternatingGroup`. This step is the schema-change sub-step mandated by the WORKFLOW.md "Domain-model change protocol".

`AlternatingGroup` — a block-scoped N-ary grouping entity; membership via a single nullable FK `Schema.alternatingGroupId` (a schema belongs to ≤1 group — structural, no junction table); managed mutable entity with `createdAt`/`updatedAt`. Definition layer only — no endpoint / mapper / guard (those are Step 8.1d).

**5 commits on `feat/training-domain`** (`aec22f8a..cf14aab8`, base `a94bebb6`):

1. `aec22f8a refactor(api-server): replace schemapairing model with alternatinggroup` — Prisma (`enum`+`model` swap, `Schema`/`Block` edits, `onDelete` Cascade/SetNull) + seed descriptor (`rounds-ladder.ts` drops `pairedWithSchemaId`) + 2 api-server test files migrated.
2. `ae8b8cd6 refactor(contracts): replace schema-pairing slice with alternating-group` — `schema-pairing/` slice deleted, `alternating-group/` slice created (8 files, N-ary shape with `schemaIds: cuid[].min(2)`); `archetype-params.schema.ts` drops `pairedWithSchemaId`; barrel + `package.json` exports remapped.
3. `76bb334c docs(analysis): sync artifacts for alternatinggroup redesign` — 8 living-source files.
4. `8c3a701b fix(api-server): clear pre-existing head-coach in schema and label test setup` — WORKFLOW-001 inline fix (see below).
5. `cf14aab8 docs(step-08.1c): write executor output report`.

**34 files.** Verifications all-green (planner spot-checked at close-out): `pnpm check-types` 16/16 · `pnpm lint` 16/16 (0 warnings) · `pnpm test` 1610/1610 (run 2, post-WORKFLOW-001-fix) · `pnpm dep:check` 0 violations · `git grep -E "SchemaPairing|schemaPairing|schema-pairing|SCHEMA_PAIRING|pairedWithSchemaId" -- packages/` → **0** · `db:reset` + `db:seed` green (`Archetypes: 34`). Husky pre-commit clean on all 5 commits; zero `--no-verify`/`--no-edit`/`--no-gpg-sign`. Stage 5 Review **A**, Stage 6 QA **A** for the migration.

**Planner spot-check** confirmed verbatim (`schema.prisma:587-728`): `model AlternatingGroup { id, blockId, relationKind, createdAt, updatedAt }`, `block` relation `onDelete: Cascade`, `@@index([blockId])`, `@@map("training_alternating_groups")`; `Schema.alternatingGroupId String?` + relation `onDelete: SetNull` + `@@index([alternatingGroupId])`; `Block.alternatingGroups`; `enum AlternatingGroupRelation { ALTERNATING_SETS }`. Exactly D-A1.

## Open questions resolved

- **§ 3.3 `implementation-notes.md` scope gap.** The prompt § 3.3 specified only "add a short addendum" for `implementation-notes.md`, but research found 3 pre-existing `SchemaPairing` mentions. **Escalated through the planner**; planner ruled (Option 1, 2026-05-20): sync the 2 live-model-description lines (~1163, ~1363) to `AlternatingGroup`; preserve line ~37 (§0.3 D3 port-trail — point-in-time historical record, supersession captured by the new §4.9 D14 addendum). General principle stated for all 8 analysis files — live description syncs, point-in-time decision/phase records preserved. Planner-prompt imprecision; recorded under the existing "prompt-internal consistency" adjacent binding, not a new flavour.

- **WORKFLOW-001 (HEAD_COACH unique-index collision) — resolved inline as commit 4.** `db:reset`+`db:seed` seeds one `HEAD_COACH`; the `idx_single_head_coach` partial unique index (D13) allows one; `schema/admin.test.ts` `beforeAll` + `label/platform.test.ts` created a second without clearing the seeded one → P2002 → 33 skipped + 1 failed on run 1. Stage 6 QA-001 filed it CRITICAL, **proven pre-existing** (fails identically on base `a94bebb6`; seed untouched by this step). **Escalated by the executor via `AskUserQuestion`; the user ratified the inline fix directly in the executor session** — planner not in the loop at decision time, reconstructed and validated it at close-out. Commit 4: both files demote any pre-existing `HEAD_COACH` → `COACH` before promoting their fixture — D13 path (b), mirroring the pattern already in `guards.test.ts` / `plan-enrollment/admin.test.ts` / `users-admin-actor-role.test.ts`. +24 lines, 2 files. Run 2 green 1610/1610. Planner verdict at close-out: minimal, pattern-consistent, sound.

- **Phase-3 grep-heuristic vs D14 addendum.** The prompt's Phase-3 verification grep implied "only line 37 survives", but the §4.9 D14 addendum itself names `SchemaPairing` (a supersession record). Executor resolved consistent with the planner's Option-1 principle: addendum + supersession-history phrases are legitimate decision-trail; stale live-references cleaned. `git grep` of `packages/` = 0 (the acceptance grep); `analysis/` legitimately retains supersession history.

- **Pre-training-domain git history on `seed/users.ts` / `lms-checks.sql`** — executor's `git log` surfaced commits `m2.0`, `wave-b`, `chore: strip plan-detail, library and workout-log stack entirely`. Assessed: normal `main` history + the documented prior-attempt deletion; no WORKFLOW.md watch-list vocab; current files clean. Executor flagged for transparency; planner concurs — non-issue.

## Deviations (acceptance #17 / #20 / #21 — all user-ratified, one root cause)

All three are the single consequence of the user-ratified WORKFLOW-001 inline-fix (commit 4) rather than deferral: #20 — 5 commits (4 code + 1 docs), not 3 + 1; #21 — commit 4 touches `lms/label/platform.test.ts`, 1 file outside prompt § 2; #17 — `pnpm test` green only after commit 4. **The migration itself (8.1c's subject) — 0 deviations from § 2 / § 3 / § 6.** No squash, no skip-flags.

## D13 / Step 8.3.7-pre — DROPPED

D13 created Step 8.3.7-pre as a dedicated sub-step to resolve WORKFLOW-001 before the Schema partial-unique constraint (8.3.7). Commit 4 resolved WORKFLOW-001 in full — D13 path (b), applied to both colliding files; the other 4 HEAD_COACH-creating test files already carried the pattern. The deterministic collision no longer reproduces; `pnpm test` is green on a `db:reset`+`db:seed` DB. **Step 8.3.7-pre's sole purpose is discharged → DROPPED from the queue** (planner decision, delegated by the executor's close-out note). D13 annotated SUPERSEDED in `02-decisions.md`. The regression-prevention angle is now the established suite-wide convention — recorded in `03-deferred.md` Standing context.

## Analysis-artifacts touched

8 living-source files (commit 3 `76bb334c`): `06-formalization/{schema.prisma, types.ts, er-final.md, implementation-notes.md, stress-final.md}` + `05-synthesis/{domain-model.md, edge-cases.md, stress-test.md}`. `analysis/artifacts/00-meta/**` — frozen, untouched (`git diff` byte-identical; `SchemaPairing` mentions remain as point-in-time history). `implementation-notes.md` gained a §4.9 D14 addendum.

## Smoke-test status

**N/A** — definition layer, no runtime surface. First runtime consumer = Step 8.1d (`lmsAlternatingGroupApi`). UI smoke resumes Step 8.4.

## Process note

**Validation verdict: clean — Review A / QA A, all gates green, residue grep 0, Prisma shape verbatim-confirmed against D-A1, both escalations soundly resolved.** Step accepted.

Two escalations this cycle. The § 3.3 gap routed correctly through the planner. **WORKFLOW-001 was answered by the user directly in the executor session** — within the user's authority (top decision-maker + the shuttle), and the fix is sound, but it bypassed the planner at decision time; the planner reconstructed and validated it at close-out. Observation for future cycles: routing executor escalations through the planner lets the planner catch planner-context issues before ratification; here it was harmless because WORKFLOW-001 / D13 was fully pre-documented.

QA-004 (`schemaIds` no `.max` cap) and QA-005 (entity-schema duplicate tolerance) — both Stage-6 INFO, both explicit forward-notes for the Step 8.1d thesis; carried in `04-next-action.md`.

**Next planner action**: Step 8.1d thesis cycle (`lmsAlternatingGroupApi` + `verifyAlternatingGroupOwnership` + `mapToAlternatingGroup` against the `AlternatingGroup` shape this step established). See `state/04-next-action.md`.
