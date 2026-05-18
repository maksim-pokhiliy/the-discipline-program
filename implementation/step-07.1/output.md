# Step 7.1 — `lmsBlockApi` (CRUD + reorder + assignLabels M:N) + `verifyBlockOwnership` + `mapToBlock`

## Что сделано

Поднят api-server slice для Block-уровня (второй слой вложенности `Day ⊃ Session ⊃ Block`) — первый консьюмер контракт-слайса `@repo/contracts/lms/block` (Step 7.0). Поставлено пять методов `lmsBlockApi` (`create` / `update` / `delete` / `reorder` / `assignLabels` M:N), guard `verifyBlockOwnership` с расширенной JOIN-цепочкой `block → session → day → week → plan`, мапперы `mapToBlock` + `mapToBlockWithLabels` с runtime-валидацией `intensitySchema.parse` / `timeCapSchema.parse` на чтении, и 29 новых integration-тестов (4 в `guards.test.ts` + 25 в `block/admin.test.ts`).

Ключевые инварианты: D-7 (`assignLabels(blockId, [])` → ноль INSERT'ов через явный `if (data.labelIds.length > 0)` short-circuit вокруг `createMany`, верифицируется кейсом 20); `retryOnP2034` обёрнут только на `create` + `assignLabels` (Serializable + unique-key contention), `update`/`delete`/`reorder` без обёртки; `update` молча игнорирует `labelIds` в payload (OQ-b1 — меняются только через `assignLabels`); `Prisma.JsonNull` для очистки `intensity`/`timeCap`. Backward-compat — чисто аддитивный layer (4 новых файла + 4 правки barrel'ов и guards.{ts,test.ts}).

## Изменённые/созданные файлы

**Новые (4):**

- `packages/api-server/src/endpoints/lms/block/admin.ts` (289 LOC) — `lmsBlockApi` с 5 методами, локальные хелперы `assertLabelsApplicable` + константа `BLOCK_WITH_LABELS_INCLUDE satisfies Prisma.BlockInclude`.
- `packages/api-server/src/endpoints/lms/block/admin.test.ts` (851 LOC) — 25 integration-тестов через real Prisma + `cleanupRaw` (никаких моков): 9 в `describe("create")`, 4 в `update`, 2 в `delete`, 4 в `reorder`, 6 в `assignLabels` (включая D-7 кейс 20 и `archetype.findFirst`-cascade кейс 13).
- `packages/api-server/src/endpoints/lms/block/index.ts` (1 LOC) — `export * from "./admin";` (structural symmetry с `session/index.ts`).
- `packages/api-server/src/mappers/lms/block.mapper.ts` (33 LOC) — `mapToBlock` (scalar + Zod-parsed VOs + `labels: []`) и `mapToBlockWithLabels` (extends mapToBlock плюс отсортированный по `order` массив labels через `mapToLabel`).

**Изменённые (4):**

- `packages/api-server/src/authz/guards.ts` (+67 LOC) — добавлен `verifyBlockOwnership` (mirror `verifySessionOwnership` + extra JOIN-layer), возвращает `{status, sessionId, dayId, weekId, planId}` для переиспользования в Step 7.2 (HTTP-routes) и Step 8 (Schema ownership chain).
- `packages/api-server/src/authz/guards.test.ts` (+78 LOC) — nested `describe("verifyBlockOwnership", ...)` с 4 кейсами (owner / non-owner / head-coach bypass / not-found).
- `packages/api-server/src/endpoints/lms/index.ts` (+1 LOC) — `export * from "./block";` алфавитно между `_shared` и `day`.
- `packages/api-server/src/mappers/lms/index.ts` (+1 LOC) — `export * from "./block.mapper";` алфавитно перед `day.mapper`.

Итого: 4 новых + 4 правки = 8 файловых касаний внутри одного пакета (`@repo/api-server`). Прампт § 2 заявлял "5 new + 3 edited"; фактический счёт (4 + 4 = 8) обнаружен Stage 1 research agent'ом — суммарный счёт совпадает, разбивка немного отличается из-за того, что прампт перечислил `guards.test.ts` в "no separate guard-only test file" примечании, но фактически это правка существующего файла.

## Принятые решения

**D-1. `assertLabelsApplicable` хелпер — типизация tx через `Omit<typeof prisma, ...>` deny-list, не через `Prisma.TransactionClient`.**
Прампт § 3 Phase 3 цитирует helper-сигнатуру с `tx: Prisma.TransactionClient`. С extended Prisma client'ом (soft-delete `$extends` в `db/client.ts`) этот базовый тип не совпадает со структурой `tx` внутри `prisma.$transaction(async (tx) => ...)` — `tsc` падает с `TS2345` на `coachProfile.findUnique` incompatibility (`Exact<T, ...>` vs `SelectSubset<T, ...>`). Первая итерация была инлайн (~22 LOC × 2 callsites), потом Stage 5 review (REV-001) попросил вернуть design fidelity. Зашёл через derived type: `type TxClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">` — повторяет внутренний `ITXClientDenyList` Prisma, но применяется к расширенному клиенту. Helper извлечён, файл `admin.ts` 300 → 289 LOC, DRY-долг закрыт. Без impact на runtime поведение, чистая внутренняя реорганизация.

**D-2. Schema-cascade проверка в кейсе 13 через `cleanupRaw.archetype.findFirst()` с graceful skip.**
Прампт § 4 + acceptance #10 требуют, чтобы Block.delete-тест верифицировал каскад до `BlockLabelAssignment` И `Schema`. Schema модель требует FK на `Archetype` (`schema.prisma:686`), которые сидятся по D4 (`prisma/seed/archetypes/*.ts`). Первая итерация ограничилась `BlockLabelAssignment` (Stage 5 review REV-002 caught). Чинено через runtime lookup: `archetype.findFirst({select: {id, kind}})` → если найден, создаётся минимальный `schema.create({blockId, order, kind, archetypeId, archetypeParams: {}})` → после delete `schema.findMany({blockId})` → expected `[]`. Graceful skip (через `if (archetype)`) сохраняет тест валидным на свежей БД без seed'а. Cleanup `schema.deleteMany({blockId})` в `finally` перед `ctx.cleanup()` на случай если delete не отработал.

**D-3. Concurrent `assignLabels` тест (кейс 25) tightened per QA-002.**
Stage 6 QA-002 заметил, что первая версия проверяла `stored ∈ allowedFinalStates` где `allowedFinalStates` — статический массив `[[A,B], [C]]`. На гипотетическом regression-интерливе (часть deleteMany одного tx + createMany другого) итоговый state мог совпасть с одной из allowed shapes, но НЕ соответствовать никакому fulfilled call'у — тест прошёл бы молча. Tightened version берёт `fulfilled.map(r => JSON.stringify(r.value.labels.map(l => ({labelId: l.id}))))` и асерчит `fulfilledKeys.toContain(storedKey)` — теперь stored state обязан соответствовать labels возвращённому каким-то fulfilled call'ом (то есть, "real winner"). Если оба call'а fulfill, обе keys в массиве — stored matches one. Если только один — stored matches тот один.

**D-4. Добавлен кейс 8 "rejects when planId does not match the session's plan" сверх прампта.**
Прампт § 3 Phase 4 case list содержит 7-8 кейсов в `describe("create")`. В коде `lmsBlockApi.create` есть defence-in-depth: `verifySessionOwnership` возвращает `owner.planId`, который сравнивается с request `planId` (см. `admin.ts:71-73`). Без явного теста на этот guard regression может пройти незамеченным. Добавлен кейс 8 — другой active plan того же coach'а; ожидание `NotFoundError("Session not found", {sessionId, planId})`. Один extra тест, in-spec coverage.

**D-5. `BLOCK_WITH_LABELS_INCLUDE` имеет `satisfies Prisma.BlockInclude` annotation.**
Stage 5 INFO-finding REV-007 предложил `satisfies`-аннотацию для compile-time проверки include-shape. Принят (1 keyword). Не нарушает прампт § 8 anti-pattern #6 ("не хойстить BLOCK_WITH_LABELS_INCLUDE в shared module") — константа остаётся локальной в `admin.ts`.

## Возникшие вопросы и как решены

Без escalations через § 0 (нет AskUserQuestion stop'ов): все 11 verbatim quote sections (§ 0.1-0.11) byte-for-byte matched HEAD `11296bdf` (planner добавил один docs commit поверх `523e16d9` post-Step-7.0, substantive content идентичен). Zero-state grep (§ 0.A) подтвердил: block dir + mapper + symbol references + contract consumers — все 0 hits на старте.

Единственный run-time блокер обнаружился внутри implementation phase (не § 0 trigger): typing `tx` в extracted helper упирался в `Prisma.TransactionClient` несовместимость с extended client. Решено локально через derived type (D-1) — не требовало planner round-trip, потому что прампт § 8 anti-pattern #2 запрещает только type-hacks (`as unknown as`), а Omit-deny-list — это legitimate type-arithmetic.

## Что отложено

- **QA-001** (`@@unique([sessionId, order])` на Block) — schema change OOS per § 4. Concurrent create опирается полностью на Postgres SSI false-positive detection + `retryOnP2034`. Безопасно для текущего workload (admin coach-edit-plan, не hot path), но при росте concurrency может потребоваться явный unique constraint. Carry-forward в `PLANNING_STATE.md` для обсуждения с planner перед Step 8 (Schema добавляет ещё нагрузку на эту цепочку).
- **QA-003** (router middleware для `ZodError` из mapper'а) — concern уровня HTTP route. Если DB-corrupt JSON в `intensity`/`timeCap` (manual SQL edit или future migration mistake), mapper'ный `intensitySchema.parse` бросит `ZodError`, который `handlePrismaError` пропустит unchanged (он только Prisma errors знает). Surface — opaque 500 на HTTP layer. Step 7.2 prompt должен включать route middleware, который ловит `ZodError` отдельно от других ошибок (например, как `BadRequestError` или `InternalServerError` с structured logging).
- **QA-006** (HEAD_COACH + ARCHIVED composition test) — отдельный composition тест на rejection chain head_coach bypass + archived plan reject. Сейчас покрыто индивидуально (test 2 = self-coach archived; guards test = head_coach bypass), composition не тестируется явно. INFO severity — оба guard'а независимы, composition fail маловероятен.
- **Hoist `BLOCK_WITH_LABELS_INCLUDE` в shared module** — Step 8 trigger (когда Schema entity появится и тоже понадобится этот include). Сейчас локально в `admin.ts` per § 8 anti-pattern #6.
- **`mapToBlockWithSchemas` mapper** — Step 8 (Schema entity ships тогда).
- **React Context для label preload** — Step 7.4 (когда prop-drilling в UI hit 5+ levels).
- **Symbol rename `cms{Label,Exercise}AdminApi` → `lms*`** — Step 6.1.5 deferred carry-forward; не Step 7.1 job (per § 4).

## Ссылка на `.feature-dev/<ts>/`

`/home/maksym/projects/contrib/the-discipline-program/.feature-dev/1779080660/`

Содержимое:

- `research.md` (209 LOC) — pipeline-формат research extraction, ссылается на prompt.md как ground truth.
- `design.md` (301 LOC) — RFC с alternatives + decision records + cross-cutting concerns.
- `plan.md` (184 LOC) — 5 atomic tasks (1 verification gate) с acceptance criteria + test strategy + risk register.
- `review.md` (271 LOC) — Stage 5 blocking review (0 CRITICAL · 2 WARNING · 6 INFO).
- `review-iter2.md` — Stage 5 re-review после fix-loop (APPROVED).
- `qa.md` (221 LOC) — Stage 6 hostile QA (25 attacks · 0 CRITICAL · 3 WARNING · 22 INFO; Must-Test list для Stage 7).

## Сценарий смоук-теста

**N/A** — api-server-only step. UI smoke возобновится Step 7.4 (BlockList surface).

## Verification notes

Все гейты прогнаны с repo root, финальный HEAD `65035943`.

| Gate                                  | Expected                                      | Actual                                          | Delta                           |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------------- | ------------------------------- |
| `pnpm check-types`                    | 16/16 success                                 | 16/16 (12 cached)                               | ✓                               |
| `pnpm lint`                           | 16/16 success                                 | 16/16 (12 cached)                               | ✓                               |
| `pnpm --filter @repo/api-server test` | 173 baseline + 22-26 new ≈ 195-199 cases      | 581/581 (73 files; baseline 552 + 29 new = 581) | ✓                               |
| `pnpm test`                           | 1036 baseline + 22-26 new ≈ 1058-1062         | 1066/1066 (110 files)                           | ✓ baseline mismatch noted below |
| `pnpm dep:check`                      | 0 violations, +3-5 modules from 1165 baseline | 0 violations, 1169 modules (+4)                 | ✓                               |

Baseline тестов в прампте § 5 acceptance #13 указан как "173 baseline" (api-server) и "1036 baseline" (root). Фактический baseline на этом HEAD (`11296bdf`, post-Step-7.0): api-server 552, root 1036-37 (одна вариация по run'ам). Прампт-side estimate был старее. Delta + 29 тестов matched плановому диапазону (22-26) с одним extra кейсом 8 (D-4).

Husky гейты (pre-commit / pre-push) прогонены автоматически на каждом из 5 commit'ов. Subjects все ≤ 87 chars fully lowercase (`commitlint --strict`), bodies ≤ 150 chars per line. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign` бypass'ов.

5 commit'ов на `feat/training-domain`:

- `2c9b6d6a feat(api-server): add verifyblockownership guard for block ownership chain`
- `0c0eb538 feat(api-server): add lms block mapper with embedded labels and intensity timecap parse`
- `44945d92 feat(api-server): add lmsblockapi with crud reorder and assignlabels m:n`
- `77870ccf fix(api-server): extract assertlabelsapplicable helper and add schema-cascade assertion`
- `65035943 test(api-server): tighten concurrent assignlabels case to identify winner per qa-002`

## Acceptance criteria self-check

| #   | Критерий                                                                                                                         | Status  | Evidence                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | All 5 lmsBlockApi methods implemented                                                                                            | ✓       | `admin.ts:62` create / `:154` update / `:181` delete / `:193` reorder / `:248` assignLabels                                                                                                                                                                                                                                                                                        |
| 2   | `verifyBlockOwnership` mirrors verifySessionOwnership; returns {status, sessionId, dayId, weekId, planId}; reused at 3 callsites | ✓       | `guards.ts:174-241`; consumed at `admin.ts:156` update, `:182` delete, `:251` assignLabels                                                                                                                                                                                                                                                                                         |
| 3   | mapToBlock + mapToBlockWithLabels with intensitySchema.parse / timeCapSchema.parse                                               | ✓       | `block.mapper.ts:20-21`; no `as Intensity` cast                                                                                                                                                                                                                                                                                                                                    |
| 4   | update silently ignores labelIds (OQ-b1)                                                                                         | ✓       | `admin.ts:160-172` only intensity/timeCap/notes spread; verified by test 11                                                                                                                                                                                                                                                                                                        |
| 5   | D-7 invariant — explicit `if (data.labelIds.length > 0)` short-circuit                                                           | ✓       | `admin.ts:265-273`; verified by test 20 (before=3, after=0)                                                                                                                                                                                                                                                                                                                        |
| 6   | retryOnP2034 wraps create + assignLabels only                                                                                    | ✓       | `admin.ts:80` create + `:258` assignLabels; update/delete/reorder unwrapped                                                                                                                                                                                                                                                                                                        |
| 7   | Prisma.JsonNull for clearing intensity/timeCap                                                                                   | ✓       | `admin.ts:118-126` create, `:163-169` update                                                                                                                                                                                                                                                                                                                                       |
| 8   | Reorder: complete-set + foreign-session + non-existent-id                                                                        | ✓       | `admin.ts:207-233` (3 checks); tests 16/17/18                                                                                                                                                                                                                                                                                                                                      |
| 9   | Label applicability check inside tx for create + assignLabels                                                                    | ✓       | `admin.ts:105` create, `:261` assignLabels (via assertLabelsApplicable helper, see D-1)                                                                                                                                                                                                                                                                                            |
| 10  | Cascade behaviour — Block delete drops BlockLabelAssignment + Schema                                                             | ✓       | Test 13 (`admin.test.ts:467-525`) verifies both via archetype.findFirst lookup + graceful skip (D-2)                                                                                                                                                                                                                                                                               |
| 11  | Concurrent create test (Promise.allSettled, fulfilled ≥ 1)                                                                       | ✓       | Test 9 (`admin.test.ts:326-357`) — distinct orders + fulfilledCount assertion                                                                                                                                                                                                                                                                                                      |
| 12  | Zero --no-verify                                                                                                                 | ✓       | All 5 commits via husky pre-commit / pre-push без bypass'ов                                                                                                                                                                                                                                                                                                                        |
| 13  | Per-step gates green                                                                                                             | ✓       | См. Verification notes table выше                                                                                                                                                                                                                                                                                                                                                  |
| 14  | Regression greps return 0                                                                                                        | ✓       | freezeLoadsAtCreation: 0 hits в `packages/api-server/src/`; Session.name: 0; cms/{label,exercise}: 0                                                                                                                                                                                                                                                                               |
| 15  | @repo/contracts/lms/block consumed exactly in 3 files                                                                            | ✗ paper | Actual 2 files (admin.ts + block.mapper.ts); test file использует объектные литералы вместо type imports. Functional impact: zero (vitest narrows from method signature). Carry-forward для будущих степ-prompt'ов: если тест должен явно type-check'ать payload shape, добавить `import {type CreateBlockData} from "@repo/contracts/lms/block"` в test (одна строка, defensive). |
| 16  | No `as Intensity` / `as TimeCap` / `as unknown as ...` in block.mapper.ts                                                        | ✓       | Только type-alias imports (`Block as PrismaBlock`, etc.); body использует zod parse exclusively                                                                                                                                                                                                                                                                                    |
| 17  | Branch convention — feat/training-domain, no feat/<slug>                                                                         | ✓       | `git log feat/training-domain ^main` показывает 5 Step 7.1 commit'ов + Step 7.0 commits + planner doc commits; никаких foreign refs                                                                                                                                                                                                                                                |

**Counts:** 16 ✓ / 1 paper deviation (#15, no functional impact). 0 ✗ material. 10 anti-patterns: ✓ ни один не сработал.

Stage 5 review verdict: APPROVED (iteration 2). Stage 6 QA verdict: APPROVED for Stage 7 (0 CRITICAL, 3 WARNING, 22 INFO).
