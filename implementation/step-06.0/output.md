# Step 6.0 — Session contract slice + `lms/_shared` namespace — output

> Executor session, run via `/feature` (full pipeline). Branch `feat/training-domain`.
> Base `6942b6cd` → 4 feature commits. 13 files, +522 / −1.

## Что сделано

Заложен первый атомарный срез **Step 6.x** — чистый contract-only слайс, без api-server,
без platform, без UI, без Prisma-изменений. Slice внутренне полон и типобезопасен, но в
этом шаге у него ноль потребителей; они приходят в Steps 6.1–6.7.

Добавлено два соседних артефакта в `packages/contracts/src/entities/lms/`:

- **`_shared/` namespace** — новая папка для общих lms-примитивов. Здесь живёт
  `dayOfWeekSchema` — зеркальный enum для Prisma `DayOfWeek` (`MONDAY..SUNDAY`),
  реализован паттерном **Step 3 D11**: `as const`-кортеж + `z.enum`, без импорта
  `@prisma/client` (`contracts-no-prisma` правило). Также экспортируется
  `dayOfWeekValues` (для будущих UI-дропдаунов в Step 6.7) и тип `DayOfWeek =
z.infer<typeof dayOfWeekSchema>`. `_shared` создан сейчас, потому что Step 6.2 (Day
  metadata) тоже будет его импортировать — лучше один раз сделать сейчас, чем потом
  переезжать.

- **`session/` slice** — полный CRUD-контракт по образцу `lms/week/` (file layout) +
  `lms/training-plan/` (write-shape conventions):

  - `session.constants.ts` — `SESSION_CONSTANTS = { MAX_NOTES_LENGTH: 2000 }`
    (совпадает с `WEEK_CONSTANTS.MAX_NOTES_LENGTH` и
    `TRAINING_PLAN_CONSTANTS.MAX_DESCRIPTION_LENGTH` — консистентность над
    headroom'ом).
  - `session.schema.ts` — `sessionSchema` (7 полей: `id`, `dayId`, `order`, `labelId?`,
    `notes?`, `createdAt`, `updatedAt`; **без `name`, без `freezeLoadsAtCreation` per
    PLANNING_STATE Q10 + name guardrails**), `createSessionSchema` (`{ labelId?,
notes? }`, оба `.nullable().optional()`, `{}` валиден — empty-slot creation для
    «+ Add session» из Step 6.7), `updateSessionSchema = createSessionSchema` (alias),
    `reorderSessionsSchema` (`orderedIds: z.array(cuid).min(1).refine(unique)`).
  - `session-api.schema.ts` — два address-схемы (по гипотезе Q2 из планнерского тезиса,
    ратифицировано): `sessionByDayParamsSchema = { planId, startDate YYYY-MM-DD,
dayOfWeek }` (POST + reorder address — session живёт внутри day-слота);
    `sessionByIdParamsSchema = { planId, sessionId }` (PUT/DELETE address по PK —
    сервер проверит ownership через JOIN). Плюс 6 wrapper-схем для request/response.
  - `session.types.ts` + `session-api.types.ts` — `z.infer`-only re-exports
    (4 domain types + 8 api types).
  - `session.schema.test.ts` + `session-api.schema.test.ts` — две test-сюиты по
    образцу `cms/label/label.schema.test.ts`: `safeParse`-positive/negative,
    module-scope fixtures, cap-test пары на `MAX_NOTES_LENGTH`. Включают **regression
    guardrails** на отсутствие `freezeLoadsAtCreation` и `name` в shape (анти-drift
    для будущих сессий).
  - `index.ts` — barrel в `constants → schema → types → api-schema → api-types`
    порядке (mirror `lms/week`, `lms/plan-enrollment`).

- **Регистрация (additive only)** — обновлены `lms/index.ts` (`_shared` и `session`
  добавлены к существующим `plan-enrollment` / `training-plan` / `week`) и
  `package.json` exports map (`./lms/_shared` и `./lms/session` вставлены
  alphabetical-with-underscore-first; `./lms`, `./lms/plan-enrollment`,
  `./lms/training-plan`, `./lms/week` сохранены byte-for-byte).

- **`packages/contracts/README.md`** — однострочное обновление: subpath taxonomy
  теперь перечисляет `session` и упоминает `lms/_shared` для shared-примитивов.

## Изменённые/созданные файлы

**Новые (11):**

```
packages/contracts/src/entities/lms/_shared/day-of-week.ts                  15 LOC
packages/contracts/src/entities/lms/_shared/day-of-week.test.ts             18 LOC
packages/contracts/src/entities/lms/_shared/index.ts                         1 LOC
packages/contracts/src/entities/lms/session/session.constants.ts             3 LOC
packages/contracts/src/entities/lms/session/session.schema.ts               29 LOC
packages/contracts/src/entities/lms/session/session.schema.test.ts         249 LOC
packages/contracts/src/entities/lms/session/session-api.schema.ts           32 LOC
packages/contracts/src/entities/lms/session/session-api.schema.test.ts     132 LOC
packages/contracts/src/entities/lms/session/session-api.types.ts            21 LOC
packages/contracts/src/entities/lms/session/session.types.ts                13 LOC
packages/contracts/src/entities/lms/session/index.ts                         5 LOC
```

**Изменённые (3):**

```
packages/contracts/src/entities/lms/index.ts          +2 / −0   (additive)
packages/contracts/package.json                       +2 / −0   (additive exports map)
packages/contracts/README.md                          +1 / −1   (subpath taxonomy line)
```

Итого: **+522 / −1**, 14 файлов (11 NEW + 3 EDIT). API-server, platform, Prisma — не
тронуты. Analysis-files — не тронуты.

## Принятые решения

Все 13 design-решений из `.feature-dev/1778832091/design.md` (D-6.0-1 … D-6.0-13)
ратифицированы и применены. Сжатый список:

| ID       | Решение                                                                    | Источник                                                  |
| -------- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| D-6.0-1  | Новый `lms/_shared` namespace (не flat `lms/day-of-week.ts`)               | Step 6.2 тоже использует — однократный setup сейчас       |
| D-6.0-2  | `dayOfWeekValues as const` + `z.enum`, не `enum + z.nativeEnum`            | Step 3 D11 precedent, `contracts-no-prisma`               |
| D-6.0-3  | `type DayOfWeek = z.infer<...>`, не `(typeof tuple)[number]`               | zod-first convention в codebase                           |
| D-6.0-4  | `MAX_NOTES_LENGTH = 2000`                                                  | соответствует `WEEK_CONSTANTS`, `TRAINING_PLAN_CONSTANTS` |
| D-6.0-5  | `updateSessionSchema = createSessionSchema` (alias)                        | идентичные мутабельные поля; split позже если надо        |
| D-6.0-6  | Две address-схемы (`byDay` + `byId`)                                       | планнерская гипотеза Q2; разная семантика операций        |
| D-6.0-7  | `reorderSessionsSchema.orderedIds.min(1)`, не `.min(2)`                    | schema = wire-shape; handler в 6.1 short-circuit no-op    |
| D-6.0-8  | `createSessionSchema` принимает `{}` (empty slot OK)                       | D7 lazy-materialization + Step 6.7 «+ Add session» UX     |
| D-6.0-9  | **Нет `freezeLoadsAtCreation`** в контракте                                | PLANNING_STATE Q10 binding; DB column stays default-false |
| D-6.0-10 | **Нет `Session.name`** в контракте                                         | PLANNING_STATE name guardrail; Prisma model has no `name` |
| D-6.0-11 | Barrel order: `constants → schema → types → api-schema → api-types`        | mirror `lms/week`, `lms/plan-enrollment`                  |
| D-6.0-12 | `lms/index.ts` additive с `_shared` + `session` (preserve plan-enrollment) | CONTEXT-001 resolved by planner — additive intent         |
| D-6.0-13 | `package.json` exports map additive (preserve `./lms/plan-enrollment`)     | CONTEXT-001 resolved by planner                           |

**Stage 6 QA-fix добавочное решение (ratified by planner via AskUserQuestion):**

- **Apply QA-002** — добавлен `.refine((ids) => new Set(ids).size === ids.length, …)`
  в `reorderSessionsSchema` (паттерн `cms/label/label.schema.ts:18`). Defence-in-depth
  на wire-layer — даже если UI-баг продублирует cuid, schema его отобьёт ещё до
  попадания в handler. Sibling slices не трогаем — добавление точечное, относится к
  этой конкретной reorder-операции, не к codebase-wide convention.
- **Skip QA-001** — НЕ добавлен `.max(2_147_483_647)` int4-cap к `sessionSchema.order`.
  Codebase convention: ни одна `order`-схема в contracts не имеет cap; real risk ~0
  (server-controlled sparse-int recompute); single-slice cap = asymmetry. Future
  cross-slice cleanup, не Step 6.0 scope.
- **Skip QA-003** — НЕ tighten regex `startDate` под calendar validity. Regex точно
  matches `weekByPlanAndDateParamsSchema:6` (Step 5). Tighten здесь без `week` =
  asymmetry; tighten обе схемы = cross-slice job out of scope.

## Возникшие вопросы и как решены

**1. CONTEXT-001 (Stage 1 finding, resolved by planner)** — prompt § 3.3 «current
state» snippets для `lms/index.ts` и `package.json` exports map пропускали
существующую `plan-enrollment` строку. Дословное применение удалило бы её. Surfacing
с гипотезой остановило шаг; планнер подтвердил additive intent, обновил prompt в
`6942b6cd fix(step-06.0): record actual lms registration state in prompt`, переход
продолжен без потерь. Lesson зафиксирована планнером в IMPLEMENTATION_LOG как
третий flavour instinct-specing (`instinct-registration-read`).

**2. QA-001 / QA-002 / QA-003 (Stage 6 critical findings, resolved by planner via
AskUserQuestion)** — adversarial QA нашёл три CRITICAL findings, которые при ближнем
чтении оказались **design-level pushback против ratified spec'а**, а не баги
имплементации:

- **QA-001** (int4 cap on `order`) — codebase convention: cap отсутствует везде.
  Реальный risk пренебрежимо мал (server-side sparse-int recompute). Решение —
  Skip; flag как INFO для будущего cross-slice cleanup.
- **QA-002** (duplicate cuids в reorder) — реально нелогичный foot-gun. Defence-in-depth
  на schema-layer стоит 4 строки. Решение — Apply; `.refine` добавлен; regression-тест
  добавлен.
- **QA-003** (startDate regex calendar validity) — regex unchanged copy из `week-api`.
  Tighten здесь = asymmetry. Решение — Skip; cross-slice если когда-то.

**3. Commitlint subject-case** — первая попытка коммита `fix(contracts): reject
duplicate cuids in reorderSessionsSchema` отбита (`subject-case`-rule запрещает
любые capitals, включая camelCase identifiers). Переформулировано в
`reorder-sessions schema`. Хуки никогда не bypass.

**4. Commitlint body-max-line-length** — первая попытка коммита Stage 4 имела
single-paragraph body 800+ chars в одной строке. Переформатирован под ≤150
chars/line. Root-cause-фикс по WORKFLOW.md правилу, без `--no-verify`.

## Что отложено

Все «не делать» из prompt § 4 соблюдены и переадресованы в будущие шаги:

- **`lmsSessionApi`** — Step 6.1. Здесь будет `mapToSession`, CRUD-handlers, reorder
  через sparse-order recompute, экстракция `resolveWeekStartDate` в
  `endpoints/lms/_shared/date.ts` (QA-001 hard carry-forward по timezone-boundary).
- **`lmsDayMetadataApi` + `getWeekResponseSchema` extension** — Step 6.2. `_shared`
  готов под `dayOfWeekSchema` потребление.
- **`lmsLabelPlatformApi`** — Step 6.3.
- **Platform routes / hooks / UI** — Steps 6.4–6.7.
- **`Session.freezeLoadsAtCreation`** — индефинитный deferred (Q10). Поднимется только
  если/когда конкретный coach use-case для «testing-week» появится. Сейчас не
  surfaced и regression-тест в session.schema.test.ts удержит будущие сессии от
  silent re-add.
- **`Session.name`** — индефинитный deferred. Idem Q10: regression-тест на
  `shape.name === undefined` пресекает drift.
- **QA WARNING-уровень** (10 findings: int4 cap, reorder-max, notes-max-on-read,
  Date-roundtrip docs, strict-mode-default, deep-import lint, `Session` vs
  next-auth name-shadow, real-cuid-fixtures, UTF-16 vs grapheme notes-cap) —
  все задокументированы в `.feature-dev/1778832091/qa.md`. Не блокируют Step
  6.0; могут быть подняты планнером отдельным cleanup-стэйджем когда tradeoff
  окажется выгодным.

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1778832091/` содержит полный pipeline:

- `research.md` (60 КБ, A-grade, hard-trigger scan clean, baseline status green)
- `design.md` (48 КБ, 13 binding decisions D-6.0-1 … D-6.0-13)
- `plan.md` (26 КБ, 12 atomic tasks, dependency graph, test strategy)
- `review.md` (Staff-engineer review: CRITICAL 0 / WARNING 0 / INFO 3 → APPROVE)
- `qa.md` (Hostile adversarial: 144 probes / 24 broken / 19 findings: 3 CRITICAL +
  10 WARNING + 6 INFO)

## Verification notes

**Final gates (all green on HEAD `a6678b57`):**

| Gate                                        | Result                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @repo/contracts check-types` | green                                                                                                                               |
| `pnpm --filter @repo/contracts lint`        | green (zero warnings, `--max-warnings 0`)                                                                                           |
| `pnpm --filter @repo/contracts test`        | **160 tests passed across 11 files** (baseline was 115 / 8)                                                                         |
| `pnpm dep:check`                            | green — 1105 modules, 2012 dependencies, **0 violations** (`contracts-no-prisma` holds; no `@prisma/client` import in any new file) |
| Root `pnpm check-types`                     | green — 16 workspaces                                                                                                               |
| Root `pnpm lint`                            | green — 16 workspaces                                                                                                               |

**Test breakdown:**

- `_shared/day-of-week.test.ts` — 2 cases (positive loop + negative quad).
- `session/session.schema.test.ts` — 25 cases (`sessionSchema` 7 / `createSessionSchema`
  9 / `updateSessionSchema` 8 / `reorderSessionsSchema` 4 — includes Q10/name guardrails
  - QA-002 duplicate rejection + alias identity).
- `session/session-api.schema.test.ts` — 15 cases (`sessionByDayParamsSchema` 5 /
  `sessionByIdParamsSchema` 3 / wrapper alias identity 5 /
  `reorderSessionsResponseSchema` 2).

**Forbidden-pattern grep on new files (all 0 matches):**

- `grep -rn "as any" packages/contracts/src/entities/lms/_shared
packages/contracts/src/entities/lms/session` → 0.
- `grep -rn "as unknown" …` → 0.
- `grep -rn "@prisma/client" …` → 0.
- `grep -rn "freezeLoadsAtCreation" …` → 0.
- `grep -rEn "^\s*//|^\s*/\*" …` → 0 (zero code comments).
- `grep -nE "\bname\b" …` → 0 (no `Session.name` field invented; `name` outside `as
property key` doesn't appear).

**Hard-trigger vocab scan (all 0 matches in new files):** `SchemeType`, `SETS_REPS`,
`per-block atomic save`, `coach always edit mode`, `plan-editor rollback`,
`ADR-0037/0041/0042/0043`.

**Сценарий смоук-теста:** **N/A** — contract-only step, нет user-visible surface,
нет api-server / platform / UI кода. Smoke-test возвращается в Steps 6.6 + 6.7.

## Acceptance criteria self-check

| Critère (prompt § 5)                                                                                                                          | Status                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @repo/contracts check-types` green                                                                                             | ✅                                                                                                                                                                     |
| `pnpm --filter @repo/contracts lint` green                                                                                                    | ✅                                                                                                                                                                     |
| `pnpm --filter @repo/contracts test` green (incl. 2 new test files — `day-of-week.test.ts` 2 cases + `session.schema.test.ts` per § 3.2 list) | ✅ (фактически 3 test файла включая `session-api.schema.test.ts` — добавлен в Stage 7 как покрытие QA-011 + Q10/name regression guardrails; 160 tests vs 115 baseline) |
| `pnpm dep:check` clean — `contracts-no-prisma` holds                                                                                          | ✅ (0 violations across 1105 modules)                                                                                                                                  |
| Root `pnpm check-types` + `pnpm lint` green                                                                                                   | ✅                                                                                                                                                                     |
| No `as any` / `as unknown` / unjustified `!`                                                                                                  | ✅                                                                                                                                                                     |
| No code comments                                                                                                                              | ✅                                                                                                                                                                     |
| Smoke-test N/A                                                                                                                                | ✅                                                                                                                                                                     |

Commits на `feat/training-domain` (HEAD `a6678b57`):

```
a6678b57 docs(contracts): list session subpath and lms _shared note
78a2238c test(contracts): cover must-test scenarios from stage 7 for session slice
44af3f5b fix(contracts): reject duplicate cuids in reorder-sessions schema
5e4144bc feat(contracts): add session slice and lms _shared namespace
```

Все subjects fully lowercase, body lines ≤150 chars, никаких co-author-by /
generated-with / skip-hook trailers. Все pre-commit и commit-msg hooks прошли
без bypass'ов.

Step 6.0 закрыт.
