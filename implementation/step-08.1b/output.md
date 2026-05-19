# Step 8.1b — Executor output

**Branch**: `feat/training-domain` (long-lived per [[training-domain-workflow]]).
**Commits**: 5 (`d2e9b7e5` → `4d9d9766`); 16 files (12 new + 4 modified); +1956 / −333 LOC.
**Wrapper**: `/feature` full pipeline (planner → research → design → plan → implement → review → QA → test → docs → finalize).

---

## Что сделано

Built the api-server slice for the SchemaRow domain on top of Step 8.1a's `lmsSchemaApi` precedent. Shipped: `lmsSchemaRowApi.{create, update, delete, reorder}` with single-scope create (`schemaId` only — no discriminated scope), 9-variant `rowPayload` discriminated parse in the mapper, 8 nullable `Json?` flat-scalar columns marshalling via a file-private `marshalNullableJson` helper, and a 2-pass reorder anticipating Step 8.3.6's `@@unique([schemaId, order])`. Added `verifySchemaRowOwnership` guard with a 9-field return shape (`status`, `schemaId`, `schemaKind`, `parentSchemaId`, `blockId`, `sessionId`, `dayId`, `weekId`, `planId`). Closed QA-I1 carry-forward by hoisting the duplicated `type TxClient = Omit<typeof prisma, ...>` to `endpoints/lms/_shared/tx-client.ts`. 32 integration tests (31 admin + 1 QA gap-fill on the guard's soft-deleted-plan branch) added; 4 guard tests added; 660+1 = 661 total api-server tests pass.

**Notable diverge**: appending `verifySchemaRowOwnership` to the existing `authz/guards.ts` would have pushed the file from 277 to 352 logical lines, busting eslint `max-lines: 300`. The planner adversarial pass missed this — a [[planner-lint-impact-trace]] class miss. User ratified Option 1: split `guards.ts` into `_role-helpers.ts` (module-private `isAdminOrHeadCoach` + `ADMIN_OR_HEAD_COACH`) + `role-guards.ts` (62 LOC; `requireAdmin*`, `resolveCoachId`, `verifyAthleteBelongsToCoach`) + `lms-guards.ts` (293 LOC; the entire ownership-chain set incl. new `verifySchemaRowOwnership`) + `guards.ts` rewritten as a 2-line barrel. Zero consumer-import changes (17 sites unchanged). `lms-guards.ts` at 293/300 — 7-line headroom; pre-flagged for Step 8.1c planner to anticipate further split if another LMS-chain guard lands.

---

## Изменённые/созданные файлы

**NEW (12)**:

- `packages/api-server/src/endpoints/lms/_shared/tx-client.ts` — canonical `TxClient` typed-Omit.
- `packages/api-server/src/authz/_role-helpers.ts` — module-private `isAdminOrHeadCoach` + `ADMIN_OR_HEAD_COACH` set; underscore prefix signals internal.
- `packages/api-server/src/authz/role-guards.ts` — `requireAdmin / requireAdminStrict / requireCoachLikeRole / resolveCoachId / verifyAthleteBelongsToCoach`.
- `packages/api-server/src/authz/lms-guards.ts` — `verifyPlanOwnership / verifyPlanEditable / verifySessionOwnership / verifyBlockOwnership / verifySchemaOwnership / verifySchemaRowOwnership`.
- `packages/api-server/src/endpoints/lms/schema-row/admin.ts` — `lmsSchemaRowApi.{create, update, delete, reorder}`, 249 logical LOC.
- `packages/api-server/src/endpoints/lms/schema-row/assertions.ts` — `assertParentKindForRow`, `assertRowKindPayloadAlignment` (pure-sync).
- `packages/api-server/src/endpoints/lms/schema-row/index.ts` — single-line barrel.
- `packages/api-server/src/endpoints/lms/schema-row/admin.test.ts` — 31 integration test cases (1082 LOC).
- `packages/api-server/src/mappers/lms/schema-row.mapper.ts` — `mapToSchemaRow` with 10 `.parse(...)` calls (1 discriminated payload + 8 nullable VOs + position direct enum + notes direct string).

**MODIFIED (4)**:

- `packages/api-server/src/authz/guards.ts` — rewritten as 2-line barrel re-exporting `role-guards` + `lms-guards`.
- `packages/api-server/src/authz/guards.test.ts` — added new `describe("verifySchemaRowOwnership", ...)` block with 5 tests (4 base + 1 QA-T1 gap-fill).
- `packages/api-server/src/endpoints/lms/_shared/index.ts` — added `export * from "./tx-client";`.
- `packages/api-server/src/endpoints/lms/block/admin.ts` — dropped local `type TxClient = Omit<...>` (lines 29-33); added `import { type TxClient } from "../_shared";`.
- `packages/api-server/src/endpoints/lms/schema/assertions.ts` — dropped local `type TxClient = Omit<...>` (lines 6-9) AND dead `import { type prisma } from "../../../db/client";` (line 4); added `import { type TxClient } from "../_shared";`.
- `packages/api-server/src/endpoints/lms/index.ts` — added `export * from "./schema-row";`.
- `packages/api-server/src/mappers/lms/index.ts` — added `export * from "./schema-row.mapper";`.

---

## Принятые решения

**D-1 (Stage 4 Phase 1 forced split)**: `authz/guards.ts` split into `_role-helpers + role-guards + lms-guards + guards (barrel)`. Driver: eslint `max-lines: 300` cap busted by the planner-spec append. User-ratified via AskUserQuestion. Scope expansion from "modify 1 file" → "modify 1 + create 3"; zero consumer-import break (barrel preserved path). Per-domain split: role-related (auth-style) vs LMS hierarchy (entity-ownership-style). Flag: `lms-guards.ts` at 293/300 — next LMS guard requires further split.

**D-2 (`buildResponse` local helper inside `verifySchemaRowOwnership`)**: per OQ-R-1 / prompt § 3.1 Note. Dedupes the 9-field literal across coach + head-coach branches. Did NOT retroactively apply to `verifySchemaOwnership` per [[inline-fix-pre-existing]] 5-line threshold + explicit prompt non-goal.

**D-X1 (executor agent, Stage 4 Phase 3)**: `endpoints/lms/index.ts` barrel orders `./schema-row` BEFORE `./schema`. Strict ASCII puts `./schema` first (prefix-shorter sorts first); mirrors `mappers/lms/index.ts` grouping where `./schema-row.mapper` precedes `./schema.mapper`. Cross-barrel grouping consistency over strict alphabetical. Bikeshed; acceptable.

**D-X2 (Stage 4 Phase 3)**: no separate head-coach test user provisioned in `admin.test.ts`. Head-coach role coverage exists in Phase 1 `guards.test.ts` (test case 2). Avoids redundant role-traversal at the api layer.

**D-X3 (Stage 4 Phase 3)**: `HEADERLESS_PARAMS` constant removed (no test exercises a HEADERLESS parent kind; happy-path uses ATOMIC, NESTED-rejection uses nested-rounds-over-rounds). Lint-driven cleanup of unused constant.

**D-3 (Stage 4 Phase 1 commit message)**: single commit `feat(api-server): add verifyschemarowownership guard for schema row ownership chain` covered BOTH the guard append AND the split. Did not produce a separate `refactor(...): split authz/guards.ts` precursor commit; the split was a forced enabler, captured in body. Per [[husky-cross-package-squash]] single-package: per-layer atomic is OK; combining minor.

**D-4 (Stage 6 QA carry-forwards)**: 2 WARNINGs surfaced — `update / delete / reorder` lack in-tx `plan.deletedAt` re-check (soft-delete race window). Not blocking Step 8.1b ship (api-server slice; no HTTP exposure today). Carry-forward to a future `/fix` cycle, bundled with regression tests for those branches (QA-W1, QA-W2 in qa.md).

---

## Возникшие вопросы и как решены

**QA-001 (Phase 1)**: `authz/guards.ts` busts `max-lines: 300` after append. Escalated to user via AskUserQuestion with 3 options. **Resolved**: Split by domain (Option 1).

**OQ-R-1 (resolved in Stage 2 from prompt § 0.5)**: should `schema-row/assertions.ts` import `TxClient`? **Resolved**: NO. Both assertions are pure-sync (no tx-bound helpers). No `TxClient` import in this file.

**OQ-R-2 (resolved in Stage 2 from research V10 drift)**: when to run `pnpm dep:check`? Prompt § 0.10 had pre-commit/pre-push contents swapped. **Resolved**: manual `pnpm dep:check` after each Phase commit batch. Pre-push runs it again as belt-and-braces.

**OQ-R-3 (resolved in Stage 2)**: test count target. **Resolved**: 31 base tests in Phase 3 + 1 QA gap-fill in Phase 4 = 32 final.

**OQ-R-4 (resolved in Stage 2)**: copy `ATOMIC_PARAMS / HEADERLESS_PARAMS / NESTED_PARAMS` from Schema 8.1a test or extract? **Resolved**: copy verbatim; single-file usage. HEADERLESS_PARAMS later removed unused (D-X3).

---

## Что отложено

**Carry-forwards** (per prompt § 8 + Stage 6 QA findings):

- **QA-W1**: `lmsSchemaRowApi.update / .delete` lack in-tx `plan.deletedAt` re-check. Race window: another tx soft-deletes the plan between guard return and write. → Future `/fix` cycle.
- **QA-W2**: `lmsSchemaRowApi.reorder` array-form `prisma.$transaction([...])` cannot embed plan re-fetch; either convert to interactive tx or accept the race window as known-defer. → Future `/fix` cycle.
- **QA-F2**: `delete` row that has `PerformedExerciseInstance` back-ref surfaces P2003 via `handlePrismaError` with `"Referenced SchemaRow does not exist"` (semantically off — it's "in use, can't delete"). → Athlete-flow workflow.
- **QA-B4** (carry from 8.1a): reorder without `retryOnP2034`; Step 8.2 HTTP retry layer will handle.
- **QA-C2** (carry from 8.1a): P2028 tx-timeout mapping. → separate `/fix` ticket.
- **QA-D1** (carry from 8.1a): `.max(N)` cap on `orderedIds` arrays. → Step 8.0b follow-up.
- **QA-E3** (carry from 8.1a): guards `userId = undefined` defensive throw. → cross-guard `/fix` ticket.
- **REVIEW-I3** (this step): `lms-guards.ts` at 293/300. Next LMS-chain guard (e.g. `verifyDayOwnership`, `verifyWeekOwnership`) requires further sub-split. Pre-flagged for Step 8.1c planner.
- **HTTP routes for `lmsSchemaRowApi`**: Step 8.2.
- **Client hooks for `lmsSchemaRowApi`**: Step 8.3.
- **Schema editor UI**: Step 8.4.
- **`@@unique([schemaId, order])`**: Step 8.3.6.
- **`lmsSchemaPairingApi`**: Step 8.1c.
- **`mapToBlockWithSchemas` mapper**: Step 8.3.5.
- **Optional global `nullableJson` helper**: defer; local in `admin.ts` only. If 8.1c reuses → hoist to `utils/`.

---

## Ссылка на `.feature-dev/<ts>/`

`/home/maksym/projects/contrib/the-discipline-program/.feature-dev/1779212158/` contains:

- `research.md` — Stage 1 verification of prompt § 0 verbatim source reads + 18-axis check + 3 drift findings.
- `design.md` — Stage 2 RFC condensing prompt design + OQ resolutions + drift handling.
- `plan.md` — Stage 3 atomic-task implementation plan + Phase 0/1/2/3 (+ conditional 4) breakdown.
- `tasks.md` — Stage 4 task tracker (status per task + checkpoint commits per phase).
- `review.md` — Stage 5 manifesto review (0 CRITICAL / 1 WARNING / 4 INFO; APPROVED WITH WARNINGS).
- `qa.md` — Stage 6 adversarial pass across 9 axes (42 scenarios; 0 CRITICAL / 2 WARNINGs / 6 INFOs; Must-Test = 1 → QA-T1).

---

## Verification notes

| Gate                                                          | Result                                  | Timing      |
| ------------------------------------------------------------- | --------------------------------------- | ----------- |
| `pnpm --filter @repo/api-server check-types`                  | exit 0, 0 errors                        | ~8s         |
| `pnpm --filter @repo/api-server lint`                         | exit 0, 0 warnings (`--max-warnings 0`) | ~4s         |
| `pnpm --filter @repo/api-server test` (full)                  | 75 files / 661 tests / all pass         | ~7 min      |
| `pnpm dep:check`                                              | 0 violations / 1261 modules / 2360 deps | ~2s         |
| `pnpm check-types` (root, 16 packages)                        | 16/16 cached, 0 errors                  | ~30s        |
| `pnpm lint` (root, 16 packages)                               | 16/16, 0 warnings                       | ~10s        |
| `pnpm test` (root)                                            | (deferred to Stage 9 root-sweep)        | —           |
| Husky pre-commit                                              | clean on all 5 commits                  | 25-49s each |
| Husky pre-push                                                | (deferred until user push)              | —           |
| `grep "type TxClient = Omit" \| grep -v _shared/tx-client.ts` | 0 matches (only canonical site remains) | —           |
| `git diff 6c2d9cab..HEAD -- analysis/`                        | 0 lines (analysis unchanged)            | —           |
| `git diff 6c2d9cab..HEAD -- packages/contracts/`              | 0 lines (contracts unchanged)           | —           |
| `git diff 6c2d9cab..HEAD -- packages/api-server/prisma/`      | 0 lines (schema unchanged)              | —           |
| `git diff 6c2d9cab..HEAD -- apps/`                            | 0 lines (apps unchanged)                | —           |

**Test count baseline**: 625 (pre-8.1b) + 4 (Phase 1 new guard tests) + 31 (Phase 3 new admin tests) + 1 (Stage 7 QA gap-fill) = **661 api-server tests**.

---

## Acceptance criteria self-check (prompt § 4, 25 items)

1. ✅ `endpoints/lms/_shared/tx-client.ts` exports 6-key `TxClient` typed-Omit.
2. ✅ `endpoints/lms/_shared/index.ts` re-exports `tx-client`.
3. ✅ `block/admin.ts` + `schema/assertions.ts` import `TxClient` from `_shared`; local re-declarations removed.
4. ✅ `grep "type TxClient = Omit" packages/api-server/src/ | grep -v _shared/tx-client.ts` → 0 lines.
5. ✅ `verifySchemaRowOwnership` appended (in `lms-guards.ts` post-split) with 9-field return shape `{status, schemaId, schemaKind, parentSchemaId, blockId, sessionId, dayId, weekId, planId}`.
6. ✅ 5 guard tests pass: owner / head-coach / foreign-coach / non-existent-row / soft-deleted-plan (4 base from Phase 1 + 1 QA-T1 gap-fill).
7. ✅ `mapToSchemaRow` has 10 Zod `.parse(...)` calls (1 discriminated payload + 8 nullable VO + 0 `as` casts + 0 unsafe value conversions). `position` direct enum, `notes` direct nullable string.
8. ✅ `mappers/lms/index.ts` re-exports `schema-row.mapper`.
9. ✅ `lmsSchemaRowApi.create` enforces all 6 sub-clauses (parent ownership + alignment + parent-kind before tx + planCheck in tx + parent re-fetch + parent-kind re-check + `_max(order)+10` + Serializable + `retryOnP2034`).
10. ✅ `lmsSchemaRowApi.update` enforces 4 sub-clauses (verifySchemaRowOwnership + verifyPlanEditable + STRUCTURAL_UPDATE_KEYS filter + rowKind/payload cross-validate + 11 conditional spreads).
11. ✅ `lmsSchemaRowApi.delete` is single-statement default-isolation after ownership + editable checks.
12. ✅ `lmsSchemaRowApi.reorder` enforces 4 sub-clauses (verifySchemaOwnership + foreign-id + missing-id + scope-count + 2-pass UPDATE).
13. ✅ `endpoints/lms/schema-row/index.ts` exports `lmsSchemaRowApi`.
14. ✅ `endpoints/lms/index.ts` re-exports `schema-row`.
15. ✅ `admin.test.ts` covers 31 cases (per § 6 breakdown; HEADERLESS skipped per D-X3).
16. ✅ `pnpm --filter @repo/api-server check-types` — 0 errors.
17. ✅ `pnpm --filter @repo/api-server test` — 661 cases pass (625 baseline + 36 new).
18. NEEDS-VERIFY → Stage 9 root sweep: `pnpm check-types` (root).
19. NEEDS-VERIFY → Stage 9: `pnpm lint` (root).
20. NEEDS-VERIFY → Stage 9: `pnpm test` (root).
21. ✅ `pnpm dep:check` — 0 violations.
22. ✅ Husky pre-commit clean on every commit. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign` usage.
23. ✅ 5 per-layer atomic commits on `feat/training-domain`:
    - `d2e9b7e5` refactor(api-server): hoist txclient typed-omit to endpoints/lms/\_shared
    - `f24e282c` feat(api-server): add verifyschemarowownership guard for schema row ownership chain
    - `a99901e4` feat(api-server): add lms schemarow mapper with 9-variant payload parse + 8 nullable vo parses
    - `e1091719` feat(api-server): add lmsschemarowapi with crud and two-pass reorder
    - `4d9d9766` test(api-server): cover qa must-test gaps for lmsschemarowapi
24. ✅ `analysis/` directory unchanged.
25. ✅ `admin.ts` 249 logical LOC (≤ 320 target).

**Note on #6**: deviates from prompt — added 5 tests, not 4. The 4th (non-existent row → NotFoundError) and 5th (soft-deleted plan → NotFoundError) together cover both arms of the compound `!row || plan.deletedAt !== null` NotFound branch. Stage 5 review surfaced this (REVIEW-W1); Stage 6 QA prescribed QA-T1; Stage 7 added it.

---

**End of executor output.**
