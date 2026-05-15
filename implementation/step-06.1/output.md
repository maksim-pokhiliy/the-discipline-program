# Step 6.1 — `lmsSessionApi` + `endpoints/lms/_shared/date.ts` extraction — output

> Executor session, run via `/feature` (full pipeline). Branch `feat/training-domain`.
> Base `e708cc81` → 5 commits (`a580cf4b` … `ff8e8033`). 11 файлов, +893 / −20.

## Что сделано

Заложен первый api-server слайс с **транзитивной ленивой материализацией**: `lmsSessionApi.create`
проходит атомарную транзакцию `week.upsert → day.upsert → session.aggregate → session.create`,
а `Week.startDate` пишется через тот же UTC-якорь, что Step 5 (`resolveWeekStartDate`). Поскольку
теперь у хелпера два потребителя (`week/admin.ts` + `session/admin.ts`), он унесён в общий
модуль `endpoints/lms/_shared/date.ts` — порог абстракции по manifesto 2.1 пройден.

Четыре deliverable'а из промпта § 1:

- **`endpoints/lms/_shared/date.ts`** — `parseStartDate` + `resolveWeekStartDate` перенесены
  байт-идентично из `week/admin.ts:10-26` (плюс `export`); barrel `_shared/index.ts`;
  6-кейсовый unit-test (no DB).
- **`lmsSessionApi`** (`endpoints/lms/session/admin.ts`) — 4 метода (`create` / `update` /
  `delete` / `reorder`). `create` — callback-form `prisma.$transaction` с **Serializable**
  isolation (QA-002) + intra-tx re-read `plan.deletedAt`/`status` (QA-004); `reorder` —
  валидация ownership + materialization + complete-set check (QA-001) + array-form
  `$transaction` с sparse-int renumber `(i+1)*10`. Никаких `freezeLoadsAtCreation` /
  `Session.name` в коде.
- **`mapToSession`** (`mappers/lms/session.mapper.ts`) — plain field copy, 7 полей,
  zero leakage `freezeLoadsAtCreation`.
- **`verifySessionOwnership`** (`authz/guards.ts`) — JOIN'ed lookup `session → day → week →
plan → creator`, admin/head-coach bypass, возвращает `{ status, dayId, weekId, planId }`
  для downstream Step 7 `verifyBlockOwnership`.

**Отклонение от queue (3 → 5 commits).** Plan специфицировал `refactor → feat → test`
(3 коммита). По итогу: 5 коммитов — Stage 6 QA нашла 1 CRITICAL + 2 WARNING, ratified
user-planner'ом для inline-фикса, плюс Stage 7 добавил QA-003 (`delete` non-owner test).
Финальный порядок: `refactor → feat → test → fix (QA-001/002/004) → test (QA-003)`.

**TZ proof.** Dev-time T17: временно убрал `Date.UTC(...)` обёртку из `resolveWeekStartDate`,
прогнал `TZ=Asia/Kolkata` — тест-кейс #11 упал `expected 17 to be 18` (плюс collateral
4/5/8/14 поскольку pre-seed'ы используют UTC-midnight `Date.UTC(2026, 4, 18)` и broken
helper триггерил duplicate Week rows). Восстановил, прогнал снова — 14/14 green. `git diff
_shared/date.ts` пустой до коммитов.

## Изменённые/созданные файлы

Cumulative diff (5 коммитов): **+893 / −20, 11 файлов**.

**Создано (8):**

1. `packages/api-server/src/endpoints/lms/_shared/date.ts` (20 LOC) — relocated `parseStartDate`
   - `resolveWeekStartDate`. Commit `a580cf4b`.
2. `packages/api-server/src/endpoints/lms/_shared/index.ts` (1 LOC) — barrel `export * from "./date";`.
   Commit `a580cf4b`.
3. `packages/api-server/src/endpoints/lms/_shared/date.test.ts` (50 LOC) — 6 unit-кейсов
   (parse happy / regex-fail / calendar-invalid; resolve Monday / Wednesday / Sunday snap).
   Commit `a580cf4b`.
4. `packages/api-server/src/mappers/lms/session.mapper.ts` (13 LOC) — `mapToSession` plain
   field copy. Commit `9d2649be`.
5. `packages/api-server/src/endpoints/lms/session/admin.ts` (212 LOC после QA-фикса; 187 в
   `9d2649be`, +30/-5 в `61bb3eeb`) — `lmsSessionApi` (4 метода) + `DAY_OF_WEEK_TO_PRISMA`.
   Commits `9d2649be`, `61bb3eeb`.
6. `packages/api-server/src/endpoints/lms/session/index.ts` (1 LOC) — barrel. Commit `9d2649be`.
7. `packages/api-server/src/endpoints/lms/session/admin.test.ts` (538 LOC) — 11 integration
   кейсов (commit `8c3e8c45`), +2 cases QA-001 hardening (`61bb3eeb`), +1 case QA-003
   (`ff8e8033`) = 14 итого.

**Изменено (3):**

1. `packages/api-server/src/endpoints/lms/week/admin.ts` (+1 / −20) — удалены 17 строк
   helper-bodies + 1 blank + 2 stranded imports (`BadRequestError`, `@repo/shared` line);
   добавлен `import { resolveWeekStartDate } from "../_shared";`. Commit `a580cf4b`.
2. `packages/api-server/src/endpoints/lms/index.ts` (+2 / −0) — additive `export * from "./_shared";`
   (commit `a580cf4b`) и `export * from "./session";` (commit `9d2649be`). Финал: 5 строк.
3. `packages/api-server/src/mappers/lms/index.ts` (+1 / −0) — additive `export * from "./session.mapper";`
   alphabetically между `plan-enrollment.mapper` и `training-plan.mapper`. Commit `9d2649be`.
4. `packages/api-server/src/authz/guards.ts` (+54 / −0) — additive `verifySessionOwnership`.
   Commit `9d2649be`.

**Коммиты (5, per-layer, на `feat/training-domain`):**

```
a580cf4b refactor(api-server): extract date helpers to endpoints/lms/_shared/date.ts
9d2649be feat(api-server): add lms session admin api with lazy day-week materialization
8c3e8c45 test(api-server): cover session admin scenarios incl. tz invariance
61bb3eeb fix(api-server): harden session reorder and create against race and subset attacks
ff8e8033 test(api-server): cover delete non-owner case
```

## Принятые решения

- **STYLE-001 — `reorder` использует sequential `findUnique`-awaits, не nested-await-in-object-literal
  из промпта § 3.4.** Сетевая форма (2 round-trips) и семантика (week-missing ⇒ `BadRequestError`)
  идентичны; читаемость строго лучше — нет `Promise`-yielding expression внутри object-literal
  slot, нет `?? ""` placeholder. Ratified в `[[design.md § 5.5 / 6.5 / 7]]`.

- **PROMPT-001 — subject коммита 1 перефразирован с verbatim промпта § 7.** Промпт
  специфицировал `refactor(api-server): extract resolveWeekStartDate to endpoints/lms/_shared/date.ts`,
  но commitlint rule `subject-case: lower-case` отбивает CamelCase identifiers в subject.
  User-planner approved paraphrase в `extract date helpers` через AskUserQuestion. Оба
  имени (`parseStartDate` + `resolveWeekStartDate`) сохранены verbatim в body коммита.

- **INFO-001 resolved — Prisma `DayOfWeek` import shape.** Промпт § 3.4 написал
  `Prisma.DayOfWeek` как type, но verified в generated client `@prisma/client@6.1.0/index.d.ts`:
  `Prisma` namespace не nest'ит model enums. Применил aliased import:
  `import { type DayOfWeek as PrismaDayOfWeek } from "@prisma/client"` + `as const satisfies
Record<DayOfWeek, PrismaDayOfWeek>` — codebase convention из `mappers/lms/enum-maps-status.ts:1-4`.
  Промпт сам открывал дверь ("verify against the generated client") — это finding research'а,
  не planner-error.

- **QA-001 (CRITICAL) fix — `reorder` complete-set check.** Без него `{ orderedIds: [c.id] }`
  на Day `[a@10, b@20, c@30]` оставляет `a@10, b@20, c@10` — два rows с `order=10` (no
  `@@unique([dayId, order])` в schema). Added `prisma.session.count({ where: { dayId } })`
  comparison после foreign-day filter'а; mismatch → `BadRequestError("orderedIds must include
every session in the target day", { provided, expected })`. User-planner ratified strict-set-required
  семантику над deferral в Step 6.7.

- **QA-002 + QA-004 (WARNING) fix — `create` Serializable + intra-tx plan re-check.** QA-002:
  параллельные `create` calls под default `READ COMMITTED` могут оба прочитать `_max(order)=20`
  → оба создать row с `order=30`. QA-004: между outer `verifyPlanOwnership` и transaction
  body plan может быть soft-delete'нут / archived. Fix: `prisma.$transaction(async (tx) =>
{...}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })` + intra-tx
  `tx.trainingPlan.findUnique({ select: { deletedAt, status } })` → `NotFoundError` /
  `ForbiddenError` ("Plan is archived; edits not allowed" — wording verbatim из
  `verifyPlanEditable` at `authz/guards.ts:101`). User-planner ratified inline-fix над
  deferral в Step 6.4.

- **QA-003 (WARNING) fix — `delete` non-owner integration test.** Stage 7 commit `ff8e8033`.
  Destructive op deserves direct coverage; shared-guard inference не safety-net для будущих
  refactor'ов.

- **Метод `delete:` (не `remove:`).** `lmsPlanEnrollmentApi` использует `remove` (soft-delete
  semantics: `deletedAt` + status `REMOVED`). `Session` — hard delete с cascades на Block +
  PerformedSession (см. `db/client.ts:7-15` — Session не в `SOFT_DELETE_MODELS`). Промпт §
  3.4 unambiguously specified `delete:` — semantically corresponds, no override needed.

## Возникшие вопросы и как решены

- **PROMPT-001 (Stage 4 commit phase).** Первая попытка `refactor(api-server): extract
resolveWeekStartDate to endpoints/lms/_shared/date.ts` отбита commitlint'ом
  (`subject-case: lower-case`). AskUserQuestion → user выбрал option B (paraphrase to "date
  helpers", не CamelCase lowercase). Applied; helper names verbatim в commit body.

- **QA-001 / QA-002+QA-004 / QA-003 (Stage 6 + Stage 7).** Три AskUserQuestion после
  adversarial QA:

  - QA-001 (subset reorder) — "Fix now in this slice / Defer to 6.4 / Defer to 6.7" → user
    chose **Fix now** с complete-set check. Applied + 2 новых теста (subset + non-existent
    cuid superset) в `61bb3eeb`.
  - QA-002 + QA-004 (create race + TOCTOU) — "Fix now / Defer to 6.4 / Only QA-002" → user
    chose **Fix both now** (Serializable + intra-tx re-check). Applied в `61bb3eeb`.
  - QA-003 (delete non-owner test) — "Yes add / No skip / Wider Stage 7 sweep" → user chose
    **Yes add only this one** (no broader Must-Test sweep). Applied в `ff8e8033`.

- **INFO-001 (Stage 1 research).** `Prisma.DayOfWeek` в промпте § 3.4 не резолвится в
  generated client'е Prisma 6.1 (`Prisma` namespace не вкладывает model enums). Не surfaced
  как escalation — промпт сам сказал "verify against the generated client", research
  подтвердил codebase convention из `enum-maps-status.ts:1-4`. Stage 2 design ratified
  aliased import.

- **Hard triggers — не возникло.** Hard-trigger grep clean во всех 5 коммитах
  (`SchemeType` / `SETS_REPS` / `per-block atomic save` / `coach always edit mode` /
  `plan-editor rollback` / `ADR-0037/0041/0042/0043`).

## Что отложено

- **QA-005 (INFO)** — `reorder` без upper-bound на `orderedIds` array length. 10k cuids
  триггерит O(N) `$transaction` + statement_timeout risk. Defense-in-depth. Defer: contract
  schema `.max(N)` это cross-slice job; реалистичный coach scenario ~10 sessions/day.
- **QA-006 (INFO)** — `notes` без upper-bound в API layer (contract уже имеет `.max(2000)`).
  Same disposition.
- **QA-008 (INFO)** — `delete` cascade-to-`PerformedSession` не regression-guarded explicitly
  (case #7 покрывает `Block` cascade; `PerformedSession` использует тот же `onDelete: Cascade`
  per `schema.prisma:841`). User scoped Stage 7 к QA-003 only.
- **QA-010 (INFO)** — `reorder` использует одинаковое message для week-missing и day-missing
  failure paths. Minor UX clarity; both throw `BadRequestError("Cannot reorder sessions in
an unmaterialized day slot")`. Fold в Step 6.4 route-level error mapping.
- **QA-011 (INFO)** — TZ test assert'ит только `Week.startDate` UTC-components, не `Day.dayOfWeek`.
  Defense-in-depth add; case #11 уже asserts что Wednesday materialization → Monday-snapped
  Week. User scoped Stage 7 к QA-003 only.
- **QA-012 family (INFO)** — `update`/`delete` на non-existent `sessionId` → NotFoundError
  не tested explicitly; soft-delete-mid-flight variant idem. `verifySessionOwnership`
  guard exercises path via existing 14 cases (#1, #2, #6, #8 cover ownership/editability
  branches). User scoped Stage 7 к QA-003 only.
- **QA-002 concurrency test.** Integration suite serial (`fileParallelism: false` per
  `project_api_server_serial_tests`); race не reproduce'ится deterministically. Behaviour
  proof требует concurrent execution, которое Step 6.4 HTTP routes exercise.
- **Serializable retry на P2034.** Сейчас `handlePrismaError` propagates как domain error;
  retry logic с exponential-backoff deferred в Step 6.4 HTTP-route layer.

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1778843530/` — full pipeline артефакты:

- [[research.md]] — Stage 1 Research (verdict A, 2 INFO: INFO-001 Prisma DayOfWeek,
  INFO-002 TZ dev-time proof).
- [[design.md]] — Stage 2 Design RFC (8 ratified decisions, STYLE-001 deviation documented).
- [[plan.md]] — Stage 3 Plan (19 atomic tasks across 3 commits; later expanded to 5 commits
  via Stage 6 + Stage 7 inline fixes).
- [[tasks.md]] — Stage 4 implementation report (per-commit task status, gates, deviations).
- [[review.md]] — Stage 5 Staff-engineer review (verdict A: zero CRITICAL, zero WARNING,
  3 INFO REV-001/002/003, 2 ratified deviations STYLE-001 + PROMPT-001).
- [[qa.md]] — Stage 6 adversarial QA (verdict B: 1 CRITICAL QA-001, 3 WARNING QA-002/003/004,
  8 INFO, 4 positive evidence — resolved to verdict A post-fix через `61bb3eeb` + `ff8e8033`).
- This file.

## Verification notes

**Сценарий смоук-теста: N/A** — api-server-only step, нет user-visible surface (HTTP routes
в Step 6.4, hooks в 6.5, UI в 6.6-6.7). `lmsSessionApi` callable only из integration tests.

**`TZ=Asia/Kolkata` gate (HEAD `ff8e8033`):**

```
RUN  v4.1.4 /home/maksym/projects/contrib/the-discipline-program/packages/api-server
Test Files  1 passed (1)
     Tests  14 passed (14)
  Duration  14.61s
```

Exit code 0.

**`freezeLoadsAtCreation` regression grep:**

```
$ grep -rn "freezeLoadsAtCreation" packages/api-server/src
```

Empty output. Zero matches в api-server `src/` (определение живёт только в `prisma/schema.prisma:639`

- generated `node_modules/.prisma/client/...`; contracts test guardrails в
  `packages/contracts/.../session.schema.test.ts:73-74,142-143` это intentional anti-drift и
  вне api-server scope).

**`Session.name` / `session.name` regression grep:**

```
$ grep -rn "Session\.name\|session\.name" packages/api-server/src
```

Empty output. Zero matches.

**`week/admin.ts` byte-diff (commit `a580cf4b`):**

```
$ git diff a580cf4b^..a580cf4b --numstat -- packages/api-server/src/endpoints/lms/week/admin.ts
1	20	packages/api-server/src/endpoints/lms/week/admin.ts

$ git diff a580cf4b^..a580cf4b --stat -- packages/api-server/src/endpoints/lms/week/admin.ts
 packages/api-server/src/endpoints/lms/week/admin.ts | 21 +--------------------
 1 file changed, 1 insertion(+), 20 deletions(-)

$ git diff a580cf4b^..a580cf4b -- packages/api-server/src/endpoints/lms/week/admin.ts | wc -l
35
```

Actual `-20 / +1` (промпт § 6 estimated `-18 / +1`). Delta `-2` это два stranded imports
(`BadRequestError` на line 2, `getMonday + parseDateParam` на line 3) — eslint `--max-warnings 0`
требовал их удаления. Covered в [[design.md § 9.5]] и [[review.md § REV-003]] — "rest of
the file byte-identical" intent сохранён.

**T17 dev-time TZ proof (ephemeral, не committed):**

- Reverted `_shared/date.ts` `resolveWeekStartDate` → `return monday;` (drop `Date.UTC(...)`).
- Ran `TZ=Asia/Kolkata pnpm --filter @repo/api-server test --run src/endpoints/lms/session/admin.test.ts`:
  `Test Files 1 failed (1) · Tests 5 failed | 6 passed (11)` — case #11 failed
  `expected 17 to be 18` для `getUTCDate()` (local-TZ-constructed Monday landed на May 17
  18:30 UTC под Asia/Kolkata); collateral failures cases 4/5/8 потому что pre-seed Week
  rows используют `Date.UTC(2026, 4, 18)` (UTC-midnight) → upsert под broken helper
  создаёт different Date → unique key miss → duplicate Week row.
- Restored helper; `git diff packages/api-server/src/endpoints/lms/_shared/date.ts` empty.
- Re-ran: `Test Files 1 passed (1) · Tests 11 passed (11)`. Current state 14/14 после
  Stage 6 + Stage 7 adds.

**Five commit SHAs:**

```
a580cf4b refactor(api-server): extract date helpers to endpoints/lms/_shared/date.ts
9d2649be feat(api-server): add lms session admin api with lazy day-week materialization
8c3e8c45 test(api-server): cover session admin scenarios incl. tz invariance
61bb3eeb fix(api-server): harden session reorder and create against race and subset attacks
ff8e8033 test(api-server): cover delete non-owner case
```

Все subjects fully lowercase, body lines ≤150 chars, никаких `Co-Authored-By` /
`Generated-with` / skip-hook trailers. Все pre-commit + commit-msg hooks прошли без bypass'ов.

## Acceptance criteria self-check

- [x] **AC1.** `pnpm --filter @repo/api-server check-types` green — exit 0, `tsc --noEmit`
      no output.
- [x] **AC2.** `pnpm --filter @repo/api-server lint` green (`--max-warnings 0`) — exit 0,
      `eslint . --fix --max-warnings 0` no output.
- [x] **AC3.** `pnpm --filter @repo/api-server test` green incl. `week/admin.test.ts` (10),
      `_shared/date.test.ts` (6), `session/admin.test.ts` (14) — **504 / 504 passed across 69
      files, 275.22s**, exit 0.
- [x] **AC4.** `TZ=Asia/Kolkata pnpm --filter @repo/api-server test --run src/endpoints/lms/session/admin.test.ts`
      green — **14 / 14 passed, 14.61s**, exit 0.
- [x] **AC5.** `pnpm dep:check` clean — `no dependency violations found (1112 modules, 2029
dependencies cruised)`, exit 0.
- [x] **AC6.** Root `pnpm check-types` (16 workspaces, 12 cached, 27.8s) + `pnpm lint`
      (16 workspaces, 12 cached, 10.0s) — оба green, exit 0.
- [x] **AC7.** Grep regression `freezeLoadsAtCreation` — 0 matches в api-server src
      (Step 6.1 files: `_shared/date{,test}.ts`, `_shared/index.ts`, `mappers/lms/session.mapper.ts`,
      `endpoints/lms/session/admin{,test}.ts`, `endpoints/lms/session/index.ts`, plus modifications
      to `week/admin.ts`, `endpoints/lms/index.ts`, `mappers/lms/index.ts`, `authz/guards.ts`).
- [x] **AC8.** Grep regression `Session.name` / `session.name` — 0 matches в новом коде.
- [x] **AC9.** `week/admin.ts` post-refactor: single-line `import { resolveWeekStartDate }
from "../_shared";` (line 7) в place of deleted helpers; net diff `-20 / +1` (delta vs
      prompt `-18 / +1` covered в review REV-003 — два stranded imports lint требовал убрать).
- [x] **AC10.** Smoke-test N/A — api-server-only step, нет user-visible surface. Stated в
      Verification notes выше.

Step 6.1 закрыт.
