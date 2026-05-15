# Step 4 — Admin Label CRUD — output

Executed via `/feature` (full pipeline), Stage 1-9. Branch `feat/training-domain`, 8 commits `6a8b2302..d24d3c2f`.

## Что сделано

Step 4 — второй admin catalog-library CRUD (после Exercise из Step 3): **Label**. Тренер может создавать / просматривать / искать / фильтровать / редактировать / удалять `Label`-записи через `apps/admin` на `/labels`.

Реализация — структурное зеркало Exercise-модуля Step 3, адаптированное с ~10-польной модели Exercise на 3-польную модель Label (`name`, `applicableLevels`, `notes`), плюс один новый паттерн — мульти-значный чекбокс-виджет `applicableLevels` (`FormGroup` + 3 `Checkbox`).

5 слоёв: contracts (`@repo/contracts/cms/label`) → mapper + handler (`@repo/api-server`) → admin API routes → client API + TanStack hooks → admin module (widget, flat form, list section, views) → pages → sidebar nav. Плюс контракт-юнит-тесты и api-server интеграционные тесты.

Схема не менялась (`Label` + `AppLevel` уже в `schema.prisma` с Step 2). `training_labels` остаётся пустой — библиотеку наполняет тренер через этот UI.

## Изменённые/созданные файлы

38 файлов, 1263 insertions, 1 deletion. 28 новых + 8 append-only правок barrel/registry + 2 тест-файла.

**Contracts** (`packages/contracts/`):

- NEW `src/entities/cms/label/{label.constants,label.schema,label.types,label-api.schema,label-api.types,index}.ts`
- NEW `src/entities/cms/label/label.schema.test.ts` (контракт-юнит-тесты)
- MOD `package.json` (append `"./cms/label"` в `exports`)

**Backend** (`packages/api-server/`):

- NEW `src/mappers/cms/label.mapper.ts`
- NEW `src/endpoints/cms/label/admin.ts`
- NEW `src/endpoints/cms/label/admin.test.ts` (интеграционные тесты)
- MOD `src/mappers/cms/index.ts`, `src/endpoints/cms/index.ts` (append-only barrels)
- **`src/mappers/cms/enum-maps.ts` — НЕ тронут** (DEC-7, см. "Принятые решения")

**Admin app** (`apps/admin/`):

- NEW `src/app/api/admin/labels/{route,[id]/route,page-data/route}.ts`
- NEW `src/lib/api/endpoints/labels.ts`, `src/lib/hooks/use-labels.ts`
- MOD `src/lib/api/endpoints/index.ts`, `src/lib/api/index.ts`, `src/lib/api/keys.ts`, `src/lib/hooks/index.ts` (append-only)
- NEW `src/modules/labels/constants.ts`
- NEW `src/modules/labels/components/{applicable-levels-field,label-form,index}.tsx`
- NEW `src/modules/labels/sections/labels-list-section/index.tsx`, `src/modules/labels/sections/index.ts`
- NEW `src/modules/labels/views/{labels-list-view/index,labels-create-view/index,labels-edit-view/index,labels-edit-view/labels-edit-form}.tsx`, `src/modules/labels/views/index.ts`
- NEW `src/modules/labels/index.ts`
- NEW `src/app/(dashboard)/labels/{page,create/page,[id]/page}.tsx`
- MOD `src/lib/config/navigation.ts` (append "Labels" link to "Library" group)

## Принятые решения

- **DEC-1 — виджет `applicableLevels` = `FormGroup` + 3 `Checkbox`.** `applicable-levels-field.tsx` — `Controller` с `render={({ field, fieldState }) => ...}` внутри `FormControl error={!!fieldState.error}` + `FormHelperText`-sink. Точная копия фикса `919b836d` (`placeholderFlag` Controller из `classification-card.tsx`). Альтернативы `Select multiple` и `ToggleButtonGroup` рассмотрены и отклонены — обе теряют чистую `FormControl`/`FormHelperText`-интеграцию, которая и есть урок бага Step 3.1.
- **DEC-2 — storage `Json`-колонка как есть.** Без миграции, без `db:reset`. Зеркало Exercise `aliases Json`. Маппер использует один bounded `as AppLevelValue[]` — единственный санкционированный `as` во всей фиче.
- **DEC-3 — плоская одиночная `FormCard`-форма, без `Grid`-оркестратора.** Label = 3 поля, Grid + sub-cards оркестрация Exercise избыточна. Хинт промпта про `reviews` как плоскую форму **stale** — `reviews` это 2-колоночный Grid; точного прецедента нет, но `notes-card.tsx` доказывает что standalone `FormCard` рендерится корректно.
- **DEC-4 — `normalizeText`/`normalizedString`/`ZERO_WIDTH_RE` скопированы verbatim** в `label.schema.ts` (не извлечены в shared util). Промпт явно перекрывает manifesto "extract on 2nd instance"; триггер извлечения — 3-я сущность.
- **DEC-5 — иконка сайдбара = `"exercises"`.** Реестр `apps/admin/src/lib/components/sidebar/icon-map.ts` не имеет ключа `"labels"`, и `icon-map.ts` вне scope Step 4. `"exercises"` (`FitnessCenterOutlined`) — ближайший тематический фит (та же группа "Library", тот же класс контента) и валидный ключ (нет fallthrough на dashboard-дефолт). Отдельная иконка для "Labels" — лёгкий follow-up (2 строки в `icon-map.ts`), сознательно отложен.
- **DEC-6 — нет object-level cross-field `.refine` на Label-схемах.** У Exercise `.refine(placeholderConsistency)` — cross-field инвариант; у Label cross-field инварианта нет. `createLabelSchema = labelFormBase`, `updateLabelSchema = labelFormBase.partial()`. (Field-level uniqueness `.refine` на `applicableLevels` добавлен позже по QA-001 — это другая категория, см. "Возникшие вопросы".)
- **DEC-7 — `enum-maps.ts` НЕ тронут.** Промпт трижды велит дописать AppLevel-мост, но `applicableLevels` — `Json`-колонка, структурно идентичная Exercise `aliases Json` (у которого записи в `enum-maps.ts` нет). `Prisma.AppLevel` не входит в type surface api-server'а → bridge-мост был бы dead code (0 потребителей, нарушение manifesto). Решение ратифицировано юзером. Append-only-правок **8, не 9**.
- **`nameLower`** экспонируется read-only в DTO (`labelSchema`), зеркало Step 3 `canonicalNameLower`. Бэкенд деривирует `name.trim().toLowerCase()` (trim-then-lower, REV-014).
- **Filter `match`** использует `.some((level) => level === value)`, не `.includes(value)` — `DataTableFilter<T>` типизирует `match`'s `value` как `string`, `.includes` на `AppLevelValue[]` даёт TS2345; `.some` — type-clean эквивалент без второго `as`. `?? []` guard сохранён для паритета со спекой промпта.
- **`APP_LEVEL_LABELS`** — title-case singular (`"Day"`/`"Session"`/`"Block"`). Empty-state `"No labels yet. Create the first one!"`, `searchPlaceholder="Search by name"`, `DEFAULT_LIST_LIMIT` переиспользован (не передефинирован).
- **Edit-форма** использует `createLabelSchema` как resolver (не `updateLabelSchema`) — UI-форма всегда шлёт полный payload, зеркало Exercise edit-формы; `updateLabelSchema` — wire/handler partial-PATCH контракт.

## Возникшие вопросы и как решены

1. **Trigger-2 — memory trace prior-attempt vocab.** Pre-flight grep memory нашёл в `~/.claude/.../memory/feedback_discipline_db_non_prod.md` строку `**Why:**` с референсом `ADR-0037` и "plan-editor feature" rollback — два слова из trigger-листа промпта. Grep по коду чист (попадания только в `implementation/**` — сам текст STOP-правила). Гипотеза: stale-остаток, пропущенный при cleanup'е memory после Step 1; сам файл — легитимная действующая memory про non-prod DB, не артефакт прошлой попытки, `ADR-0037` там — инцидентальное историческое обоснование без domain-vocab (`SchemeType`/`SETS_REPS`/per-block-atomic отсутствуют). Surface'нуто юзеру (как требует промпт: STOP + surface). Решение юзера — **"Proceed, surface only"** (как Step 1 ратифицировал: surface, не halt). Memory-файл не трогался (вне проекта, нет явного "почисти X"). Триггеры 1/3/4/5/6/7 чисты.
2. **`enum-maps.ts` dead-code tension.** Промпт (scope-список + Phase 2 + "Ratified decisions") трижды велит дописать AppLevel-мост в `enum-maps.ts`. Но `applicableLevels` — `Json`-колонка, и Exercise-аналог (`aliases Json`) моста в `enum-maps.ts` не имеет — Json-поля не бриджатся, `Prisma.AppLevel` в типах не участвует. Мост был бы 0-потребителей dead code. Surface'нуто юзеру. Решение — **"Skip enum-maps.ts"** (DEC-7). Девиация от scope-списка промпта; `design.md` амендирован, append-only счётчик 9→8.
3. **Filter `match` тип.** Промпт специфицировал `match: (label, value) => (label.applicableLevels ?? []).includes(value)`. Но `DataTableFilter<T>` типизирует `match`'s `value` как `string` → `.includes` на `AppLevelValue[]` = TS2345. Решено `.some((level) => level === value)` — type-clean эквивалент, поведенчески идентично, без второго `as` (`as string[]` нарушил бы "ровно один `as`"). Минорная type-correctness правка, без изменения поведения.
4. **QA-001 — `applicableLevels` принимает дубликаты.** Stage 6 QA нашёл: `["DAY","DAY"]` проходит и write-схемы (`createLabelSchema`/`updateLabelSchema`), и read-схему (`labelSchema`). Рассуждение DEC-6/промпта "checkboxes can't dup" верно только для UI-create-флоу (`toggleLevel` стартует с `[]`); прямой API-вызов и edit-reseed (`labels-edit-form.tsx` сидит `defaultValues` из DTO) обходят его. Промпт явно разрешал "optionally `.refine` for uniqueness if trivial". Исправлено (commit `4c9c922a`): добавлен `applicableLevelsSchema` с field-level `.refine` на уникальность, используется в `labelSchema` и `labelFormBase`. `["DAY","DAY"]` теперь отклоняется на write и read. `design.md` DEC-6 амендирован — field-level array-uniqueness refine ≠ object-level cross-field refine.

## Что отложено

- **QA-002** (`notes: ""` хранится как пустая строка, не нормализуется в `null`) — INFO. Codebase-wide паттерн — `exercise/admin.ts` имеет идентичный `?? null`. Per рекомендации QA-агента: не чинить в изоляции (создаст дивергенцию с Exercise); чинить codebase-wide отдельно или оставить.
- **QA-003** (`as AppLevelValue[]` маппера подстрахован только response-schema-парсом на route boundary) — INFO. Не code-change: QA-агент рекомендует не рефакторить маппер (`as` — ратифицированный паттерн зеркала Exercise `aliases`). Закреплён интеграционным тестом (`mapToLabel — Json column trust`, Must-Test #13) — тест пишет malformed-строку через `cleanupRaw` и проверяет что read-path кидает `ZodError`.
- **Отдельная иконка сайдбара для "Labels"** — сейчас разделяет `"exercises"` (`FitnessCenterOutlined`) с Exercise-ссылкой. Различимая иконка — ~2-строчное добавление в `icon-map.ts` (вне scope Step 4) + смена значения в `navigation.ts`.
- **Server-side pagination** — если `training_labels` перерастёт `DEFAULT_LIST_LIMIT` (100). Сейчас client-side как у Exercise; 101-я (старейшая) строка молча невидима — поведение зеркалит Exercise, закреплено тестом. Рост за 100 — отдельная фича.

## Ссылка на `.feature-dev/1778744240/`

Артефакты пайплайна: `.feature-dev/1778744240/` — `research.md` (Stage 1), `design.md` (Stage 2, RFC + DEC-1..DEC-7 + амендменты), `plan.md` (Stage 3, 9 атомарных задач), `tasks.md` (Stage 4 tracking), `review.md` (Stage 5, APPROVE 0/0/0), `qa.md` (Stage 6, A−, 13 Must-Test Scenarios).

## Сценарий смоук-теста

**Предусловия:**

- `feat/training-domain` собран; `apps/admin` запущен (`pnpm --filter admin dev`, порт 3002); вход выполнен под admin-сессией.
- `training_labels` пуста (0 строк) — свежее состояние библиотеки.

**Шаги (ожидаемый результат после каждого):**

1. Открыть `/labels`.
   → Таблица пуста, empty-state `"No labels yet. Create the first one!"`, кнопка "Create Label" видна. В сайдбаре группа "Library" содержит "Exercises" и "Labels".
2. "Create Label" → `name` = "Push Day", отметить `applicableLevels` = [DAY], `notes` пусто → Create.
   → Редирект на `/labels`, success-toast. Строка "Push Day" с одним чипом "Day", колонка Created заполнена.
3. "Create Label" → `name` = "push day" (lowercase), `applicableLevels` = [DAY] → Create.
   → Остаётся на форме, error-toast "Label with this name already exists" (P2002 — case-insensitive по `nameLower`). Строка не создана.
4. **(регрессионный guard бага Step 3)** "Create Label" → `name` = "Recovery", **ни одного** чекбокса `applicableLevels` не отмечено → Create.
   → Форма **не сабмитится молча**. Под группой чекбоксов виден инлайн красный `FormHelperText` с текстом ошибки валидации. `createLabel` не вызывается. Ошибка **должна быть видимой** — это явная проверка против silent-submit бага Step 3.
   → Доп: отметить любой чекбокс — ошибка исчезает; снять обратно в `[]` и сабмитнуть — ошибка снова видна.
5. На `/labels` → Edit "Push Day" → дополнительно отметить SESSION → Save changes.
   → Редирект на `/labels`, success-toast. Строка "Push Day" теперь с двумя чипами — "Day" и "Session".
6. На `/labels` → фильтр "Applicable Level" = SESSION.
   → Показаны только метки с уровнем SESSION (после шага 5 — "Push Day"). Сброс фильтра возвращает все строки.
7. Поиск "push".
   → Совпадение по `name` — "Push Day" в результатах. Поиск по "session"/"block" **не** матчит по `applicableLevels` (поиск только по `name`).
8. Создать неиспользуемую метку (например "Temp", [BLOCK]) → Delete на её строке → подтвердить в `ConfirmationModal`.
   → Открывается `ConfirmationModal` "Delete Label"; после Confirm строка исчезает, success-toast.
9. (Опционально — требует FK-данных) Удалить метку, на которую ссылается `Day`/`Session`/`BlockLabelAssignment`.
   → Error-toast "Cannot delete: label is in use" (P2003). Метка остаётся в таблице.

**Откат:**

- Данные: смоук-тест создаёт строки в `training_labels` (dev Neon). Удалить созданные метки через UI (шаг 8), либо `pnpm --filter @repo/api-server db:reset` для полного чистого состояния (ADR-0019 санкционирует drop+recreate для non-prod dev DB).
- Код: `git revert` коммитов из диапазона `6a8b2302..d24d3c2f`, либо reset ветки `feat/training-domain` на `e74502e9`.

## Verification notes

- **Pipeline:** `/feature` full, Stage 1-9 пройдены. Stage 5 Review — **APPROVE**, 0 CRITICAL / 0 WARNING / 0 INFO. Stage 6 QA — **A−**, 0 CRITICAL / 1 WARNING / 2 INFO.
- **`pnpm check-types`** — 16/16 successful (turbo, все 4 apps + 12 packages).
- **`pnpm lint`** — 16/16 successful (`--max-warnings 0`).
- **`pnpm dep:check`** — clean, 1072 modules, 0 violations; `contracts-no-prisma` чист (`@repo/contracts/cms/label` импортирует только `zod` + shared `common`).
- **Тесты:** Stage 7 написал 2 файла — контракт-юнит `label.schema.test.ts` (22 кейса) + интеграционный `label/admin.test.ts` (11 кейсов), покрывают 13 QA Must-Test Scenarios (#1 — widget regression guard — `[manual smoke-test]`, т.к. `apps/admin` не имеет Vitest-проекта). `pnpm --filter @repo/contracts test` — 110 passed. `pnpm --filter @repo/api-server test` — 474 passed, 0 failed. **Полный `pnpm test` — 93 файла, 786 тестов passed, 0 failed (~253с).** Known-flaky `cmsBlogAdminApi > updatePost` — прошёл, retry не понадобился.
- **Hard-escalation triggers:** (1) residual label-CRUD код — clean (ни `modules/labels/`, ни scoped-файлов до старта). (2) memory/code trace prior-attempt vocab — **сработал слабо**, surface'нут, ратифицировано "proceed" (см. "Возникшие вопросы" #1). (3) `training_labels` уже с данными — clean (0 строк, проверено через Prisma). (4) `AppLevel` enum расходится — clean (ровно `{ DAY, SESSION, BLOCK }`). (5) Exercise структурно расходится с описанием промпта — clean (client-side pagination, single-value `DataTableFilter`, `createCrudHooks`, raw `Date`, mirrored enums — всё подтверждено Stage 1). (6) pre-existing unrelated failures — нет. (7) `.dependency-cruiser.cjs` новое нарушение — нет.
- **Type-safety:** ровно один `as` во всей фиче — `applicableLevels as AppLevelValue[]` в `label.mapper.ts` (bounded narrowing `Json`-колонки, write-gated Zod-схемой). Ноль `any`, ноль `!` non-null, ноль `@ts-*`.
- **Commits:** 8 шт, все subject'ы полностью lowercase (commitlint `subject-case: lower-case`). Без `Co-Authored-By`/`Generated-with` трейлеров. Без `--no-verify`.

## Acceptance criteria self-check

- ✅ **Scope соблюдён** — тронуты только файлы из "allowed to modify" списка промпта, **за вычетом `enum-maps.ts`** (сознательно убран по DEC-7 / ратификации юзера — задокументировано).
- ✅ **"Do not touch" соблюдён** — `analysis/**`, `schema.prisma`, `apps/marketing|platform|storybook`, другие admin-модули, prisma seeders / lock files / CI / `.gitignore` не тронуты. `implementation/IMPLEMENTATION_LOG.md` и `PLANNING_STATE.md` (файлы планировщика) не тронуты.
- ✅ **Existing patterns sacred** — структурное зеркало Exercise, file-by-file. Не изобретено.
- ✅ **Новый паттерн `applicableLevels`** — `Controller` подписан на `fieldState`, `FormControl error` + `FormHelperText`-sink, виджет вынесен в `applicable-levels-field.tsx` (module-private). Регрессионный guard против silent-submit бага Step 3 — верифицирован Stage 5 (построчно) и Stage 6 (traced).
- ✅ **List rendering** — 1-3 `Chip` на метку; single-value `DataTableFilter` "Applicable Level"; `Column.searchValue` только на `name`.
- ✅ **Backend** — `nameLower` дерайвится `name.trim().toLowerCase()`; P2002 intercept на create + update; P2003 intercept на delete (одно generic-сообщение); `withAdminAuth` на всех routes.
- ✅ **Тесты** — контракт-юнит (name uniqueness через схему, `applicableLevels` empty/invalid/over-3/duplicate rejection, length boundaries) + интеграционные (case-insensitive uniqueness P2002, create/update/delete happy paths, P2003 FK-Restrict через цепочку `User→Plan→Week→Day`, `getLabels` ordering + cap, mapper Json-trust).
- ✅ **`pnpm check-types`** green 16/16; **`pnpm lint`** green; **`pnpm dep:check`** zero `contracts-no-prisma` violations.
- ✅ **`pnpm test`** full-suite — 93 файла, 786 тестов passed, 0 failed.
- ✅ **Без co-authored-by / generated-by / "Generated with Claude Code"** — нигде.
- ✅ **Без `--no-verify` / `--no-edit` / `--no-gpg-sign`** — все git-операции через hooks.
- ✅ **Без комментариев в коде** — ни одного добавлено.
- ✅ **Русский для chat-prose, английский в файлах** — соблюдено.
- ✅ **Commitlint** — все 8 subject'ов полностью lowercase.
- ✅ **`/feature` full pipeline** (не `small`) — Stage 1-9 пройдены, `.feature-dev/1778744240/` артефакты созданы.
