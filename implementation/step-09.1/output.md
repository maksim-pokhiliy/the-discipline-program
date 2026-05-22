# Step 9.1 — Output report

**Шаг:** SchemaRow body editor — `STANDALONE_LOAD` rowKind + `LoadEditor` + `WeightEditor`.
**Ветка:** `feat/training-domain` (long-lived, новая ветка не резалась — override `/feature` per `[[training-domain-workflow]]`).
**Baseline:** `6c92e60b` (`docs(step-09.1): write the standalone_load row editor prompt`).
**HEAD:** `d4a22bcb`. **Прогон:** `/feature` full pipeline (9 стадий: Research → Design → Plan → Implement → Review → QA → Test → Docs → Finalize).

---

## Что сделано

Тело схемы перестало быть пустым — тренер кладёт внутрь схемы первый вид ряда. Реализованы:

- **`LoadEditor`** — controlled sub-editor над 5 видами нагрузки (`absolute` / `percentage` / `bodyweight` / `without_weight` / `unspecified`), диспетчеризация через `switch (value.kind)`, каждый вид — отдельный own-file sub-component с точным `Extract<Load, { kind: K }>` типом. Построен переиспользуемым (Step 9.3 EXERCISE возьмёт его для row-level `load`).
- **`WeightEditor`** — controlled sub-editor над 8 вариантами веса (`single` / `dual` / `single_arm` / `compound_device` / `split_tier` / `dual_value` / `with_asymmetric_arm` / `with_depth_modifier`), `switch (value.variant)`, каждый вариант — own-file sub-component с `Extract<Weight, { variant: V }>`. `split_tier` — sub-array editor с UI-флором `.min(2)`; `with_asymmetric_arm` — переключаемый optional `passiveExtraWeight`.
- **`PercentageReferenceEditor`** — 2 scope (`self` / `movement_family`); `other_exercise` отложен в 9.3 (D-9.1-7), тип выведен через `Extract<…>` для аддитивного расширения.
- **`LoadSummary`** — formatter (`switch (load.kind)` + вложенный `switch (weight.variant)`) → читаемая строка в `<Chip>`; экспортирует чистую `formatLoad`.
- **`StandaloneLoadRowForm`** — self-contained `*RowForm` (own `useForm` + `zodResolver` + `FormModal` + `useCreateSchemaRow`/`useUpdateSchemaRow`), `Controller`-обёрнутый `LoadEditor`, статичная caption «applies to all preceding rows» вместо контрола для single-value `scope` (D-9.1-3).
- **Row-kind dispatch infra** — `row-editor-types.ts` (`RowEditorMode` / `RowFormProps`), `ROW_KIND_FORM_REGISTRY` (1 запись — `STANDALONE_LOAD`), `RowEditorModal` (тонкий диспетчер), `AddRowButton` (MUI `Menu` на 8 rowKind'ов, все кликабельны, нереализованный → no-op).
- **`SchemaRowList` / `SchemaRowCard`** — рендер тела схемы: dnd-reorder (оптимистичный `arrayMove` + `onError`-rollback), drag-handle карточка с `LoadSummary` и меню Edit/Delete. `SchemaCard` модифицирован — встраивает `SchemaRowList`; пустое тело показывает только `AddRowButton`, без placeholder (D-9.1-10).

Только `apps/platform` — контракты / api-server / роуты / Prisma / seed / admin не тронуты (D-9.1-11). Контракты SchemaRow, хуки и read-embed были уже отгружены (8.0b–8.3.5).

## Изменённые/созданные файлы

30 файлов, все под `apps/platform/src/modules/plan-detail/components/`. По коммитам:

**`d6e770bf` feat(platform): add load and weight composite editors — 18 created**
`weight-load-defaults.ts`, `weight-single-fields.tsx`, `weight-dual-fields.tsx`, `weight-single-arm-fields.tsx`, `weight-compound-device-fields.tsx`, `weight-split-tier-fields.tsx`, `weight-dual-value-fields.tsx`, `weight-asymmetric-arm-fields.tsx`, `weight-depth-modifier-fields.tsx`, `weight-editor.tsx`, `percentage-reference-editor.tsx`, `load-absolute-fields.tsx`, `load-percentage-fields.tsx`, `load-bodyweight-fields.tsx`, `load-without-weight-fields.tsx`, `load-unspecified-fields.tsx`, `load-editor.tsx`, `load-summary.tsx`.

**`700f7537` feat(platform): add standalone load row form and row-kind dispatch — 5 created**
`row-editor-types.ts`, `standalone-load-row-form.tsx`, `row-kind-form-registry.ts`, `row-editor-modal.tsx`, `add-row-button.tsx`.

**`15fdb37e` feat(platform): render schema row body with reorderable row cards — 2 created, 2 modified**
created: `schema-row-card.tsx`, `schema-row-list.tsx`; modified: `schema-card.tsx` (встраивание `SchemaRowList`), `index.ts` (barrel — +22 component-экспорта, 34 → 56).

**`c61d5600` refactor(platform): key load summary label maps by their domain enums — 1 modified**
`load-summary.tsx` (review INFO-3 + QA-306 — см. ниже).

**`d4a22bcb` test(platform): cover load defaults summary formatter and row form schema — 3 created, 1 modified**
created: `weight-load-defaults.test.ts`, `load-summary.test.ts`, `standalone-load-row-form-schema.test.ts`; modified: `standalone-load-row-form.tsx` (экспорт `toFormData` для тестируемости — как уже экспортированный `standaloneLoadRowFormSchema`).

Non-component `.ts` (`weight-load-defaults.ts`, `row-editor-types.ts`, `row-kind-form-registry.ts`) в barrel **не** экспортированы — зеркало `schema-editor-types.ts` / `schema-param-form-registry.ts` / `n-rounds-form-schema.ts`.

## Принятые решения

**Ratified D-9.1-1..12 — все соблюдены** (Review подтвердил по пунктам):

- D-9.1-4 (load-bearing) — `LoadEditor`/`WeightEditor` через `switch` по дискриминанту, **не** `Record<Kind, FC>`; каждый case отдаёт control-flow-narrowed `Extract<…>` в own-file sub-component. Ноль `as`/`!`/`any`, ноль dead-branch re-narrow, ноль unreachable `default` в editor-диспетчере. Центральный риск R1 — switch типизировался чисто, эскалация не понадобилась.
- D-9.1-6 — create-payload `{ schemaId, rowKind: "STANDALONE_LOAD", rowPayload: { rowKind, load, scope: "applies_to_all_preceding_rows" } }`, без top-level модификаторов.
- D-9.1-2/3/7/8/9/10 — 8-rowKind меню без disabling; `scope`/`without_weight.context`/`dual_value.resolver` запинены в коде без контрола; `percentage` — только `self`/`movement_family`; numeric bounds зеркалят контракт (нет выдуманных `.max()`, percentage `0..200`); один `FormModal` с progressive disclosure; пустое тело без placeholder.

**Executor-level (design DD-1..5 + по ходу):**

- DD-2/R4 — `standaloneLoadRowFormSchema` переиздаёт `percentage.rangeMax > value` с `path: ["load","rangeMax"]` (прецедент path-bearing superRefine в `RestSpecFields`) — ошибка садится на поле `rangeMax`. Контракт не тронут.
- DD-3 — row-kind picker = MUI `Menu` (8 плоских пунктов; `BaseModal` в `ArchetypePicker` оправдан 34 grouped async-архетипами, тут нет).
- DD-4 — form schema inline в `standalone-load-row-form.tsx`; `buildDefaultWeight`/`buildDefaultLoad` — в shared `weight-load-defaults.ts` (чистые, multi-consumer).
- `split_tier`-stage-row **не** вынесен отдельным файлом — `weight-split-tier-fields.tsx` 156 LOC < 300 cap (plan T6 разрешал вынос условно).
- Все 5 load-kind sub-component'ов — отдельными файлами (uniform `switch`).
- `SchemaRowCard` для не-`STANDALONE_LOAD` ряда → inert `<Chip>` вида rowKind (defensive fallback; design § 9 OQ4 — executor's call).
- `PercentageReferenceEditor.error` типизирован к `FieldErrors<MovementFamilyReference>` (member с единственным errorable-полем) — точный no-`as` тип; широкий `FieldErrors<RestrictedPercentageReference>` даёт TS2339 на `movementFamily` (известные свойства union'а = пересечение ключей).
- `as`-дисциплина: единственные касты — `as const` на `rowPayload` (literal-pinning) и `e.target.value as <Enum>` на MUI `Select` onChange (codebase-прецедент `rest-spec-fields.tsx`/`hr-zone-field.tsx`). Ноль non-narrowing `as`, ноль `any`/`!`.

## Возникшие вопросы и как решены

- **§ 0 verbatim** — все 25 цитированных источников совпали byte-for-byte с живым кодом. Drift'а нет, эскалаций по § 10 нет. Одна prose-опечатка в промпте (§ 0.1/0.7 говорят «33 named exports», в barrel — 34; но _перечисленный_ список имён в § 0.7 корректен и совпал — инструкция «append alphabetically» однозначна).
- **`reorderSchemaRowsSchema`** — кажущееся противоречие § 0.5 (`reorderSchemaRowsSchema.extend({ schemaId })`) разрешено: request-тип `ReorderSchemaRowsRequest` инферится из `reorderSchemaRowsRequestSchema` в `schema-row-api.schema.ts` (= `reorderSchemaRowsSchema.extend({ schemaId })`). `SchemaRowList` шлёт `{ schemaId, orderedIds }` — не `{ blockId, orderedIds }` (R9, ловушка copy-paste из `SchemaList`, обойдена и проверена Review).
- **Review INFO-3 + QA-306 (self-inflicted)** — `load-summary.tsx` label-мапы были `Record<string, string>` против sibling-стиля `Record<EnumType, string>`. Сужены до `Record<WeightCompoundDeviceEquipment | WeightWorkingArm | WeightPassiveArmAction | WeightDepthModifier, string>` (commit `c61d5600`). При `noUncheckedIndexedAccess: true` lookup по конечному union'у literal'ов = доступ к known-properties (не index-signature) → возвращает `string` → прежние `?? raw` fallback'и стали dead code и убраны в том же коммите.
- **Review INFO-1/INFO-2 — оставлены с обоснованием.** INFO-1 (`PercentageReferenceEditor.error` уже narrow) — текущий тип корректен и намеренен, предложенный Review widening сломал бы компиляцию. INFO-2 (`?? DEFAULT` в `weight-asymmetric-arm-fields.tsx` за `!== undefined` guard) — defensive no-`!` код; чистый фикс = новый sub-component (react/no-multi-comp), непропорционально для INFO.

## Что отложено

- **QA-307 → Step 9.3.** `LoadPercentageFields.toRestrictedReference` молча даункастит `percentage`/`other_exercise` reference при редактировании. Дормант в 9.1 (на платформе нет exercise read-path, `other_exercise` ряд создать нечем — D-9.1-7); станет живым риском, когда 9.3 введёт exercise picker. Структурный фикс — в 9.3.
- **QA-301 → contract/domain.** Очищенное поле `percentage.value` → `Number("") === 0`, а `loadSchema.percentage.value` это `z.number().min(0)` → `0` валиден, `0%`-ряд молча сохраняется. 9.1 зеркалит контракт (D-9.1-8) и codebase-идиому number-input — это не баг шага; вопрос «допустим ли `0%`» — контрактный, смежен с QA-201 (param bounds, deferred domain sub-step).
- **QA-302/303/304/305** — мелкие INFO в `qa.md`: index-keyed `split_tier` stage rows; whitespace-only `movementFamily` (контрактный `min(1)` пропускает пробел); заглублённый дубль root-issue от вложенных superRefine; 8.4-shared edit-form clobber на week-refetch (pre-existing, не 9.1).
- **Промпт § 7 carry-forwards** — D-9.1-12 (toast-policy — отдельный `/feature small`); QA-001c/R7 (concurrent-create P2002 на `@@unique([schemaId, order])`); QA-W2/R8 (reorder-race last-writer-wins). 9.1 их не усугубляет (QA подтвердил).
- **`apps/platform/README.md`** — one-liner модуля `plan-detail` («week-by-week navigation, week notes») устарел ещё до 8.x editor-серии; обновление архитектурного нарратива — вне prompt-scope 9.1, milestone-задача планировщика.

## Ссылка на `.feature-dev/1779438911/`

Артефакты `/feature`-пайплайна: `research.md` (§ 0 verbatim-верификация, паттерны A–F, R1–R10), `design.md` (RFC, § 5.6 type architecture, DD-1..5), `plan.md` (24 задачи / 4 layer-коммита), `tasks.md` (трекер), `review.md` (Stage 5 — APPROVE 0/0/3), `qa.md` (Stage 6 — B, 0 CRITICAL / 2 WARNING / 5 INFO, 15-сценарный Must-Test список).

## Сценарий смоук-теста

Браузерный смоук-тест § 9 — **выполняет пользователь** (per `WORKFLOW.md` item 6, «user runs the smoke-test scenario in a browser»; уточнено пользователем по ходу прогона). Executor его не запускал; `db:reset`/`db:seed` не выполнялись.

**Preconditions:** `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`; platform dev-сервер (`pnpm dev:platform`, порт 3001); логин под seeded-тренером; draft-план → неделя → день → сессия → блок → схема (`n-rounds` / `amrap-flat`) созданы существующим UI.

Сценарий (§ 9, 11 шагов): 1) тело схемы — кнопка «Add row», без рядов, без placeholder; 2) тап «Add row» → меню 8 видов, все кликабельны, ничего не серое; 3) «standalone load» → форма с селектором вида нагрузки (5); 4) «absolute» → селектор веса (8); 5) «single arm», ввод `32` → статичная caption «applies to all preceding rows»; 6) Save → ряд с читаемой сводкой нагрузки + drag/edit/delete; 7) второй ряд → standalone load → «percentage» 60 → reference «self» → сводка «60%»; 8) перетащить второй ряд выше первого → порядок меняется, переживает reload; 9) Edit первого ряда → смена веса → сводка обновилась; 10) «Add row» → нереализованный вид (например «exercise») → ничего не открывается, без ошибки; 11) Delete ряда через меню → confirm → ряд исчез, переживает reload.

**Rollback:** удалить созданные ряды/схему/блок/сессию через их меню, либо `db:reset` + `db:seed`.

**Результат:** ⏳ ожидает прогона пользователем.

## Verification notes

- `pnpm check-types` — **16/16** ✅
- `pnpm lint` — **16/16, 0 warnings** ✅ (`eslint . --fix --max-warnings 0` по каждому пакету)
- `pnpm dep:check` — **0 violations** ✅ (1330 модулей)
- Platform-тесты (`vitest run --project platform`) — **64/64 passed** ✅ (4 файла: 3 новых Step-9.1 + pre-existing `use-training-plans.test.ts`; 57 новых тестов покрывают все 15 QA Must-Test сценариев).
- Husky pre-commit (check-secrets → lint-staged → `turbo check-types`) и commit-msg прошли на каждом коммите; ноль `--no-verify`/`--no-edit`/`--no-gpg-sign`.
- api-server-сьют не перезапускался — вне радиуса влияния 9.1 (`apps/platform` — leaf, api-server его не импортирует; промпт § 8 скоупит `pnpm test` к «platform delta»). Известный флейк `block/admin.test.ts:406` (QA-023) к шагу отношения не имеет.
- 5 коммитов на `feat/training-domain`: 3 `feat` (per-layer atomic, prompt § 6) + 1 `refactor` (review INFO-3/QA-306) + 1 `test`. Squash не делался (§ 6 — single-package, no broken intermediate tree).

## Acceptance criteria self-check (промпт § 4)

1. ✅ `LoadEditor` — 5 kinds, `switch (value.kind)`, own-file `Extract`-typed sub-components, без `Record`/`as`/dead-narrow.
2. ✅ `WeightEditor` — 8 variants, `switch (value.variant)`, own-file sub-components; `split_tier` UI-флор `min(2)`; `with_asymmetric_arm` переключает nested optional.
3. ✅ `percentage` — только `self`/`movement_family`; percentage inputs `0..200`; `valueKg`/stage `reps` без выдуманного `.max()`.
4. ✅ `StandaloneLoadRowForm` self-contained, в `ROW_KIND_FORM_REGISTRY`, create + edit.
5. ✅ `AddRowButton` — меню 8 rowKind (без `REST_SLOT`), все кликабельны, нереализованный → no-op без ошибки.
6. ✅ `SchemaCard` рендерит `SchemaRowList`; `SchemaRowCard` с `LoadSummary`; drag-reorder (optimistic + rollback), Edit, Delete; пустое тело — только `AddRowButton`, без placeholder.
7. ✅ Create-payload точный (D-9.1-6); `scope`/`without_weight.context` запинены без контрола.
8. ✅ Без изменений `contracts`/`api-server`/route/Prisma/seed/`admin`; `hooks`/`api` barrel'ы не тронуты (`git diff --stat 6c92e60b HEAD` — всё в `plan-detail/components/`).
9. ✅ check-types 16/16; lint 16/16 0 warnings; platform-тесты зелёные; dep:check 0 violations.
10. ✅ Per-layer atomic коммиты на `feat/training-domain`; husky чист; ноль skip-флагов.
11. ⏳ Браузерный смоук-тест § 9 — за пользователем.

Критерии 1–10 — выполнены и проверены. Критерий 11 — ожидает браузерного прогона пользователем.
