# Step 08.1b — `lmsSchemaRowApi` (CRUD + 2-pass reorder + parent-kind invariant + payload-discriminator alignment) + `verifySchemaRowOwnership` + `mapToSchemaRow` + `TxClient` hoist

- **Date**: 2026-05-19 (close-out docs 2026-05-20)
- **Feature-dev artifacts**: `.feature-dev/1779212158/` (Stage 1-7: research / design / plan / tasks / review / qa).
- **Prompt**: `implementation/step-08.1b/prompt.md` (planner-written 2026-05-19 in two-voice thesis format; 3 coach + 12 developer OQs ratified upfront).
- **Output**: `implementation/step-08.1b/output.md` (executor self-report — 25/25 acceptance ✓ incl. 3 root-sweep NEEDS-VERIFY confirmed; 4 D-decisions + 3 D-X minor + 1 § QA-001 escalation).

## Summary

**Second server-side touch for Schema vertical** — full slice under `packages/api-server/src/endpoints/lms/schema-row/`. 5 atomic commits on `feat/training-domain` (`d2e9b7e5..4d9d9766`) + docs commit `12e71770`:

1. `d2e9b7e5 refactor(api-server): hoist txclient typed-omit to endpoints/lms/_shared` — `TxClient` typed-Omit hoisted к `_shared/tx-client.ts`; `block/admin.ts` + `schema/assertions.ts` migrated к import; closes QA-I1 carry-forward.
2. `f24e282c feat(api-server): add verifyschemarowownership guard for schema row ownership chain` — `verifySchemaRowOwnership` 9-field return shape + **forced `authz/guards.ts` split** (D-1) + 5 guard tests.
3. `a99901e4 feat(api-server): add lms schemarow mapper with 9-variant payload parse + 8 nullable vo parses` — `mapToSchemaRow`, 10 Zod `.parse(...)` calls, zero value-casts.
4. `e1091719 feat(api-server): add lmsschemarowapi with crud and two-pass reorder` — `lmsSchemaRowApi.{create, update, delete, reorder}` + `assertions.ts` (pure-sync) + 31 integration tests.
5. `4d9d9766 test(api-server): cover qa must-test gaps for lmsschemarowapi` — Stage 7 QA-T1 gap-fill (guard soft-deleted-plan branch).
6. `12e71770 docs(step-08.1b): write executor output report` — Stage 8 self-report.

**17 files / +2126 / −333 LOC** (1082 LOC integration tests dominate). 32 admin tests + 5 guard tests = 661 api-server tests total (625 baseline + 36 new). Key shapes shipped:

- **Single-scope create**: `lmsSchemaRowApi.create(userId, planId, data)` — no discriminated scope (`schemaId` only); `verifySchemaOwnership` of parent + `assertRowKindPayloadAlignment` + `assertParentKindForRow` pre-tx, parent re-fetch + parent-kind re-check in-tx (TOCTOU defense). FIND-001 `resolveStorageContext` NOT triggered — single-scope create body fit без extraction (247 logical LOC for ALL 4 methods).
- **`mapToSchemaRow`** — 10 Zod `.parse(...)` (1 discriminated `rowPayload` + 8 nullable VO ternary + position direct enum + notes direct string). Zero `as` value-casts.
- **`verifySchemaRowOwnership`** — 9-field return `{status, schemaId, schemaKind, parentSchemaId, blockId, sessionId, dayId, weekId, planId}`; `buildResponse` local helper dedupes coach/head-coach branch literal (D-2).
- **Structural-immutable update**: `STRUCTURAL_UPDATE_KEYS = ["rowKind", "schemaId"]` filter + within-variant `rowPayload.rowKind === current.rowKind` cross-validate.
- **2-pass reorder** (`-(i+1)` → `(i+1)*10`) anticipating Step 8.3.6 `@@unique([schemaId, order])`.
- **`TxClient` hoist** к `endpoints/lms/_shared/tx-client.ts` — closes QA-I1; 0 duplicate sites remain (verified `grep "type TxClient = Omit"`).
- **`authz/guards.ts` split** (D-1, forced) — `_role-helpers.ts` (8 LOC) + `role-guards.ts` (78 raw / ~62 logical) + `lms-guards.ts` (331 raw / ~293 logical) + `guards.ts` rewritten as 2-line barrel. 17 consumer-import sites unchanged.

**Verifications all-green** (spot-checked by planner at close-out):

- `pnpm check-types` 16/16 · `pnpm lint` 16/16 (0 warnings)
- `pnpm --filter @repo/api-server test` 661 cases · `pnpm test` (root) 1609 cases (user-confirmed root sweep)
- `pnpm dep:check` 0 violations / 1261 modules
- Husky pre-commit clean on all 5 commits; zero `--no-verify`/`--no-edit`/`--no-gpg-sign`
- `git diff 6c2d9cab..HEAD` — `analysis/`, `packages/contracts/`, `packages/api-server/prisma/`, `apps/` all 0 lines
- Planner spot-check confirmed: `guards.ts` = 2-line barrel, `verifySchemaRowOwnership` at `lms-guards.ts:250`, `mapToSchemaRow` 10 parse-calls + zero value-casts, `TxClient` deduplicated к single canonical site.

**Streak**: fifth cleanest run в ряд (7.5 → 8.0a → 8.0b → 8.1a → 8.1b). One legitimate mid-cycle escalation (QA-001 guards.ts max-lines) cleanly resolved via `AskUserQuestion`.

## Open questions resolved

- **D-1 (`authz/guards.ts` split)**: appending `verifySchemaRowOwnership` busted eslint `max-lines: 300`. Executor split by domain — `_role-helpers.ts` (module-private `isAdminOrHeadCoach` + `ADMIN_OR_HEAD_COACH`) + `role-guards.ts` (auth-style: `requireAdmin*`, `resolveCoachId`, `verifyAthleteBelongsToCoach`) + `lms-guards.ts` (entity-ownership chain incl. new guard) + `guards.ts` 2-line barrel. Confirmed split shape via `AskUserQuestion`; user ratified. Zero consumer-import churn (barrel preserves `../authz/guards` path; 17 sites unchanged). Normal executor tactical refactor — see Process note.

- **D-2 (`buildResponse` local helper in `verifySchemaRowOwnership`)**: planner-ratified prompt § 3.1 Note. Dedupes 9-field return literal across coach + head-coach branches (11 lines vs 18 inline). NOT retroactively applied к `verifySchemaOwnership` (per `[[inline-fix-pre-existing]]` 5-line threshold + explicit prompt non-goal).

- **D-3 (single commit covers guard append + split)**: forced split captured in commit `f24e282c` body, no separate `refactor(...)` precursor commit. Per `[[husky-cross-package-squash]]` single-package — per-layer atomic OK; combining minor enabler refactor с feature commit acceptable.

- **D-4 (QA-W1/W2 carry-forwards)**: Stage 6 QA surfaced 2 WARNINGs — `update`/`delete`/`reorder` lack in-tx `plan.deletedAt` re-check (soft-delete race window). Not blocking 8.1b ship (api-server slice, no HTTP exposure today). Carry-forward к future `/fix` cycle.

- **D-X1/X2/X3 (executor-time minor)**: barrel order `./schema-row` before `./schema` (cross-barrel grouping consistency — bikeshed, acceptable); no separate head-coach test user in `admin.test.ts` (coverage in `guards.test.ts` case 2); `HEADERLESS_PARAMS` constant removed unused (lint-driven cleanup). All non-material; no new workflow trajectory decisions.

- **Test count 32 admin (vs prompt ~30-34 target)**: 31 base Phase 3 + 1 QA-T1 gap-fill Phase 4. Within target. Guard tests 5 (prompt said 4 — added 5th: soft-deleted-plan branch covers both arms of compound `!row || plan.deletedAt !== null` NotFound; Stage 5 REVIEW-W1 → Stage 6 QA-T1).

## Deferred decisions / carry-forwards (3 NEW + 1 CLOSED)

### NEW — surface к state/03-deferred.md

- **QA-W1 (WARNING)** — `lmsSchemaRowApi.update` / `.delete` lack in-tx `plan.deletedAt` re-check. Race: another tx soft-deletes plan between guard return and write. → future `/fix` cycle bundled with regression tests.
- **QA-W2 (WARNING)** — `lmsSchemaRowApi.reorder` array-form `prisma.$transaction([...])` cannot embed plan re-fetch (array form, not interactive). Either convert к interactive tx or accept race as known-defer. → future `/fix` cycle.
- **REVIEW-I3 (INFO, important для Step 8.1c)** — `lms-guards.ts` at ~293/300 logical LOC — 7-line headroom. Next LMS-chain guard append (`verifySchemaPairingOwnership` in Step 8.1c) busts the cap → another split required. Step 8.1c planner MUST anticipate: either spec `verifySchemaPairingOwnership` to land via a Phase 0 `lms-guards.ts` sub-split, OR split by sub-domain (plan/session/block vs schema/schema-row/schema-pairing).

### CLOSED по Step 8.1b

- **QA-I1** — `TxClient` structural-typing leak / local-alias duplication — **CLOSED**. Step 8.1b Phase 0 hoisted к `endpoints/lms/_shared/tx-client.ts`; `block/admin.ts` + `schema/assertions.ts` migrated; `grep "type TxClient = Omit"` → 1 canonical site only.

### Carried unchanged (from 8.1a / earlier)

- **FIND-001** (`lmsSchemaApi.create` 132 LOC) — NOT triggered by 8.1b (SchemaRow single-scope create did not repeat Schema's discriminated-scope 132-LOC pattern). Remains a Schema-specific carry-forward; revisit only if Schema create is ever re-touched.
- **QA-F2** — delete row with `PerformedExerciseInstance` back-ref → P2003 misleading message. Refined understanding in 8.1b (`handlePrismaError` surfaces `"Referenced SchemaRow does not exist"` — semantically off; actual = "in use"). → athlete-flow workflow.
- **QA-B4 / QA-C2 / QA-D1 / QA-E3** — carries from 8.1a, unchanged (Step 8.2 HTTP retry / P2028 mapping `/fix` / `.max(N)` cap / cross-guard `userId` defensive throw).

## Analysis-artifacts touched

**None** — Step 8.1b is api-server slice only, no Prisma schema change, no domain semantics change. `git diff 6c2d9cab..HEAD -- analysis/` returns 0 lines.

## Smoke-test status

**N/A** — api-server slice без HTTP exposure. First runtime consumer = Step 8.2 (HTTP routes). UI smoke возобновится Step 8.4 (ArchetypePicker — first coach-visible Schema editor).

## Process note

**Fifth cleanest run в ряд** (7.5 → 8.0a → 8.0b → 8.1a → 8.1b). Zero § 0 STOP-and-surface escalations.

**D-1 `guards.ts` split — normal executor tactical work.** Prompt § 3.1 spec'd the strategic intent: "append `verifySchemaRowOwnership`, mirror the ownership chain". Executor hit eslint `max-lines: 300` on the append, split the file by domain (`_role-helpers` / `role-guards` / `lms-guards` / `guards` barrel), confirmed the split shape via `AskUserQuestion`, user ratified. Planner/executor division working as designed — planner specs WHAT + WHY, executor owns tactical HOW including refactors when a file cap is hit. Not a planner-discipline finding: file exceeded 300, executor split it, clean.

**`authz/guards.ts` is now a barrel.** Future steps adding ownership guards: new LMS-hierarchy guards go to `lms-guards.ts`, role/auth guards to `role-guards.ts`. Consumer imports stay `from "../authz/guards"` (barrel unchanged). `lms-guards.ts` at ~293/300 — REVIEW-I3 is a heads-up that the next LMS guard (8.1c `verifySchemaPairingOwnership`) will trip the cap; executor will split again — no planner pre-work needed, just don't be surprised by the scope at close-out.

**Next planner action**: Step 8.1c thesis cycle (`lmsSchemaPairingApi` — last api-server slice of Schema vertical). First step under the `[[coach-walkthrough-gate]]` rule — thesis coach view MUST carry a 1-paragraph walkthrough. See `state/04-next-action.md`.
