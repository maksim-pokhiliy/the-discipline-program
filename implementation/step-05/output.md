# Step 5 — Plan-detail shell (calendar viewport) — output

> Executor session, run via `/feature` (full pipeline). Branch `feat/training-domain`.
> Base `488903cc` → 11 feature commits (+ this `docs(step-05)` commit). 37 files, +1094/−34.

## Что сделано

Построен первый настоящий training-domain surface в `apps/platform`: маршрут
`coach/plans/[planId]` из `"Coming soon"`-заглушки превращён в **календарный viewport** над
неделями плана, по модели **D6** (Week = лениво-материализуемый календарный слот, не
управляемая сущность).

Вертикальный срез под `Week`, по образцу `plan-enrollment` (структура, не набор глаголов —
Week только read + notes-upsert):

- **contracts** — новый `lms/week` slice: `weekSchema` (`startDate` через `z.coerce.date()` по
  конвенции `@db.Date`), `updateWeekNotesSchema` (`notes` `.nullable()`), api-схемы
  (`weekByPlanAndDateParamsSchema` — `startDate` как `YYYY-MM-DD`-строка пути;
  `getWeekResponseSchema` — `week` nullable, т.е. немат. слот это 200, не 404), типы, barrel,
  регистрация в `lms/index.ts` + `package.json` exports.
- **api-server** — `lmsWeekApi` (`getByPlanAndDate` → `Week | null` без `NotFoundError` на
  отсутствующей строке; `upsertNotes` — ленивая материализация через `prisma.week.upsert`,
  ownership-guard первым, `verifyPlanEditable` только на write-пути), `mapToWeek` (чистая
  копия полей, у `Week` нет enum-колонок).
- **platform api route** — `weeks/[startDate]/route.ts`: `GET` + `PUT`, композиция
  `withCoachAuth(withAuthRateLimit(createAuth*Handler(...), RATE_LIMIT_TIER.API))`. Нет
  `POST`/`DELETE`, нет list-эндпойнта (D6).
- **platform client/hooks** — `createWeeksAPI`, `platformKeys.weeks.byDate`, `useWeek` +
  `useUpdateWeekNotes`.
- **`@repo/ui`** — новый примитив `InlineEditText` (click-to-edit Typography↔TextField:
  commit на blur и Enter (не-multiline), revert на Escape, подавление no-op и пустых значений
  при `!emptyIsValid`); строго аддитивное расширение `PageHeader` (`description?`, `editable?`,
  `onTitleCommit?`, `onDescriptionCommit?`).
- **`plan-detail` module** — `PlanDetailView` (читает `?week=`, считает `activeMonday`, гонит
  его в `useWeek` и в три ребёнка; inline-правка имени/описания плана через editable
  `PageHeader` + `useUpdateTrainingPlan`), `WeekNavigator` (prev/next/today + jump-to-date),
  `WeekGrid` (7 full-width day-rows из `getWeekDays`), `DayRow` (метка дня + подсветка
  «сегодня» кружком `primary.main`, тело — placeholder `"No sessions"` — seam для Step 6),
  `WeekNotes` (inline-правка заметки недели).
- **create-plan tweak (OQ-D)** — убран `redirectTo` из `createCrudHooks`-конфига; создание
  плана теперь высаживает коуча в `/coach/plans/<newId>`, а не на список.

Schema не менялась (`Week` уже был в `schema.prisma` со Step 1-2), `db:reset`/seed не
запускались — пустой план с нулём `Week`-строк это ровно то состояние, что нужно смоук-тесту.

## Изменённые/созданные файлы

**contracts (8):** `src/entities/lms/week/{week.constants,week.schema,week-api.schema,week.types,week-api.types,index,week-api.schema.test}.ts` (созданы), `src/entities/lms/index.ts` + `package.json` (изменены).

**api-server (5):** `src/endpoints/lms/week/{admin,index,admin.test}.ts` + `src/mappers/lms/week.mapper.ts` (созданы), `src/endpoints/lms/index.ts` + `src/mappers/lms/index.ts` (изменены).

**platform (11):** `src/app/api/platform/training-plans/[planId]/weeks/[startDate]/route.ts`, `src/lib/api/endpoints/weeks.ts`, `src/lib/hooks/use-weeks.ts`, `src/modules/plan-detail/components/{day-row,week-grid,week-navigator,week-notes,index}.tsx` (созданы); `src/lib/api/endpoints/index.ts`, `src/lib/api/index.ts`, `src/lib/api/keys.ts`, `src/lib/hooks/index.ts`, `src/lib/hooks/use-training-plans.ts`, `src/modules/plan-detail/views/plan-detail-view.tsx`, `src/modules/plans/components/create-plan-dialog.tsx` (изменены).

**`@repo/ui` (4):** `src/components/inline-edit-text.tsx` + `inline-edit-text.test.tsx` (созданы), `src/components/page-header.tsx` + `src/components/index.ts` (изменены).

**docs (3):** `docs/BOUNDED-CONTEXTS.md`, `packages/contracts/README.md`, `apps/platform/README.md` (изменены — sync под новую `Week`-сущность и `plan-detail` модуль).

**Коммиты (11, per-layer, на `feat/training-domain`):**

```
2845244a feat(contracts): add week slice with calendar-slot schema and api types
3a4d1ebc feat(api-server): add week admin api with lazy upsert and ownership guards
c1145479 feat(platform): add week get and notes-put api routes
3fe9c572 feat(platform): add week client api, cache keys and tanstack hooks
d8b75c66 feat(ui): add inline-edit-text primitive and editable page-header
ee96bc0e feat(plan-detail): build calendar-viewport shell over plan weeks
76a00200 refactor(plans): land coach in new plan on create instead of list
8341b277 fix(api-server): persist week startdate at utc midnight          (Stage 6 QA)
4856a072 fix(ui): correct inline-edit-text no-op check and multiline display (Stage 6 QA)
1e9a75f1 test(api-server): cover remaining must-test scenarios from stage 6 qa
88a4321d docs: record the week lms entity and plan-detail module
```

## Принятые решения

- **D6 реализован как специфицировано** — Week адресуется `(planId, startDate)`, не `weekId`;
  навигация ничего не создаёт; немат. слот = отсутствие строки = нормальное состояние (200 с
  `week: null`, не 404); единственная запись в шаге — notes-upsert.

- **`useUpdateWeekNotes` пишет back по строке `startDate` от вызывающего, а не по
  `formatDateParam(week.startDate)`** (отклонение от design.md Appendix #2). Причина:
  `client.request` не валидирует response-схему (как `training-plans.ts`), поэтому
  `week.startDate` на клиенте в рантайме это **строка**, а не `Date` — `formatDateParam` от
  неё дал бы мусорный ключ. Строка, которую вызывающий уже передал в `mutate({ startDate })`,
  это ровно read-ключ `useWeek` (оба идут от одного `formatDateParam(activeMonday)` в
  `PlanDetailView`) — write-back и read-ключ совпадают by construction. Однострочный
  why-комментарий оставлен в `use-weeks.ts`.

- **QA-001 (CRITICAL) — `Week.startDate` нормализуется к UTC-полуночи на границе api-server.**
  `parseDateParam`/`getMonday` строят **local-midnight** `Date`; Prisma 6 сериализует
  `@db.Date` через `toISOString()` (UTC) — под сервером с положительным UTC-offset строка
  сохранялась на день раньше. Хелпер `resolveWeekStartDate` в `admin.ts` переякоривает
  Monday на `Date.UTC(...)` перед Prisma-границей, в обоих методах одинаково.
  **Важно для Step 6:** материализация `Day` упрётся в ту же `@db.Date`-границу — этот
  UTC-midnight паттерн надо пронести в Step 6 (любой `Date`, уходящий в `@db.Date`-колонку,
  должен быть UTC-полночь). `@repo/shared` не трогали — там local-midnight нужен клиентскому
  UI; фикс локализован в api-server.

- **`InlineEditText` no-op-проверка сравнивает с baseline на момент входа в правку** (ref),
  не с живым `value`-проп (QA-004). Иначе фоновый рефетч, прилетевший в открытое поле, мог
  тихо проглотить правку коуча.

- **Тест non-Monday-snap (`admin.test.ts`) проверяет TZ-инвариант** (стабильность row-id:
  Wed-upsert / Mon-get / Mon-upsert → одна строка) **плюс** (после фикса QA-001) value-assertion
  по UTC-компонентам `startDate`. Не через `formatDateParam` — он читает local-компоненты и
  вернул бы TZ-зависимость в сам ассерт.

- **`description` в `PlanDetailView` передаётся conditional-spread** `{...(plan.description !== null && { description: plan.description })}`, не `?? undefined` — `exactOptionalPropertyTypes` отвергает явный `undefined`; это идиома кодбейза (`status-chip.tsx`, `InlineEditText` для `placeholder`).

## Возникшие вопросы и как решены

- **Взаимодействие `@db.Date` ↔ local-component date-хелперов** — всплыло в L2 (api-server
  agent выбрал TZ-инвариантный тест вместо хрупкого value-ассерта), отмечено L4 agent'ом,
  Review классифицировал INFO («byte-identical to `boardedAt`»), Stage 6 QA опроверг это
  (`boardedAt` строит `Date` из ISO-строки = UTC-полночь; `Week.startDate` — из
  `new Date(y,m,d)` = local-полночь; разные конструкторы) и поднял до **CRITICAL (QA-001)** с
  TZ-пробами по 7 таймзонам + инспекцией рантайма Prisma 6.1.0. Фикс — в fix-loop'е,
  переверифицирован прогоном `admin.test.ts` под `TZ=Asia/Kolkata` (зелёный; до фикса
  value-ассерт падал `expected 17 to be 18`).

- **design.md Appendix #2 (re-derive write-back key from `week.startDate`) оказался багом** —
  L4 implementation agent при чтении исходника date-хелперов обнаружил, что это дало бы
  мусорный ключ в рантайме; решено использовать строку от вызывающего (см. «Принятые
  решения»). Подтверждено Review как корректное отклонение.

- **Hard triggers / prompt-vs-codebase конфликты — не возникло.** Одна прозрачная заметка:
  `git log` по пути `plan-detail` (его требует research-секция промпта) показал subjects
  коммитов прошлой попытки за известным delete-коммитом `7e5e9439 chore: strip plan-detail,
library and workout-log stack entirely`. Halt-вокабуляра (`SchemeType`, `per-block atomic
save`, ADR-0037/0041/0042/0043 и т.п.) в них нет, diff'ы не открывались, как reference не
  использовались — это ожидаемое post-strip состояние (промпт §1 сам говорит «prior three
  were deleted»). Surface-only, по прецеденту Step 1/Step 4.

## Что отложено

Не блокеры; вынесено планнеру для решения, поскольку фикс выходил бы за явную спецификацию
промпта:

- **QA-003 (WARNING)** — `useUpdateWeekNotes` без `invalidateQueries`/`mutationKey`: два
  быстрых сохранения подряд по одной неделе могут оставить кеш кратко-устаревшим. Промпт §3
  Phase 1 **явно** специфицировал `onSuccess` как `setQueryData` + `toast` (без invalidate) —
  починка отклоняется от явной спецификации, это решение планнера. Impact низкий (single-user
  surface, самовылечивается при следующей навигации/рефетче).

- **QA-005 (WARNING)** — у `InlineEditText` нет client-side cap длины: вставка значения сверх
  лимита → серверный 400 → toast → правка потеряна. Починка требует нового пропа `maxLength`
  сверх явного списка пропов `InlineEditText` в промпте §3 Phase 2 — решение планнера. Коуч
  всё же получает error-toast (не молча).

- **QA-002 (INFO)** — нет отдельного `date-calendar.test.ts` для `parseDateParam`/`getMonday`:
  это pre-existing непокрытый хелпер `@repo/shared`, который Step 5 не владеет; выходит за
  мандат «3 тест-файла» промпта. Must-Test #8 покрывает reject-путь хелпера _через_
  `lmsWeekApi`. Рекомендованный follow-up.

- **QA-007 / QA-008 / QA-009 (INFO)** — `notes`-cap считает UTF-16 code units (consistent со
  всем кодбейзом); 404-vs-403 oracle в `verifyPlanOwnership` (codebase-wide, pre-dates Step 5);
  `PlanDetailView` не читает `error` от `useWeek` (узкое окно: здоровый plan-GET + упавший
  week-GET → пустое поле заметок без error-toast). Все pre-existing/codebase-wide или
  completeness-уровня.

- **Review WARN-2 (INFO)** — единственный код-комментарий (`use-weeks.ts`, объясняет выбор
  write-back ключа) плотный (~147 символов); косметика.

- **Контент дней/сессий/блоков** — 7 day-rows это пустые `"No sessions"` placeholder'ы; Day →
  Session → Block → Schema → SchemaRow это Steps 6-10 (вне scope по промпту §4).

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1778776411/` — `research.md`, `design.md`, `plan.md`, `tasks.md`, `review.md`,
`qa.md`. (Каталог в `.gitignore`, как и у прошлых шагов — `IMPLEMENTATION_LOG.md` ссылается на
него по пути.)

## Сценарий смоук-теста

**Предусловия:**

- Seed со Step 2 (текущее состояние БД, **`db:reset`/`db:seed` не запускались** — Step 5 без
  schema-изменений). Коуч `coach@thedisciplineprogram.com` / `password12345`, 4 плана разных
  статусов, **0 строк `Week`** — ровно то состояние, что нужно (немат. слоты).
- `pnpm dev` (platform на :3001). Браузер в таймзоне с любым offset — клиентская сторона
  TZ-инвариантна by construction; для проверки фикса QA-001 серверной стороны полезно (не
  обязательно) поднять dev в UTC+ таймзоне.

**Шаги:**

1. Залогиниться `coach@thedisciplineprogram.com` / `password12345` → открыть `/coach/plans`.
   _Ожидание:_ список планов (status-табы), как и было.
2. Открыть любой ACTIVE-план (клик по карточке).
   _Ожидание:_ `/coach/plans/<planId>` рендерит **реальный plan-detail**, не `"Coming soon"`:
   header с именем/описанием плана + `PlanStatusChip` + кнопка «назад»; ниже — навигатор
   недели (два ряда, прижатых вправо: `‹` метка-недели `›` сверху, MUI DatePicker «Jump to
   date» снизу), блок «Week notes», и **7 full-width строк** Mon-Sun **текущей календарной
   недели**; тело каждой строки — `"No sessions"`.
3. Если текущая неделя содержит сегодня — у строки сегодняшнего дня число дня месяца в
   **залитом кружке** (`primary.main`). Если нет — кружка нет ни у одной строки.
   _Ожидание:_ подсветка ровно у сегодняшнего дня или ни у кого.
4. Нажать **prev** (`‹`). _Ожидание:_ viewport ушёл на неделю назад; метка
   `"<диапазон> · W<n>"` обновилась; URL получил `?week=<YYYY-MM-DD>` (Monday прошлой недели);
   все 7 строк по-прежнему `"No sessions"`.
5. Нажать **next** (`›`) дважды. _Ожидание:_ viewport на неделе вперёд от исходной; `?week=`
   обновляется каждый клик.
6. **Обновить страницу (F5).** _Ожидание:_ остаётся на той же неделе, что в `?week=` —
   состояние пережило рефреш.
7. Открыть DatePicker **«Jump to date»** → в action-bar календаря нажать **«Today»**.
   _Ожидание:_ viewport вернулся на текущую календарную неделю; `?week=` = Monday текущей
   недели. (Отдельной кнопки «Today» больше нет — она внутри календаря.)
8. Открыть DatePicker **«Jump to date»**, выбрать дату через 2 месяца. _Ожидание:_ viewport
   прыгнул на Monday той недели; `?week=` обновился. Очистить инпут — no-op (значение
   снапается обратно на текущий Monday).
9. Кликнуть по блоку **«Week notes»** (placeholder `"Add week notes…"`), ввести текст в
   две строки, кликнуть вне поля (blur). _Ожидание:_ toast `"Week notes saved"`; заметка
   отображается **с сохранённым переносом строки**.
10. Перейти prev и обратно next (или Today, если заметка на текущей неделе) → вернуться на
    неделю с заметкой. _Ожидание:_ заметка на месте (строка `Week` материализовалась через
    upsert).
11. Очистить заметку (войти в правку, стереть всё, blur). _Ожидание:_ toast; заметка пуста
    (записан `null`).
12. Кликнуть по **имени плана** в header, изменить, Enter. _Ожидание:_ имя сохранено
    (`useUpdateTrainingPlan`), видно сразу.
13. Кликнуть по имени плана, **стереть всё**, blur. _Ожидание:_ имя **возвращается к
    прежнему** — пустое имя не сохраняется (`emptyIsValid={false}`, self-revert в
    `InlineEditText`, `onTitleCommit` не вызывается).
14. Кликнуть по **описанию** плана (или placeholder `"Add a description…"`), ввести текст,
    blur. _Ожидание:_ описание сохранено. Затем стереть его полностью, blur — _ожидание:_
    описание сохраняется как пустое (`null`; `emptyIsValid` для описания true).
15. Вернуться на `/coach/plans`, нажать **«Create plan»**, заполнить, создать.
    _Ожидание:_ после создания коуч **сразу на `/coach/plans/<newId>`** (текущая неделя,
    7 пустых строк), а не обратно на список.

**Откат состояния:**

- Удалить материализованные `Week`-строки: в Neon dev —
  `DELETE FROM training_weeks WHERE "planId" IN (<planId из шага 2>, <newId из шага 15>);`
  (или `pnpm --filter @repo/api-server` скриптом, если есть). Шаги 9-11 создают одну строку
  на плане из шага 2.
- Имя/описание плана из шага 2 вернуть на исходные через тот же inline-edit (или оставить —
  это seed-план, не критично).
- Удалить план, созданный в шаге 15: через `PlanActionMenu` → delete на `/coach/plans`, либо
  `DELETE FROM lms_training_plans WHERE id = '<newId>'`.
- Полный сброс при желании — `pnpm --filter @repo/api-server db:reset && db:seed` (вернёт seed
  Step 2 целиком; для Step 5 не требовалось и не запускалось).

## Verification notes

- `pnpm check-types` — **16/16** на финальном HEAD. Pre-commit hook гонял `turbo check-types`
  зелёным на каждом из 11 коммитов.
- `pnpm lint` — **16/16** на финальном HEAD.
- `pnpm dep:check` — **0 violations** (1093 модуля, 1996 зависимостей). `contracts/lms/week`
  импортит только `zod` + `lms/`-siblings (`contracts-no-prisma` чист);
  `ui/inline-edit-text` — только `@mui/material` + react.
- `pnpm test` — **96 файлов, 810 тестов, зелено** (полный прогон на Stage 7 HEAD `1e9a75f1`;
  Stage 8 — только docs, тестонезначим). 3 новых тест-файла Step 5: `week-api.schema.test.ts`
  (5 кейсов), `week/admin.test.ts` (10 кейсов, integration vs live Neon dev DB),
  `inline-edit-text.test.tsx` (9 кейсов). Финальный re-run Stage 9 — см. ниже.
- **QA-001 proof:** `TZ=Asia/Kolkata pnpm --filter @repo/api-server test src/endpoints/lms/week/admin.test.ts`
  — зелёный (7/7). Fix-loop agent отдельно подтвердил, что без фикса этот прогон падает
  `expected 17 to be 18` — тест не вакуумный.
- Браузерный смоук-тест executor не запускает (промпт §5) — сценарий выше для пользователя.

_Финальный `pnpm test` Stage 9 (HEAD `88a4321d`): **96 файлов, 810 тестов, зелено**, 253s, exit 0._

## Пост-валидационные UI-правки

После закрытия пайплайна юзер запросил три UI-правки навигации/инлайн-редактирования —
прямыми коммитами, без повторного `/feature`:

- **`feat(platform): use mui datepicker for week navigation`** (`8cc8cf43`) — `WeekNavigator`
  переразложен в два прижатых вправо ряда (`‹` метка-недели `›` сверху, jump-to-date снизу);
  нативный `<input type="date">` заменён на MUI X `DatePicker`; отдельная кнопка «Today»
  свёрнута в action-bar календаря (`slotProps.actionBar.actions: ["today"]`);
  `LocalizationProvider` (`AdapterDateFns`) добавлен в корневой layout через клиентский
  враппер `DateLocalizationProvider` — корневой `layout.tsx` это server component и не может
  передать adapter-класс через RSC-границу.
- **`refactor(ui): render inline-edit-text edit mode with inputbase`** (`11a7c463`) —
  edit-mode `InlineEditText` теперь рендерит chromeless `InputBase` вместо `TextField`
  (текст становится редактируемым на месте, без underline/chrome); поведение не изменилось;
  `aria-label` переехал в `inputProps`, тест-ассерт ужесточён до `getByRole("textbox", { name })`,
  чтобы сломанный label падал громко.
- **`docs(step-05): ...`** (этот коммит) — синхронизация `output.md`: смоук-сценарий
  (шаги 2/7/8) + эта секция.

**Deviation-record:** промпт §2 говорил «the repo has no date-picker library — do not add
one». Перекрыто **явным запросом юзера** на MUI DatePicker. `@mui/x-date-pickers` (`^9.0.4`)
**уже был в `pnpm-workspace.yaml` catalog** (рядом с `@mui/material ^7.3.6` — версии
завендорены вместе), а `date-fns` уже был зависимостью `apps/platform` — то есть это
**wire-up уже завизированной зависимости в платформу**, не введение новой. Гейты после правок:
`check-types` 16/16, `lint` 16/16, `dep:check` 0 violations, `pnpm --filter @repo/ui test`
17/17.

## Acceptance criteria self-check

| Критерий (промпт §5)                                                                                                       | Статус                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm check-types`, `pnpm lint`, `pnpm dep:check` зелёные на всех воркспейсах                                              | ✅ 16/16, 16/16, 0 violations                                                                                      |
| `pnpm test` зелёный, включая 3 новых тест-файла, без регрессий                                                             | ✅ 810 тестов (Stage 7) + финальный re-run Stage 9                                                                 |
| Нет `as any`/`as unknown`/необоснованных `!`; нет hex вне темы; нет комментариев кроме одного non-obvious _why_            | ✅ один why-комментарий (`use-weeks.ts`), проверено Review                                                         |
| 3 pre-existing `PageHeader` call sites компилируются и рендерятся неизменно                                                | ✅ расширение строго аддитивно; non-`hasBlock` ветка byte-identical; root check-types 16/16                        |
| Коуч логинится → `/coach/plans` → открывает план → реальный plan-detail с текущей неделей (7 строк), не `"Coming soon"`    | ✅ реализовано (`PlanDetailView` + `WeekGrid`) — браузер-проверка за пользователем                                 |
| Prev/next ±1 неделя; Today → текущая; date-input → Monday выбранной недели; активная неделя в `?week=` и переживает рефреш | ✅ реализовано (`WeekNavigator` + `?week=` URL-state) — браузер-проверка за пользователем                          |
| Все 7 строк Mon-Sun; сегодня — число в кружке; пустые недели рендерятся одинаково                                          | ✅ реализовано (`WeekGrid`/`DayRow`) — браузер-проверка за пользователем                                           |
| Заметка недели материализует строку `Week` (upsert); навигация туда-обратно показывает её; очистка пишет `null`            | ✅ реализовано (`WeekNotes` + `lmsWeekApi.upsertNotes`) — браузер-проверка за пользователем                        |
| Inline-правка имени/описания персистится через `useUpdateTrainingPlan`; пустое имя revert'ится; пустое описание → `null`   | ✅ реализовано (editable `PageHeader` + `onTitleCommit`/`onDescriptionCommit`) — браузер-проверка за пользователем |
| Создание плана высаживает коуча в `/coach/plans/<newId>`                                                                   | ✅ реализовано (OQ-D: `redirectTo` убран, `router.push` в `CreatePlanDialog`) — браузер-проверка за пользователем  |
| Сценарий смоук-теста задокументирован в `output.md`                                                                        | ✅ см. «Сценарий смоук-теста»                                                                                      |
| Без Prisma schema change / `db:reset` / seed-изменения / правок `analysis/artifacts/`                                      | ✅ ничего из этого не делалось                                                                                     |
