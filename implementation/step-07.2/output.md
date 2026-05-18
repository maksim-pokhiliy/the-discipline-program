# Step 7.2 — Platform HTTP routes для Block + handlePrismaError ZodError DB-corruption defence

## Что сделано

Зашиплены 4 thin-wrapper HTTP route files для Block в `apps/platform/src/app/api/platform/training-plans/` (POST create, PUT reorder, multiplexed PUT update + DELETE, PUT assignLabels), mirror Step 6.4.5 Session pattern byte-for-byte. Параллельно закрыт carry-forward QA-003 из Step 7.1 Stage 6: `handlePrismaError` в `packages/api-server/src/utils/` теперь intercept'ит `ZodError` перед финальным `throw error` и re-throws как `InternalServerError({kind: "DbCorruption", entity, issues})` — mapper-side ZodError (DB-corruption через `intensitySchema.parse`/`timeCapSchema.parse` в `mapToBlock`) теперь поднимается как 500 DbCorruption, а не 400 VALIDATION_ERROR (semantically correct: client payload validation vs server data integrity). Per-package изменения additive (handler signature unchanged; new route files без downstream consumers), per-phase atomic commits безопасны под husky pre-commit fan-out. Все 6 файлов без комментариев; 3 commit'а на `feat/training-domain`, без branch-cut.

## Изменённые/созданные файлы

**Новые (4 файла в `apps/platform/src/app/api/platform/training-plans/`)**:

- `[planId]/sessions/[sessionId]/blocks/route.ts` (21 LOC, POST create) — mirror § 0.1 Session POST verbatim; substitutions `lmsSessionApi→lmsBlockApi`, schema family, destructure `{planId, sessionId}`.
- `[planId]/sessions/[sessionId]/blocks/reorder/route.ts` (22 LOC, PUT reorder) — mirror § 0.2 Session reorder verbatim; `.then((blocks) => ({ blocks }))` wrap per `reorderBlocksResponseSchema = z.object({blocks: ...})`.
- `[planId]/blocks/[blockId]/route.ts` (36 LOC, multiplex PUT update + DELETE) — mirror § 0.3 Session id-multiplex verbatim; destructure `{ blockId }` only (mirrors Session `{ sessionId }` despite `blockByIdParamsSchema` having both `planId+blockId`).
- `[planId]/blocks/[blockId]/labels/route.ts` (21 LOC, PUT assignLabels) — sub-resource action PUT pattern (Session reorder structure minus wrap); NO `.then` wrap т.к. `assignBlockLabelsResponseSchema === blockSchema` (single Block).

**Изменённые (2 файла в `packages/api-server/src/utils/`)**:

- `prisma-error-handler.ts` (+13 LOC: 50→63): `import { ZodError } from "zod"` (line 2) + новая ветка `if (error instanceof ZodError) { throw new InternalServerError(...) }` (lines 50-60) перед финальным `throw error` (line 62). Сигнатура `(error: unknown, context): never` unchanged; behavior-narrowing only для ZodError.
- `prisma-error-handler.test.ts` (+44 LOC: 127→171): `import { z } from "zod"` (line 3) + 2 новых `it()` case'а — (a) ZodError → InternalServerError + полный assert на `{message, details.kind, details.entity, issues[].path/message/code}`; (b) `CustomError extends Error` regression guard (явный invariant: ZodError ветка не absorb'ит другие Error subclasses). Существующие 11 it() cases unchanged.

**Не тронуто (explicit § 4 forbid list)**:

- `packages/api-routes/src/error-handler.ts` — route-layer `handleApiError` ZodError → 400 path корректен для payload validation (§ 0.7).
- `packages/api-server/src/endpoints/lms/block/admin.ts` — Step 7.1 api-server slice без edits.
- `packages/contracts/src/entities/lms/block/*` — Step 7.0 contracts, consumed read-only.
- `analysis/artifacts/` — no domain semantics change.
- Prisma schema, seed.

## Принятые решения

- **D-1**: Test файл import только `{ z }` from "zod" (не `{ z, ZodError }`). Verbatim spec в § 3 Phase 1 listed `import { z, ZodError } from "zod"`, но тестовая логика не reference'ит `ZodError` symbol напрямую (use `z.object(...).safeParse(...)` для конструкции + `toThrow(InternalServerError)` для assert). Unused-imports lint rule failed бы при ZodError import. Per `[[inline-fix-pre-existing]]` + prompt instruction "Re-read § 3 Phase 1 carefully" — flag the unused-import risk; drop it.
- **D-2**: Reorder route uses single-line `.then(...)` chain в `(userId, ...) => lmsBlockApi.reorder(...).then((blocks) => ({ blocks }))` вместо Session source's multi-line `\n          .reorder(...)\n          .then((sessions) => ({ sessions }))`. Prettier-equivalent — lint-staged не переформатировал. AST identical.
- **D-3**: Per-phase atomic commits (3 feat + 1 docs) выбраны вместо single-squash. Per § 0.10 husky/turbo анализ: handler patch signature-unchanged → downstream consumers compile clean intermediate; route files no downstream consumers (Next.js App Router entry). Нет husky-squash trigger по `[[husky-cross-package-squash]]`. Logical revertability per-phase лучше для bisect.
- **D-4**: `prisma-error-handler.test.ts` 2 новых it() добавлены ПОСЛЕ существующего `"non-Error value is rethrown"` test (последний в файле), перед closing `})` describe block. Альтернатива (insert между existing tests) была бы intrusive в существующий test ordering.

## Возникшие вопросы и как решены

Без escalations через § 0 — все verbatim quotes из § 0.1-0.11 byte-for-byte matched HEAD `71803bb0`. § 0.A zero-state verified (Block route dirs absent; `lmsBlockApi` / `@repo/contracts/lms/block` 0 hits в `apps/platform/src/`; `ZodError` 0 hits в handler). Никаких prior-implementation trace stops не сработало (vocab `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 не встретились). Branch-cut override sapply'ался корректно — `/feature small` Stage 0 не пытался cut `feat/<slug>` (lock'нуто в executor prompt).

Одна path-prose nuance в research stage (non-blocker): planner brief step 15 reference'ит `packages/api-server/src/lms/` без `endpoints/`. Actual source path = `packages/api-server/src/endpoints/lms/block/admin.ts`. Module specifier `@repo/api-server/lms` (verbatim в § 0.1-0.3 import statements) корректен через `package.json` exports map → executor code imports unchanged. NOT a divergence; only planner-side prose path-shortening.

## Что отложено

- **HTTP-layer integration tests** — mirror Session.6.4.5 no-route-tests precedent (§ 4 + § 5 #11). Routes — thin wrappers; auth-factories factory-tested; api-server integration tests Step 7.1 cover business logic. TanStack Query client hooks в Step 7.3 будут exercise the routes end-to-end через actual HTTP request → effectively smoke-test HTTP layer без отдельного test surface.
- **QA-001 schema `@@unique([sessionId, order])` constraint** — separate decision before Step 8 per planner discussion. Out of Step 7.2 scope. Текущий ordering integrity guarded by `lmsBlockApi.reorder`-side transactional validation; QA-001 — defense-in-depth at DB layer.
- **Client API + hooks** (`apps/platform/src/lib/api/endpoints/blocks.ts` + `use-blocks.ts` — Step 7.3.
- **UI** (BlockList, BlockCard, AddBlockButton, BlockLabelSelect, BlockNotesField, intensity/timeCap widgets) — Steps 7.4 + 7.5.
- **Schema entity routes** — Step 8.

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1779088244/` — pipeline artifacts:

- `research.md` (300 LOC) — § 0.1-0.11 verbatim verification log + mirror-mapping table + lmsBlockApi return-type table + 10 notes for executor
- `tasks.md` (31 LOC) — Phase 1/2/3 task scaffold с COMPLETED status + checkpoint commit SHAs
- `review.md` (250 LOC) — APPROVED verdict, 0 CRITICAL/0 WARNING/1 INFO (acceptable narrowing `as`); manifesto 2.1-2.5 PASS; all 15 § 5 acceptance criteria PASS; all 10 § 8 anti-patterns avoided
- `.lock` — orchestrator session marker (cleared after S-Stage 5)

## Сценарий смоук-теста

**N/A** — HTTP-only step, no UI surface. Smoke resumes Step 7.4 (BlockList).

## Verification notes

| Gate                                                                                        | Expected                              | Actual                                                                                                                    | Status |
| ------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| Phase 1: `pnpm --filter @repo/api-server test -- prisma-error-handler`                      | 13/13 (11 baseline + 2 new)           | 13/13                                                                                                                     | ✓      |
| Phase 1: `pnpm --filter @repo/api-server check-types`                                       | 1/1                                   | 1/1                                                                                                                       | ✓      |
| Phase 2 + 3: `pnpm --filter platform check-types`                                           | 1/1                                   | 1/1 (each)                                                                                                                | ✓      |
| Root: `pnpm check-types`                                                                    | 16/16                                 | 16/16                                                                                                                     | ✓      |
| Root: `pnpm lint`                                                                           | 16/16                                 | 16/16                                                                                                                     | ✓      |
| Root: `pnpm --filter @repo/api-server test`                                                 | 583/583 (581 baseline + 2 new)        | 583/583 (1 transient Neon flake в `session/admin.test.ts:179`, isolated re-run 19/19 green per `[[neon-dev-direct-url]]`) | ✓      |
| Root: `pnpm test`                                                                           | ~1068/1068 (1066 baseline + 2 new)    | 1068/1068 (110 test files, 345.81s, 0 flakes)                                                                             | ✓      |
| Root: `pnpm dep:check`                                                                      | 0 violations / +4-5 modules from 1169 | 0 violations / 1173 modules (+4 = 4 new route files)                                                                      | ✓      |
| Regression grep: `grep -rln "lmsBlockApi" apps/platform/src/`                               | 4 files                               | 4 files                                                                                                                   | ✓      |
| Regression grep: `grep -rln "@repo/contracts/lms/block" apps/platform/src/`                 | 4 files                               | 4 files                                                                                                                   | ✓      |
| Regression grep: `grep -n "ZodError" packages/api-server/src/utils/prisma-error-handler.ts` | 2 hits                                | 2 hits (line 2 import, line 50 branch)                                                                                    | ✓      |

**Commit log** (4 commits ahead of `71803bb0` = base):

- `89f81e9c` feat(api-server): map mapper-side zoderror to internalservererror with dbcorruption kind
- `2bae5b21` feat(platform): add http routes for block create and reorder
- `8149d405` feat(platform): add http routes for block update delete and assignlabels
- `<docs>` docs(step-07.2): write executor output report

All commits cleared husky pre-commit (lint-staged + turbo check-types fan-out 13-15 tasks), commit-msg (commitlint, ≤100 char lowercase subjects), без `--no-verify` / `--no-edit` / `--no-gpg-sign`.

## Acceptance criteria self-check

| #   | Criterion                                                                              | Status | Evidence                                                            |
| --- | -------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| 1   | 4 route files at expected paths, each ≤30 LOC, mirror Session pattern verbatim         | ✓      | 21+22+36+21 LOC; multiplex 36 = mirror § 0.3 36                     |
| 2   | `withCoachAuth(withAuthRateLimit(createAuth*Handler(...), RATE_LIMIT_TIER.API))` chain | ✓      | review.md "Pattern Match" sections per route                        |
| 3   | Schemas imported from `@repo/contracts/lms/block` — no inline duplication              | ✓      | review.md § Module Boundaries                                       |
| 4   | `lmsBlockApi` via `@repo/api-server/lms` barrel — correct param ordering               | ✓      | review.md "Route file 1-4" verdicts                                 |
| 5   | Reorder `.then(blocks => ({blocks}))` wrap present                                     | ✓      | `blocks/reorder/route.ts:15`                                        |
| 6   | id-addressed routes at `.../[planId]/blocks/[blockId]/...` (sessionId-free)            | ✓      | multiplex + labels both at top-level `blocks/[blockId]/`            |
| 7   | assignLabels dedicated `[blockId]/labels/route.ts` with PUT                            | ✓      | file exists; `[blockId]/route.ts` exports only PUT+DELETE           |
| 8   | `handlePrismaError` ZodError branch added before final `throw error`                   | ✓      | line 50-60 before line 62                                           |
| 9   | 2 new test cases in `prisma-error-handler.test.ts`                                     | ✓      | (a) ZodError + structured details; (b) CustomError regression guard |
| 10  | `handleApiError` in api-routes NOT edited                                              | ✓      | `git diff 71803bb0..HEAD -- packages/api-routes/` empty             |
| 11  | No HTTP-layer integration tests                                                        | ✓      | `git diff --name-only \| grep \.test\. \| grep apps/platform` empty |
| 12  | Verifications all-green (5 gates)                                                      | ✓      | see Verification notes table — all 5 root gates green               |
| 13  | Husky pre-commit + commit-msg clean (3 code + 1 docs commit), no skip flags            | ✓      | 3 commits already landed; docs commit at S-Stage 5 close            |
| 14  | Regression greps return expected counts (4 / 4 / 2)                                    | ✓      | see Verification notes table                                        |
| 15  | All commits on `feat/training-domain`; no `feat/<slug>` branch                         | ✓      | `git log --oneline 71803bb0..HEAD` shows 3 commits, no foreign refs |

**15/15 PASS** — все verification gates green; pipeline готов к S-Stage 5 docs commit.
