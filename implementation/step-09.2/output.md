# Step 9.2 — Output report

**Step**: 9.2 — SchemaRow body editor: `REST` + `INNER_LADDER_MARKER` + `STANDALONE_URL` rowKinds
**Branch**: `feat/training-domain` (no branch cut — long-lived branch, per `[[training-domain-workflow]]`)
**Baseline**: `417e137a` (the `docs(step-09.2)` prompt commit)
**Wrapper**: `/feature` full pipeline (Research → Design → Plan → Implement → Review → QA → Test → Docs → Finalize)

---

## Что сделано

Расширен редактор тела схемы тремя простыми видами ряда — `REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL`. После 9.1 (где появилась инфраструктура диспетчеризации rowKind + единственная рабочая форма `STANDALONE_LOAD`) тренер в add-row меню видел 8 пунктов, из которых работал один. После 9.2 рабочих — четыре.

Каждый из трёх новых видов — самодостаточная `*RowForm` по образцу 9.1 `StandaloneLoadRowForm`: владеет своей `useForm` + `zodResolver` + `FormModal` + хуками create/update, экспортирует `toFormData(mode)`, ресинкается через `useEffect(reset, [mode])`. Все три зарегистрированы в `ROW_KIND_FORM_REGISTRY` (теперь 4 записи). Диспетчер (`RowEditorModal` / `AddRowButton`) не тронут — он rowKind-агностичен, 9.2 только наполнил реестр.

Сверх трёх форм:

- **`StepArrayFields`** — переиспользуемый контролируемый chip-array редактор (`{ value: number[], onChange, error?, disabled? }`): ввод положительного целого → чип; чип удаляется; UI-пол `.min(1)` (последний чип не удаляется); повторы разрешены (вершинная пирамида `11-9-7-9-11`). Первый потребитель — `INNER_LADDER_MARKER`; построен под переиспользование в архетип-формах Ladder (8.5) / parallel-ladders (8.6).
- **`formatRestRaw`** — чистый тотальный форматтер: из структурированного `RestSpec` собирает читаемую строку (`"rest 90 sec between sets"`). Используется и для производного поля `REST.raw` (в `onSubmit`), и для саммари ряда в карточке.
- Три ветки `SchemaRowCard.renderBody` — читаемое саммари для `REST` (через `formatRestRaw`), `INNER_LADDER_MARKER` (цепочка `"21 → 15 → 9"`), `STANDALONE_URL` (url как текст). Инертный chip остаётся для 5 ещё нереализованных видов.

Platform-only, на уже отгруженном бэкенде 8.0b–8.3.5 — ни контракты, ни api-server, ни роуты, ни Prisma, ни seed, ни admin не тронуты.

---

## Изменённые/созданные файлы

Всё в `apps/platform/src/modules/plan-detail/components/`. Diff vs `417e137a`: **14 файлов, +1101 / −5**.

**Создано (10):**

- `format-rest-raw.ts` — `formatRestRaw(parsed: RestSpec): string` (чистый, тотальный, без throw).
- `format-rest-raw.test.ts` — 32 теста: полный кросс-продукт `unit × scope × qualifier? × setIndex?`.
- `step-array-fields.tsx` — `StepArrayFields` + экспортируемый чистый `parseStepDraft(draft): number | null`.
- `step-array-fields.test.ts` — 19 тестов на `parseStepDraft` (регрессионный замок QA-902).
- `rest-row-form.tsx` — `RestRowForm` + `restRowFormSchema` + `toFormData`.
- `rest-row-form-schema.test.ts` — 7 тестов (схема + 3 ветки `toFormData`).
- `inner-ladder-marker-row-form.tsx` — `InnerLadderMarkerRowForm` + `innerLadderMarkerRowFormSchema` + `toFormData`.
- `inner-ladder-marker-row-form-schema.test.ts` — 9 тестов (`.min(1)` пол, повторы, `toFormData`).
- `standalone-url-row-form.tsx` — `StandaloneUrlRowForm` + `standaloneUrlRowFormSchema` + `toFormData`.
- `standalone-url-row-form-schema.test.ts` — 8 тестов (URL-валидация, `wrapped` не ключ схемы, `toFormData`).

**Изменено (4):**

- `row-kind-form-registry.ts` — +3 записи (`REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL`); итого 4. Тип `Partial<Record<RowKind, …>>` без изменений.
- `schema-row-card.tsx` — +3 ветки `case` в `renderBody` перед `default`; +`STEP_SEPARATOR` константа; +импорт `formatRestRaw`.
- `index.ts` — +4 экспорта компонентов (`InnerLadderMarkerRowForm`, `RestRowForm`, `StandaloneUrlRowForm`, `StepArrayFields`), по алфавиту. Итого 60.
- `standalone-load-row-form-schema.test.ts` — блок `describe("ROW_KIND_FORM_REGISTRY")` поправлен: было «STANDALONE_LOAD + остальные 8 отсутствуют», стало «4 реализованных есть / 5 нереализованных нет».

**Коммиты (5, per-layer atomic, no squash):**

- `c19c0725` feat(platform): add step-array editor and rest-raw formatter for schema rows
- `8aa3aafe` feat(platform): add rest, inner-ladder-marker and url row forms
- `0c64e346` feat(platform): render rest, ladder-marker and url row body summaries
- `fe4bee40` fix(platform): harden step-array editor draft validation and add affordance
- `1be19519` test(platform): cover step-array draft parser

Husky `pre-commit` (`turbo check-types --filter="...[HEAD]"`) прошёл на каждом коммите; ноль `--no-verify` / `--no-edit` / `--no-gpg-sign`.

---

## Принятые решения

Ратифицированные D-9.2-1..8 реализованы как есть. Сверх них — решения и отклонения, возникшие при исполнении:

- **`wrapped` запинён `true` (D-9.2-3).** В `StandaloneUrlRowForm` `wrapped` — не ключ формы-схемы, не контрол, без подписи: литерал `wrapped: true` подставляется в `onSubmit`. Редактирование bare-URL ряда (`wrapped: false`) молча нормализует его к `true` — соответствует domain-рекомендации normalize-to-bracket.
- **`REST.raw` — производное (D-9.2-4).** Тренер заполняет структурированный `parsed` через `RestSpecFields` (8.4); `raw` собирается формулой `formatRestRaw(parsed)` в `onSubmit`, формой не вводится. Непустота результата `formatRestRaw` гарантирована префиксом-литералом `"rest"` + `.filter(len>0).join(" ")` — `length >= 4` для любого `RestSpec`, ни одна ветка не вернёт `""`.
- **`REST` default scope = `between_sets`** (design D4). Standalone-ряд отдыха не внутри n-rounds — `between_rounds` (дефолт `NRoundsSchemaForm`) не подходит; § 0.4 fixture standalone-`REST` использует `between_sets`.
- **`STANDALONE_URL` саммари — текстовый `Chip`, не кликабельная ссылка** (design D6). `z.string().url()` — проверка формата, не allowlist схем (`javascript:` / `data:` проходят). Живой `href` на coach-вводе = open-redirect/XSS-поверхность. Рендер url как label `Chip` (React-эскейп) — безопасно, и согласуется с `LoadSummary`.
- **ОТКЛОНЕНИЕ от design D3 — тип `StepArrayFields.error?`.** Design указывал `error?: FieldError`. Под `exactOptionalPropertyTypes: true` это неверно: RHF типизирует ошибку `number[]`-поля как `Merge<FieldError, FieldErrorsImpl<number[]>>` (где `type` опционален → не присваивается `FieldError`). Поймано на T4 (реальный `TS2322`), исправлено расширением prop-типа до точного RHF-типа (только тип, поведение неизменно — компонент читает лишь `.message` / `!== undefined`). Без `as`. design.md D3 содержал неточное type-утверждение; код корректен.
- **ОТКЛОНЕНИЕ от design D5 — коммит чипа.** Design предлагал коммит по Enter + blur, без кнопки «Add». QA-903 показал: `onBlur={commitDraft}` срабатывает на любом blur — печатаешь число, жмёшь × у существующего чипа → паразитный чип. Переключено на явную кнопку **«Add»** + Enter (blur-коммит убран) — зеркало `WeightSplitTierFields` (pattern compliance), класс паразитных чипов устранён полностью. Лёгковесность D5 уступила конкретному багу.
- **QA-902 — строгая валидация ввода.** `Number(draft)` пермиссивен (`Number("1e3") === 1000`). Извлечён чистый `parseStepDraft`: trim → строгий паттерн `/^[1-9]\d*$/` → `Number()` либо `null`. Научная нотация, hex, знаки, ведущие нули, дроби больше не дают чип.
- **Тесты `StepArrayFields` (T9).** Отдельный component-render тест не писался — паритет с 9.1 (там `LoadEditor`/`WeightEditor` на уровне компонента не тестировались; RTL в `apps/platform` не заведён). Но извлечённый QA-фиксом чистый `parseStepDraft` тестируется полноценно (`step-array-fields.test.ts`, 19 тестов). `.min(1)`-пол покрыт zod-тестом `innerLadderMarkerRowFormSchema` (T11).

---

## Возникшие вопросы и как решены

- **Spec drift?** — Нет. Research-стадия verbatim-сверила все § 0 цитаты с живым кодом, прогнала § 0.A grep'ы, проверила domain-claims § 0.4 против `analysis/` — byte-for-byte совпадение, ноль дрейфа.
- **Реестр-тест ломается от регистрации новых rowKind** — предсказано на Research (`standalone-load-row-form-schema.test.ts` утверждал «остальные 8 отсутствуют»). T13 поправил блок (4 есть / 5 нет), коммит-в-коммит с регистрацией (C2) — suite ни секунды не красный.
- **Тип ошибки `number[]`-поля** (design D3) — см. «Принятые решения». Не STOP-эскалация: исправление чисто типовое, в зоне 9.2, без изменения контракта/поведения.
- **QA-902 / QA-903** — найдены на adversarial-QA, оба WARNING (0 CRITICAL), исправлены коммитом `fe4bee40`.
- **STOP-эскалаций не было.** Контракт принял все три собранных payload; `formatRestRaw` покрывает каждую ветку `restSpec`; ни одной § 0-цитаты, переставшей совпадать.

---

## Что отложено

- **5 оставшихся coach-facing rowKind** (`EXERCISE` 9.3-9.6, `REP_DEFINITION` 9.7, `FOOTNOTE` 9.8, `PLACEHOLDER` 9.9) — `default` инертный chip держит их.
- **`StepArrayFields` для архетип-форм** — готов к переиспользованию в Ladder (8.5) / parallel-ladders (8.6); `parseStepDraft` экспортируется отдельно.
- **QA-305** (refetch-clobber edit-формы) — три новые `*RowForm` наследуют residual через `useEffect(reset, [mode])`; codebase-wide UX-polish, не фиксится в 9.2 (D-9.2-8).
- **Toast-policy carry-forward** — отдельный `/feature small` (D-9.2-8).
- **5 QA INFO-находок** — теоретические edge'и (в т.ч. QA-907: латентный footgun, если url когда-нибудь сделают кликабельным — тогда нужен `safeHttpUrl` allowlist). Не actioned.
- **RTL-регрессионный тест на no-href** для `STANDALONE_URL`-саммари — не добавлен (RTL не заведён в `apps/platform`; свойство покрыто Review + QA code-trace + смоук-тестом).
- **Браузерный смоук-тест § 9** — выполняется тренером (см. ниже).

---

## Ссылка на `.feature-dev/1779459924/`

Артефакты пайплайна `/feature` (gitignored):

- `research.md` — verbatim-сверка спеки с кодом, verdict «no drift».
- `design.md` — RFC компонентного уровня (§ 5.1-5.7, решения D1-D7).
- `plan.md` — 13 задач, 3 commit-границы.
- `tasks.md` — трекинг исполнения.
- `review.md` — Stage 5 blocking review: **APPROVE**, 0 CRITICAL / 0 WARNING / 3 INFO.
- `qa.md` — Stage 6 adversarial QA: score **B**, 0 CRITICAL / 2 WARNING (QA-902, QA-903 — исправлены) / 5 INFO.

---

## Сценарий смоук-теста

Браузерный смоук-тест § 9 (11 шагов) **выполняется тренером** — у исполнителя нет browser automation (E2E выпилен per `[[e2e-dropped]]`). Предусловия: `pnpm --filter @repo/api-server db:reset && db:seed` (схема/seed не менялись — только чистое предусловие), platform dev-сервер (`pnpm --filter platform dev`, порт 3001), вход под seed-тренером, открыт черновик плана, создана цепочка week → day → session → block → schema.

Шаги:

1. Открыть блок схемы → тело схемы показывает кнопку «Add row».
2. «Add row» → меню видов ряда, 8 пунктов, все кликабельны.
3. Выбрать «rest» → форма со структурированными полями отдыха (длительность число+единица, размещение, опц. квалификатор).
4. «90 sec, between sets», сохранить → ряд с читаемым саммари «rest 90 sec between sets».
5. «Add row» → «inner ladder marker» → chip-array поле. Ввести `21`, `15`, `9` (Enter или кнопка «Add») → три чипа. Сохранить → ряд «21 → 15 → 9».
6. Удалять чипы до одного → последний чип не удаляется (пол `.min(1)`).
7. «Add row» → «url» → поле url + селект «applies to» (2 опции), контрола «wrapped» нет. Ввести URL, выбрать «whole schema», сохранить → ряд с url-саммари.
8. Новый url-ряд, ввести невалидный URL → ошибка поля, сохранение заблокировано.
9. Перетащить ряд → порядок меняется, сохраняется после перезагрузки.
10. Редактировать rest-ряд → сменить длительность → сохранить → саммари обновилось.
11. Удалить ряд через меню → подтвердить → ряд исчез, сохраняется после перезагрузки.

**Результат**: _ожидает прогона тренером._

---

## Verification notes

Прогнано на финализации (`feat/training-domain` @ `1be19519`):

| Проверка                            | Результат                                             |
| ----------------------------------- | ----------------------------------------------------- |
| `pnpm check-types`                  | **16/16 successful** ✅                               |
| `pnpm lint`                         | **16/16 successful, 0 warnings** ✅                   |
| `pnpm dep:check`                    | **0 violations** (1340 modules, 2564 dependencies) ✅ |
| `npx vitest run --project platform` | **9 files / 140 tests passed** ✅ (baseline 64 → +76) |

9.2 platform-only — api-server suite не затрагивается (`apps/platform` — лист, api-server его не импортирует). Husky `pre-commit` зелёный на каждом из 5 коммитов.

---

## Acceptance criteria self-check

| #   | Критерий (§ 4)                                                                                                                                 | Статус               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Переиспользуемый chip-array редактор — контролируемый, число→чип, удаление, `.min(1)` пол, повторы                                             | ✅ `StepArrayFields` |
| 2   | `RestRowForm` — самодостаточная, `RestSpecFields` для `parsed`, `raw` производное, зарегистрирована                                            | ✅                   |
| 3   | `InnerLadderMarkerRowForm` — самодостаточная над chip-array, `steps` `.min(1)`, зарегистрирована                                               | ✅                   |
| 4   | `StandaloneUrlRowForm` — `url` + `appliesTo` Select (default `previous_exercise_row`), `wrapped` запинён `true` без контрола, зарегистрирована | ✅                   |
| 5   | `ROW_KIND_FORM_REGISTRY` 4 записи; меню `AddRowButton` без изменений (8); 4 открывают форму, 4 no-op                                           | ✅                   |
| 6   | `renderBody` — читаемое саммари для `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL`; `default` chip держит 5 нереализованных                 | ✅                   |
| 7   | Payload-шейпы точные; без top-level модификаторов                                                                                              | ✅                   |
| 8   | Ни `contracts` / `api-server` / роуты / Prisma / seed / `admin`; барели `hooks` / `api` не тронуты                                             | ✅                   |
| 9   | `check-types` 16/16; `lint` 16/16 0 warnings; `vitest --project platform` зелёный; `dep:check` 0                                               | ✅                   |
| 10  | Per-layer atomic коммиты на `feat/training-domain`; husky чисто; ноль skip-флагов                                                              | ✅                   |
| 11  | Браузерный смоук-тест § 9                                                                                                                      | ⏳ за тренером       |

10/11 закрыто исполнителем; критерий 11 (§ 9 смоук-тест) — за тренером.
