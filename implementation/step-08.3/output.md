# Step 8.3 — Executor output report

Platform client API + TanStack hooks для слайсов `Schema` / `SchemaRow` / `AlternatingGroup`. Выполнено через `/feature small` пайп. Ветка `feat/training-domain` (long-lived, branch-cut override per `[[always-via-feature-skill]]`). Baseline `git diff` — prompt-commit `26f3e697`.

## Что сделано

Поставлен клиентский consumer-слой для трёх api-слайсов, зеркало Step 7.3 (Block). Две части:

1. **Endpoint-фабрики** — 3 модуля `createXxxAPI(client: ApiClient)` в `apps/platform/src/lib/api/endpoints/`, 12 методов суммарно (по одному на каждый из 12 write-методов роутов Step 8.2). Зарегистрированы в `endpoints/index.ts` + `api/index.ts`.
2. **Mutation-хуки** — 12 хуков `useXxx` в `apps/platform/src/lib/hooks/`, каждый поверх `useWeekMutation`, сигнатура `(planId, startDate)`. Зарегистрированы в `hooks/index.ts`.

После 8.3 будущий plan-editor UI (8.4+) получает типизированную mutation-поверхность для Schema / SchemaRow / AlternatingGroup. Только write-методы — read-хука нет (GET-роута не существует, D-8.2-2; read-поверхность это Step 8.3.5). UI нет (Step 8.4+). Новых тестов нет — зеркалит Block precedent (§ 5).

Шаг чисто аддитивный: 6 новых файлов + 3 barrel'а получают новые строки. Ни один существующий идентификатор не переименован, ни одна сигнатура не изменена.

## Изменённые/созданные файлы

**Создано (6):**

- `apps/platform/src/lib/api/endpoints/schemas.ts` — `createSchemasAPI`: `create` / `update` / `delete` / `reorder`.
- `apps/platform/src/lib/api/endpoints/schema-rows.ts` — `createSchemaRowsAPI`: `create` / `update` / `delete` / `reorder`.
- `apps/platform/src/lib/api/endpoints/alternating-groups.ts` — `createAlternatingGroupsAPI`: `create` / `delete` / `addMember` / `removeMember`.
- `apps/platform/src/lib/hooks/use-schemas.ts` — `useCreateSchema` / `useUpdateSchema` / `useDeleteSchema` / `useReorderSchemas`.
- `apps/platform/src/lib/hooks/use-schema-rows.ts` — `useCreateSchemaRow` / `useUpdateSchemaRow` / `useDeleteSchemaRow` / `useReorderSchemaRows`.
- `apps/platform/src/lib/hooks/use-alternating-groups.ts` — `useCreateAlternatingGroup` / `useDeleteAlternatingGroup` / `useAddAlternatingGroupMember` / `useRemoveAlternatingGroupMember`.

**Изменено (3):**

- `apps/platform/src/lib/api/endpoints/index.ts` — +3 `export { … }` строки (алфавитно).
- `apps/platform/src/lib/api/index.ts` — +3 ключа в `createApi` (`alternatingGroups`, `schemaRows`, `schemas`).
- `apps/platform/src/lib/hooks/index.ts` — +3 `export *` строки (алфавитно).

`git diff 26f3e697..HEAD --stat`: 9 файлов, +240 / −0. Всё в `apps/platform/src/lib/{api,hooks}/`.

**Коммиты (3, per-layer atomic, без squash — § 6):**

1. `f0adca8a` — `feat(platform): add client api factories for schema schema-row and alternating-group`
2. `10bcd4b6` — `feat(platform): add schema schema-row and alternating-group mutation hooks`
3. (этот) — `docs(step-08.3): write executor output report`

## Принятые решения

Все решения предопределены § 1.x prompt'а (D-8.3-1..6); исполнитель их применил, не вводя своих. Ключевые:

- **D-8.3-4 — api-level `*Request` типы в параметрах.** Методы фабрик и TVars хуков `reorder`/`addMember` (и для единообразия `create`/`update`) типизированы api-уровневыми `*Request`-типами, НЕ entity `*Data`. Причина: `ReorderSchemasData` / `ReorderSchemaRowsData` не несут body-scope (`blockId` / `parentSchemaId` / `schemaId`), который требует `z.union` роута; entity-тип скомпилировался бы чисто, но дал бы runtime 400. `TResult` payload'ы — entity-типы `Schema` / `SchemaRow` / `AlternatingGroup`; `reorder` возвращает inline-wrapped `{ schemas: Schema[] }` / `{ schemaRows: SchemaRow[] }` (зеркало `createBlocksAPI.reorder`).
- **D-8.3-5 — `removeMember` через `client.request`.** Роут `removeMember` — `createAuthActionHandler` → `200` + JSON-тело (`AlternatingGroup | null`), не `204`. Поэтому `client.request(url, "DELETE")`, не `requestNoContent` (последний молча выбросил бы `AlternatingGroup | null`). Без тела запроса — оба id в path. `AlternatingGroup | null` проходит через generic `TResult` `useWeekMutation` без coalescing.
- **D-8.3-3 — сигнатуры `(planId, startDate)`.** Все 12 хуков — только `(planId, startDate)`; всё route-специфичное в TVars. Block-хуки несут 3-й параметр `sessionId` лишь потому, что это URL-сегмент; у Schema/SchemaRow/AG scope в body запроса, не в URL → 3-го параметра нет. Пары `{ id, data }` не расплющиваются.
- **D-8.3-2 / D-8.3-6 — `useWeekMutation` без изменений.** Все 12 хуков переиспользуют `useWeekMutation` байт-в-байт, включая success+error toast. `use-week-mutation.ts` и `keys.ts` не тронуты. Новый query-key не добавлен — каждая мутация инвалидирует существующий `weeks.byDate(planId, startDate)`.
- **QA-I1 закрыт.** `useReorderSchemas` TVars = ровно `ReorderSchemasRequest` (`z.union`); `null` не присваивается ни одному scope-ключу на уровне типов → ни один call site не сможет собрать payload, который `z.union` роута отвергнет. Хук форвардит TVars verbatim, без `?? null` и без re-derive scope.

## Возникшие вопросы и как решены

- **Тип возврата `reorder`: именованный `*Response` vs inline.** § 0.4 перечисляет `ReorderSchemasResponse` / `ReorderSchemaRowsResponse` как доступные api-типы, но § 3 описывает возврат inline (`{ schemas: Schema[] }`), § 5 явно требует «mirror `createBlocksAPI.reorder` (`{ blocks }`)», а acceptance criterion #5 говорит про api-level типы только для request-параметров. Резолв: inline-wrapped объект, зеркало Block. Именованные `*Response` не введены.
- **Стадия тестов в `/feature small`.** Стандартная S-Stage 4 пишет тесты. Per prompt § 5 Step 8.3 их не добавляет (зеркалит Step 7.3 — `use-blocks.ts` без sibling-теста; корректность хуков держится на типизированной обёртке + уже протестированных `useWeekMutation` и `ApiClient`). S4 сведена к прогону существующего suite — оркестратор выполнил его напрямую, без Test-агента (агенту нечего писать).
- **Ветка.** `/feature` режет feature-ветку; planner-workflow это переопределяет (branch-cut override). Остались на long-lived `feat/training-domain`, новой ветки нет.

Структурных отклонений от спека не возникло — все 21 contract-тип резолвятся как описано в § 0.4, все 10 роутов совпадают с § 0.3 (подтверждено стадией Research-Light, см. `.feature-dev/1779349637/research.md`). Минорная правка: lint `--fix` (prettier) свернул несколько многострочных выражений в однострочные там, где они влезают в print-width — идентично идиоме `blocks.ts`, без семантических изменений.

## Что отложено

Ничего нового исполнителем не отложено. Forward-notes из prompt § 7 остаются в силе:

- **Read-поверхность — Step 8.3.5.** GET-роута нет (D-8.2-2). Read-хук / `useQuery` (вероятнее — embed `schemas[]` + alternating-group в Block/Week read) — Step 8.3.5. В 8.3 GET-роут / read-метод / `useQuery` не добавлялись.
- **UI — Step 8.4+.** ArchetypePicker, Schema/SchemaRow-редактор, alternating-group bracket.
- **Toast-policy (D-8.3-6).** Идея убрать success-тосты по всему редактору (оставить тост только на session-delete за confirm-модалкой) отложена пользователем 2026-05-21 («leave it as is for now»). 8.3 не трогает toast-поведение, не модифицирует `useWeekMutation`. Planner логирует это в `03-deferred.md` на close-out.
- **REVIEW-I4/I5/I6 + QA-W1/W2 + QA-D1** — carry-forward'ы для отдельного `/fix` bundle; 8.3 их не касается.

`analysis/`-файлы не менялись — 8.3 это client-слой, не доменный; смены доменной семантики нет (per WORKFLOW.md `analysis/`-правила, хуки не доменный слой).

## Ссылка на `.feature-dev/1779349637/`

`.feature-dev/1779349637/` — артефакты пайплайна:

- `research.md` — Research-Light: верификация всех § 0 verbatim-claims против текущего кода (0 блокеров; contract-type inventory из 21 типа, route inventory из 10 роутов).
- `review.md` — Review-Light: вердикт APPROVED, 0 CRITICAL / 0 WARNING / 0 INFO (15/15 acceptance criteria, § 5 adversarial pass).
- `tasks.md` — implementation tasks (2 фазы / 2 коммита).

## Verification notes

Все гейты зелёные:

- `pnpm check-types` (root) — **16/16 successful** (15 cached, `platform` cache miss → перепроверен, passed).
- `pnpm lint` (root) — **16/16 successful, 0 warnings** (`eslint --max-warnings 0`; `platform` cache miss → перелинчен, passed).
- `pnpm test` (root) — **132 файла / 1680 тестов passed**, 0 фейлов (~567s). Известный flake QA-023 (`api-server block/admin.test.ts:406`) не сработал.
- `pnpm dep:check` — **0 violations** (1283 modules, 2421 dependencies cruised). Импорты `apps/platform` → `@repo/api-client` + `@repo/contracts` — существующие разрешённые рёбра.
- Husky pre-commit (`check-secrets` → `lint-staged` → `turbo check-types --filter="...[HEAD]"`) — чисто на обоих feat-коммитах. Skip-флагов (`--no-verify` / `--no-edit` / `--no-gpg-sign`) не было. Pre-push (`dep:check` → `turbo lint check-types --filter="...[origin/main]"`) — все три задачи уже прогнаны на root-sweep зелёными, чисто при push.
- `git diff 26f3e697..HEAD --stat` — ровно 9 файлов, +240 / −0, всё в `apps/platform/src/lib/{api,hooks}/`. `packages/*`, route-хендлеры 8.2, Prisma schema, `analysis/`, `apps/admin` — 0 строк. `use-week-mutation.ts` и `keys.ts` — байт-в-байт идентичны (диф пуст).

UI smoke-test — N/A: рантайм-UI нет, хуки достижимы только через будущий UI Step 8.4.

## Acceptance criteria self-check

1. ✅ `endpoints/{schemas,schema-rows,alternating-groups}.ts` созданы — каждый `createXxxAPI = (client: ApiClient) => ({ … })`, зеркало `createBlocksAPI`.
2. ✅ Schema-фабрика: `create` / `update` / `delete` / `reorder` — корректные URL+verb; `delete` через `requestNoContent`; `reorder` → `{ schemas: Schema[] }`.
3. ✅ SchemaRow-фабрика: 4 метода аналогично; `reorder` → `{ schemaRows: SchemaRow[] }`.
4. ✅ AlternatingGroup-фабрика: `create` / `delete` / `addMember` / `removeMember`; `removeMember` через `client.request(url, "DELETE")` (не `requestNoContent`), возврат `AlternatingGroup | null` (D-8.3-5).
5. ✅ `reorder` / `addMember` параметры — api-level `*Request` типы (`ReorderSchemasRequest`, `ReorderSchemaRowsRequest`, `AddMemberAlternatingGroupRequest`), не entity `*Data` (D-8.3-4).
6. ✅ `endpoints/index.ts` экспортирует 3 фабрики; `createApi` (`api/index.ts`) регистрирует `schemas` / `schemaRows` / `alternatingGroups`.
7. ✅ `hooks/{use-schemas,use-schema-rows,use-alternating-groups}.ts` созданы — 12 `useXxx` mutation-хуков через `useWeekMutation`, `"use client"`, все `(planId, startDate)` (D-8.3-3).
8. ✅ `useReorderSchemas` TVars = ровно `ReorderSchemasRequest` (api `z.union`) — без hand-widened shape; QA-I1 закрыт (D-8.3-4).
9. ✅ `useRemoveAlternatingGroupMember` TResult = `AlternatingGroup | null`, проброшен без изменений.
10. ✅ Все 12 хуков переиспользуют `useWeekMutation` без изменений (success+error toast сохранены — D-8.3-6); `use-week-mutation.ts` и `keys.ts` байт-в-байт.
11. ✅ `hooks/index.ts` ре-экспортирует 3 новых модуля хуков.
12. ✅ Read-хук / `useQuery` / GET-роут не добавлены; `useWeekMutation` / `keys.ts` не изменены.
13. ✅ `pnpm check-types` (root) 16/16; `pnpm lint` (root) 16/16, 0 warnings; `pnpm test` (root) 132 файла / 1680 тестов passed; `pnpm dep:check` 0 violations.
14. ✅ Husky pre-commit чисто на каждом коммите; 0 skip-флагов; per-layer atomic коммиты (§ 6), без squash.
15. ✅ `git diff 26f3e697..HEAD` — изменения только в `apps/platform/src/lib/{api,hooks}/`; `packages/*`, route 8.2, Prisma schema, `analysis/`, `apps/admin` — 0 строк.

**15 / 15 ✅.**
