# Step 8.3.5 — Executor output report

`schemas[]` + `alternatingGroups[]` read-embed в `blockSchema`. Выполнено через `/feature small` пайп. Ветка `feat/training-domain` (long-lived, branch-cut override per `[[always-via-feature-skill]]` + `[[training-domain-workflow]]` — новой ветки нет). Baseline `git diff` — prompt-commit `c80e18c7`.

## Что сделано

Расширена read-поверхность блока — структурный twin Step 7.3.5 (`b8a6982f`, Block-embed в week response), на уровень глубже. Две части:

1. **Contract layer (`@repo/contracts`)** — добавлена рекурсивная Zod-схема `schemaWithBodySchema` (`{ schema, rows, subSchemas }`, self-reference через `z.lazy` + `z.ZodType<…>` annotation, зеркало `schemaSchema`); `blockSchema` расширен `schemas: z.array(schemaWithBodySchema)` + `alternatingGroups: z.array(alternatingGroupSchema)`. Через цепочку `getWeekResponseSchema → daySlotSchema → sessionWithLabelSchema → blockSchema` `GetWeekResponse` расширяется транзитивно — без правок `day.schema.ts` / `week-api.schema.ts`.
2. **api-server layer (`@repo/api-server`)** — новый mapper `mapToBlockWithSchemas` (extends `mapToBlockWithLabels`, собирает depth-2 дерево `SchemaWithBody` через `mapToSchema` + `mapToSchemaRow`, `alternatingGroups` через `mapToAlternatingGroup`); `mapToBlock` расширен `schemas: []` + `alternatingGroups: []` (partial-population idiom — зеркало `labels: []`); `mapToSessionWithLabelAndBlocks` переключён на `mapToBlockWithSchemas`; оба block-include (`week/admin.ts` inline + `day/admin.ts` `DAY_INCLUDE`) расширены идентично — depth-2 `schemas` (с обязательным `where: { parentSchemaId: null }`) + `alternatingGroups`.

После 8.3.5 read-поверхность блока завершена end-to-end: week read path возвращает каждый блок с полным depth-2 деревом схем и его alternating-группами. Step 8.4 plan-editor рендерит схемы внутри блоков прямо из `useWeek`. UI шаг не несёт (Step 8.4+); coach на экране ничего нового не видит — невидимая прослойка.

Шаг чисто аддитивный: 0 новых файлов, 7 файлов production-кода + 5 тестовых. Ни один существующий идентификатор не переименован; ни одна публичная сигнатура не изменена (`blockSchema` / `Block` расширяются — это additive widening).

## Изменённые/созданные файлы

`git diff c80e18c7..HEAD --stat`: 12 файлов, +675 / −18. NEW: 0. Touched packages: `@repo/contracts`, `@repo/api-server`.

| Файл                                                               | Δ      | Назначение                                                                                                              |
| ------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/entities/lms/schema/schema.schema.ts`      | +15    | `schemaWithBodySchema` (рекурсивная `z.lazy`, `z.ZodType<SchemaWithBody>`) + экспорт структурного типа `SchemaWithBody` |
| `packages/contracts/src/entities/lms/schema/schema.types.ts`       | ~10    | `SchemaWithBody` re-export из `schema.schema.ts` (hand-written дубликат удалён)                                         |
| `packages/contracts/src/entities/lms/block/block.schema.ts`        | +4     | `blockSchema` += `schemas` + `alternatingGroups`; barrel-импорты `../schema` + `../alternating-group`                   |
| `packages/contracts/src/entities/lms/schema/schema.schema.test.ts` | +87    | `describe("schemaWithBodySchema")` — flat / nested depth-2 / empty rows / missing-field                                 |
| `packages/contracts/src/entities/lms/block/block.schema.test.ts`   | +90/−6 | `baseBlock` фикстура += embed-поля; populated-embed case; **negative-guard `not.toHaveProperty("schemas")` удалён**     |
| `packages/contracts/src/entities/lms/day/day.schema.test.ts`       | +2     | `baseBlock` фикстура += `schemas: []` + `alternatingGroups: []`                                                         |
| `packages/api-server/src/mappers/lms/block.mapper.ts`              | +37    | `mapToBlock` += `schemas: []` / `alternatingGroups: []`; новый `mapToBlockWithSchemas` + relation-типы                  |
| `packages/api-server/src/mappers/lms/day.mapper.ts`                | ~17    | `mapToSessionWithLabelAndBlocks` → `mapToBlockWithSchemas`; `SessionWithRelations` / block relation-тип расширены       |
| `packages/api-server/src/endpoints/lms/week/admin.ts`              | +14    | inline `blocks` include расширен depth-2 `schemas` + `alternatingGroups`                                                |
| `packages/api-server/src/endpoints/lms/day/admin.ts`               | +14    | `DAY_INCLUDE` `blocks` include расширен идентично (dual-include — D-8.3.5-4)                                            |
| `packages/api-server/src/endpoints/lms/week/admin.test.ts`         | +325   | 5 case'ов embed'а в week response                                                                                       |
| `packages/api-server/src/endpoints/lms/day/admin.test.ts`          | +72    | 1 case embed'а через `DAY_INCLUDE` (`setLabel` `DaySlot`)                                                               |

Не touched: `block-api.schema.ts`, `day.schema.ts`, `week-api.schema.ts`, все barrel'ы (`*/index.ts`), `block/admin.ts`, все route-хендлеры, `apps/platform`, `apps/admin`, Prisma schema, seed, `analysis/`.

**Коммиты (2 — § 6):**

1. `2ee659cd` — `feat(training-domain): embed schemas and alternating groups in block read` (squash — один шаг; per-layer body).
2. (этот) — `docs(step-08.3.5): write executor output report`.

Один squash вместо per-layer atomic: cross-package без зелёного промежуточного порядка — `@repo/contracts`-first оставляет `mapToBlock` без новых полей → `turbo check-types --filter="...[HEAD]"` падает на этом коммите; `@repo/api-server`-first невозможен (нужен расширенный contract-тип). Per `[[husky-cross-package-squash]]`, зеркало 7.3.5.

## Принятые решения

Все решения предопределены § 1.x prompt'а (D-8.3.5-1..-8); исполнитель их применил. Ключевые:

- **D-8.3.5-2 — рекурсивная `schemaWithBodySchema`.** Схема следует declaration-form `schemaSchema`: `z.lazy(() => z.object({ schema: schemaSchema, rows: z.array(schemaRowSchema), subSchemas: z.array(schemaWithBodySchema) }))` с явной `z.ZodType<…>` annotation. Депт-2 bound (sub-schema никогда не `NESTED`) — доменный инвариант write-side `schemaSchemaWithInvariants` + depth-2 include, **не** Zod-type-констрейнт; схема остаётся рекурсивной и инферит ровно существующий shape `SchemaWithBody`. Спеллинг wiring `schema.types.ts` отклонён от буквы D-8.3.5-2 — см. § «Возникшие вопросы», OQ-1.
- **D-8.3.5-3 — расширен base `blockSchema`.** `schemas` / `alternatingGroups` добавлены прямо в единственную base-схему (block-слайс не имеет base + `with-X` варианта — зеркало того, как уже свёрнут `labels[]`). Block CRUD-эндпоинты возвращают `schemas: []` / `alternatingGroups: []` через base `mapToBlock`; клиент инвалидирует week-query → рефетчит authoritative populated state. Идентично pre-existing `labels: []` idiom.
- **D-8.3.5-4 — `mapToBlockWithSchemas` + оба include.** Новый mapper extends `mapToBlockWithLabels` (не `mapToBlock` — week-embed несёт `labels`). `mapToSessionWithLabelAndBlocks` переключён → `SessionWithRelations` расширяется → оба include (`week/admin.ts` inline + `DAY_INCLUDE`) расширены идентично, т.к. `mapToDaySlot` общий для week-read и day-metadata side-channel (`setLabel`/`setNotes`). Зеркало резолюции Step 7.3.5 D-1. `schemas`-include depth-2: top-level `where: { parentSchemaId: null }`, `subSchemas` через self-relation, `rows` на обоих уровнях, `orderBy: { order: "asc" }` на каждом уровне.
- **D-8.3.5-5 — `alternatingGroups[]` embed свёрнут в этот шаг.** `blockSchema` += `alternatingGroups: z.array(alternatingGroupSchema)`; include += `alternatingGroups: { include: { schemas: { select: { id: true } } } }` (`mapToAlternatingGroup` деривит `schemaIds` из member-схем). Read-shape блока (`labels` + `schemas` + `alternatingGroups`) собран одним шагом; coach-facing UX группировки всплывает позже (archetype `alternating-sets`, queue 8.10) — поле едет нерендеренным.
- **D-8.3.5-6 — без клиентского адаптера.** Расширенный `blockSchema` течёт через `getWeekResponseSchema → GetWeekResponse → useWeek` транзитивно; week-route — `createAuthGetByParamHandler(…, getWeekResponseSchema)` фабрика, авто-адаптируется. `apps/platform` байт-в-байт.
- **D-8.3.5-7 — hoist НЕ триггерится.** Дублированный block-include (`week/admin.ts` + `DAY_INCLUDE`) расширен in-place, обе копии идентичны. Hoist в shared-модуль триггерится на 3-м callsite; 8.3.5 не добавляет ни одного. Зеркало accepted-duplication 7.3.5.

## Возникшие вопросы и как решены

| OQ   | Вопрос                                                                                                                                                                          | Решение                                                                                                                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OQ-1 | D-8.3.5-2 буквально требует `schema.types.ts`: `SchemaWithBody = z.infer<typeof schemaWithBodySchema>` (зеркало `Schema = z.infer<typeof schemaSchema>`). Это не компилируется. | Спеллинг отклонён от буквы, intent сохранён. См. ниже.                                                                                                                                                                                     |
| OQ-2 | `block.schema.test.ts` содержит negative-guard `it("does not expose schemas …")` (`not.toHaveProperty("schemas")`). § 2 prompt'а его явно не называет.                          | Guard **удалён** целиком: поверхность, которую он сторожил, теперь существует by design — этот шаг и есть его retirement. Sibling-guard `not.toHaveProperty("name")` оставлен (8.3.5 не добавляет `name`). Flagged стадией Research-Light. |

**OQ-1 (отклонение от буквы D-8.3.5-2 — intent сохранён).** Буквальный wiring `SchemaWithBody = z.infer<typeof schemaWithBodySchema>` даёт жёсткий `TS4023`. Три причины: (1) рекурсивная `z.ZodType<T>`-схема не может быть аннотирована собственным `z.infer` — циклично; (2) precedent `schemaSchema` держит свой annotation-тип `SchemaShape` локальным/неэкспортированным — это работает **только** потому что `SchemaShape` нерекурсивен (TS инлайнит его структурно); рекурсивный annotation-тип инлайнить нельзя, TS обязан назвать его, а неэкспортированный — `TS4023` (тип течёт в инферированный тип `blockSchema` → в `block-api.schema.ts` / `day.schema.ts` / `week-api.schema.ts`); (3) определить рекурсивный тип в `schema.types.ts` и импортировать в `schema.schema.ts` для аннотации — создаёт circular import между двумя файлами (`schema.types.ts` уже импортирует из `schema.schema.ts`).

Резолюция, сохраняющая intent D-8.3.5-2 (одно каноническое определение, ноль drift, без hand-written дубликата): рекурсивный структурный тип `SchemaWithBody` определён **один раз и экспортирован** из `schema.schema.ts` (рядом со схемой, которую аннотирует — зеркало того, что `SchemaShape` живёт в `schema.schema.ts`); `schemaWithBodySchema: z.ZodType<SchemaWithBody>` пришпилен к нему — TS отвергает любое расхождение `z.lazy`-тела с типом, drift невозможен. `schema.types.ts` делает `export { type SchemaWithBody } from "./schema.schema"` — сохраняя конвенцию «все типы слайса видны из `schema.types.ts`». `z.infer<typeof schemaWithBodySchema>` доказуемо идентичен `SchemaWithBody`; отличается только спеллинг, не семантика. Это канонический Zod-паттерн для рекурсивных схем. Review-Light верифицировал резолюцию как sound (включая эмпирическую пробу: dual-path barrel re-export `SchemaWithBody` — `TS2308` не возникает, т.к. оба пути резолвятся в один и тот же символ).

Структурных отклонений (архитектура / data model / API contract) не возникло — `mapToBlockWithSchemas` собран как § 3.2 описывает, оба include расширены идентично, ни один out-of-scope файл не тронут. Минорная правка: lint `--fix` (prettier) косметически свернул несколько выражений — без семантики.

## Что отложено

Ничего нового исполнителем не отложено. Forward-notes prompt § 7 остаются в силе:

- **Hoist дублированного block-include — НЕ этот шаг (D-8.3.5-7).** `week/admin.ts` inline-include и `DAY_INCLUDE` дублированы; 8.3.5 расширил обе копии in-place, идентично. Hoist в shared-модуль остаётся deferred (триггер — 3-й callsite).
- **Schema-editing UI — Step 8.4+** (anchor) и **Step 8.10** (`alternating-sets` bracket). 8.3.5 несёт только read-shape.
- **`@@unique` констрейнты** — `SchemaRow @@unique([schemaId, order])` это Step 8.3.6; `Schema` partial-unique — Step 8.3.7.
- **Toast-policy (D-8.3-6), REVIEW-I4/I5/I6 + QA-W1/W2 + QA-D1 + QA-I2** — carry-forward'ы для отдельного `/fix` bundle; 8.3.5 их не касается.

`analysis/`-файлы не менялись — 8.3.5 это read-shape widening существующих entity-relations, без смены доменной семантики и без Prisma-изменений (`SchemaWithBody` уже существует в `06-formalization/types.ts`). Per WORKFLOW.md `analysis/`-правила — зеркало Step 7.3.5 («Analysis/-files touched: none»).

## Ссылка на `.feature-dev/1779359228/`

`.feature-dev/1779359228/` — артефакты пайплайна:

- `research.md` — Research-Light: верификация всех § 0 verbatim-claims против текущего кода (0 drift; flagged retirement negative-guard'а — OQ-2).
- `review.md` — Review-Light: вердикт `APPROVED`, 0 CRITICAL / 0 WARNING / 1 INFO (REVIEW-INFO-1 — ожидаемая red-стадия тестов, закрыта S-Stage 4). Все 5 § 5 traps верифицированы; D-8.3.5-2-резолюция подтверждена sound.
- `tasks.md` — трекинг 5 стадий small-пайпа.

## Verification notes

- `pnpm check-types` (root) — **16/16** ✓
- `pnpm lint` (root) — **16/16, 0 warnings** ✓
- `pnpm dep:check` — **0 violations** (1283 modules, 2427 dependencies) — нового цикла нет (`block.schema.ts` += импорты `../schema` + `../alternating-group`; ни один файл этих слайсов не импортирует `../block`) ✓
- `pnpm test` (root) — **132 файла / 1691 тест, все зелёные** (535s). Per-package в ходе работы: `@repo/contracts` 763 passed; `@repo/api-server` 717 passed + 1 flake `block/admin.test.ts:406` (QA-023 `expect(elapsed).toBeLessThan(50)`, файл 8.3.5 не трогает) — re-run в изоляции 27/27 green; в финальном корневом прогоне не воспроизвёлся.
- Husky pre-commit (`check-secrets` → `lint-staged` → `turbo check-types`) — чисто на обоих коммитах. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
- Browser smoke-test — N/A (runtime UI-поверхности нет; embed верифицирован contract + api-server тестами; UI smoke возобновляется на Step 8.4 anchor).

## Acceptance criteria self-check

| #   | Критерий                                                                                                                                                              | Статус                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | `schemaWithBodySchema` — рекурсивная `z.lazy` + `z.ZodType<…>`; инферит shape `SchemaWithBody`; `schema.types.ts` без drift-prone дубликата                           | ✅ (wiring — re-export, не `z.infer`-спеллинг; OQ-1, intent сохранён) |
| 2   | `blockSchema` += `schemas` + `alternatingGroups`; barrel-импорты `../schema` + `../alternating-group`                                                                 | ✅                                                                    |
| 3   | `block-api.schema.ts`, `day.schema.ts`, `week-api.schema.ts`, barrel'ы — byte-identical                                                                               | ✅ (diff name-only = ровно 12 файлов)                                 |
| 4   | `mapToBlock` += `schemas: []` / `alternatingGroups: []`; `mapToBlockWithLabels` без изменений; `block/admin.ts` без изменений                                         | ✅                                                                    |
| 5   | `mapToBlockWithSchemas` — extends `mapToBlockWithLabels`, depth-2 `SchemaWithBody`-дерево + `alternatingGroups`                                                       | ✅                                                                    |
| 6   | `mapToSessionWithLabelAndBlocks` использует `mapToBlockWithSchemas`; `SessionWithRelations` расширен                                                                  | ✅                                                                    |
| 7   | `week/admin.ts` include И `DAY_INCLUDE` расширены идентично; `where: { parentSchemaId: null }`; depth-2; `orderBy` asc везде                                          | ✅                                                                    |
| 8   | Contract-тесты покрывают `schemaWithBodySchema` (flat / nested-depth-2 / empty); `blockSchema` фикстуры обновлены; зелёные                                            | ✅                                                                    |
| 9   | api-server-тесты покрывают embed в week + `DaySlot` (block с schemas/rows, nested, empty, ordering, alternating group)                                                | ✅                                                                    |
| 10  | Нет нового client hook / адаптера / GET-роута; `apps/*`, Prisma, seed, `analysis/` — byte-identical                                                                   | ✅                                                                    |
| 11  | Нет hoist'а (D-8.3.5-7); нет toast-изменений; `/fix`-bundle carry-forward'ы не тронуты                                                                                | ✅                                                                    |
| 12  | `check-types` 16/16; `lint` 16/16 0 warnings; `test` зелёный; `dep:check` 0 violations, нового цикла нет                                                              | ✅ (см. Verification notes)                                           |
| 13  | Один squash-коммит + docs-коммит; husky pre-commit/pre-push чисто; zero skip-флагов                                                                                   | ✅                                                                    |
| 14  | `git diff c80e18c7..HEAD` — изменения только в `contracts/.../{schema,block,day}` + `api-server/.../{mappers/lms,endpoints/lms/{week,day}}` + `step-08.3.5/output.md` | ✅                                                                    |
