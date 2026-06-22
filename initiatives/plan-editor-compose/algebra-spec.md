# Step 10.0 — Compose-only primitive algebra (foundational spec)

> **Phase 10 = compose-only pivot.** The plan editor stops being archetype-first (coach picks 1 of 34 catalog rows, fills a bespoke form) and becomes a **constructor**: a small set of freely-nesting primitives from which any structure Denys writes by hand is _assembled_. The archetype stops being an entity — it becomes an emergent, computed-on-read label.
>
> This is a **planner design artifact**, not an executor step. It is the review gate before any code (per planner-user chat 2026-06-02: «Старт с шага 0 — спека алгебры. Код после неё»). Steps 10.1+ are written against this spec after the user ratifies it.

Идентификаторы / type-shapes — English; содержательный комментарий — Russian (как в `analysis/artifacts/06-formalization/`).

---

## §0. Ratified inputs (planner-user chat, 2026-06-02)

Эта спека не переоткрывает решения ниже — они согласованы. Она их формализует.

- **Цель — конструктор, не импорт.** Задача НЕ парсить записки Дена и НЕ мигрировать корпус. Задача — дать инструмент, в котором Ден собирает тренировку любой структуры свободным вложением примитивов. Parse-from-text — возможный будущий ускоритель ввода _над_ этой моделью, но не продукт и не этот заход.
- **Критерий приёмки — не покрытие, а композируемость.** Не «покрывает 34 архетипа» (это снова мерить себя корпусом), а «любая бумажная структура Дена собирается свободным вложением». Архетип = следствие композиции. AMRAP / nested-rounds / parallel-ladders получаются как комбинации примитивов, не закладываются поштучно.
- **OQ-1 — дроп хранимых дискриминаторов.** `archetypeId` + `Archetype`-таблица + `archetypeParams` discriminated-union + `kind`/`family` как хранимые колонки — удаляются. «archetype эмерджентен» и «archetypeId — обязательный FK» прямо противоречат друг другу. `archetypeId` ошибочно считался костяком; костяк — дерево/рекурсия/листья/Json-VO. **Страховка:** `kind`/`family` вычисляются на чтение, **никогда** не денормализуются обратно в колонку. Кэш derived-поля «для скорости» = рецидив `archetypeId` под новым именем.
- **OQ-2 — `AlternatingGroup` складывается в ось `arrangement`.** Отдельная сущность кодирует типом то, что является значением оси = masked-archetype. При сворачивании **не теряем** данные связи (block-009 `alternating_sets`, `pairedWithInnerRowId`) — они переезжают в структуру оси; фаза 5 на них опирается. Рефактор представления, не удаление информации.
- **OQ-3 — ось `scoring` present-but-inert.** Значения валидны и хранятся при сборке; логика не исполняется до фазы 5. Без оси AMRAP/for-time отрастут как masked-архетипы. **Требование:** инертность громко декларирована в коде (см. §6) — иначе следующая сессия примет валидные значения за наличие исполнения.
- **OQ-4 — механический снос (10.4) — отдельным workflow**, стартует не раньше чем: (i) coach-walkthrough 10.1 пройден, (ii) схема 10.2 заморожена. Снос по движущейся цели = двойная работа.
- **Со-критерий эргономики — принят сознательно.** Выразимость = инструмент _способен_. Эргономика = инструментом _захотят_ пользоваться. Исходное «вернётся в Гугл-таблицы» — про скорость, не выразимость. Оба на гейте прототипа.
- **Дублирование — в скоуп прототипа 10.1** (неделя/день/блок/узел). Реальный воркфлоу Дена = собрал неделю 1 → клонировал в 2–12 → правит веса. Без дублирования эргономика-гейт меряет не тот воркфлоу = ложно-негативный сигнал.

---

## §1. Sacred backbone (passed the blind Gauntlet — untouchable)

Прошло слепой stress-test (Gauntlet, §3) и **не трогается**:

- Tree `Week → Day → Session → Block → Schema` (Prisma `training_*`).
- Recursion `Schema.parentSchemaId` — механизм вложенности.
- Leaves: `SchemaRow` + все Json-VO — `load`, `reps`, `tempo`, `side`, `position`, `intensity`, `media`, `compoundRep`, `program` (StagedProgram), exercise-form (`atomic/compound/cyclical/sandwich/or_alternative/placeholder`).
- Catalogs: `Exercise`, `Label`.
- Performed side: `PerformedSession`, `PerformedExerciseInstance`.

Костяк = дерево + рекурсия + листья + VO. Всё остальное на уровне `Schema` (дискриминаторы) — наслоение, которое растворяется (§5).

---

## §2. The algebra

### 2.1 Two node types

- **Container** (internal node) ≡ `Schema`. Группирующий узел.
- **Row** (leaf) ≡ `SchemaRow`. Предписанная работа / rest / reference / placeholder. **Без изменений** — существующий Json-VO payload.

Дерево строится рекурсией `parentSchemaId` (без изменений). Container держит детей; Row — лист.

### 2.2 Container = orthogonal axes (ядро)

Контейнер — это **точка в пространстве осей**. Каждая ось опциональна, независима, **свободно сочетается** с любой другой. Это заменяет `archetypeParams`.

| Axis               | Values                                                                                                                                    | Что было архетипами                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `repetition`       | `once` · `count(N)` · `range(min,max)` · `ladder(steps[])` · `timeCap(min)` · `cadence(everyNmin, rounds)` · `window(startHhMm, endHhMm)` | rounds/sets, AMRAP-длительность, EMOM, ladder, rolling, time-window |
| `arrangement`      | `ordered` · `parallel` · `superset`                                                                                                       | parallel-ladders, alternating-sets, super-set                       |
| `scoring` ⏸️ inert | `prescribed` · `amrap` · `for_time` · `max_in_remaining` · `total` · `progressive(seed)`                                                  | intervals fixed/progressive/max-tail, total-counter                 |
| `rest`             | `RestSpec { scope: between \| after_each \| inside, ... }`                                                                                | composite-\*-with-rest                                              |

`children: (Container | Row)[]` — **любые**, без ограничений по типу.

### 2.3 Row = leaf (unchanged)

Существующий `RowKind` (`EXERCISE / REST / FOOTNOTE / STANDALONE_LOAD / STANDALONE_URL / PLACEHOLDER / INNER_LADDER_MARKER / REP_DEFINITION / REST_SLOT`) + Json-VO payload. Не меняется этой фазой.

### 2.4 Composition invariant — anti-masked-archetype guard

Три правила. Это и есть формализация критерия приёмки:

1. **Любой Container принимает любого ребёнка** (`Container` или `Row`) — никаких типовых ограничений на вложение.
2. **Любое значение оси сочетается с любым** — оси ортогональны.
3. **Ни один узел не хранит «что он за форма»** — форма читается из осей, вычисляется на чтение, **никогда не денормализуется** (OQ-1).

> **Failure test.** Если законная на бумаге комбинация требует _нового типа узла_ или _запрещённого вложения_ — примитивы спроектированы как замаскированные архетипы. **СТОП, назад к доске.** Это объективный критерий провала дизайна, не вкусовой.

### 2.5 Archetype is emergent

«Архетип» больше не сущность — это распознаваемая конфигурация осей. Маппинг (для интуиции, не для хранения):

| Бывший архетип                                     | = конфигурация                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `n-rounds`                                         | `Container{ repetition: count }`                                                                                                    |
| `amrap-flat`                                       | `Container{ repetition: timeCap, scoring: amrap }`                                                                                  |
| `emom-nested`                                      | `Container{ repetition: cadence }` · дети-слоты                                                                                     |
| `ladder-*` (desc/asc/pyramid/spike)                | `Container{ repetition: ladder(steps) }` — форма = функция массива                                                                  |
| `parallel-ladders-*`                               | `Container{ arrangement: parallel }` · `[Container{ladder}, Container{ladder}]`                                                     |
| `nested-*-over-X`                                  | `Container{ repetition: count }` · `[ <child декларирует себя сам> ]`                                                               |
| `composite-rounds-with-rest`                       | `Container{ repetition: count, rest }`                                                                                              |
| `composite-intervals-{fixed,progressive,max-tail}` | `Container{ repetition: interval, scoring: prescribed\|progressive\|max_in_remaining }` — **одна** структура, отличие = ось scoring |
| `super-set`                                        | `Container{ arrangement: superset, repetition: count }`                                                                             |
| `named-exercise-program`                           | `Row{ program: staged(...) }`                                                                                                       |
| `single-line-*`                                    | bare `Row` (`then`-коннектор = `arrangement: ordered` на родителе)                                                                  |

`kind` и `family` — **производные label-функции** над осями (для отображения «это похоже на EMOM» / фильтрации), вычисляются на чтение.

---

## §3. Expressiveness proof — Gauntlet (the acceptance test)

Целевой тест выразительности — «злейшая тренировка как на бумаге» (Gauntlet, придуман вслепую, разложился в примитивы без потери структуры). Формализация по блокам:

- **B. EMOM 16 / 4 rounds** = `Container{ cadence(1min, rounds:4) }` · дети: 4× `Container{ window(1min) }`; min2 = `Row{ compoundRep: {5 pull-ups + 10 dips = 1} }`; min4 = `Row{ rest }`. → контейнер-в-контейнере.
- **C. parallel ladders → AMRAP** = `Container{ ordered }` · [ `Container{ parallel, scoring: for_time }`·(`Row{thrusters, ladder[21,15,9]}`, `Row{pull-ups, ladder[9,15,21]}`), `Container{ timeCap(5), scoring: amrap }`·`Row{bike, intensity 90%}` ]. → интерлив треков = значение `arrangement: parallel`, не тип.
- **D. 3×(2min work / 1min off), MAX wall balls, счёт только раунды 2&3** = `Container{ repetition: interval(work:2,off:1,count:3), scoring: max_in_remaining }` · ordered-дети [KB swings, push press `side:each_arm`, wall balls]; «счёт только 2&3» = scoring-condition (ось scoring, ⏸️ инертна).
- **A. back squat wave + box jumps after each** = `Container{ count(3), rest: until_recovery }` · [ `Row{ back squat, program: staged(wave,[5@75,3@85,1@95]), tempo: 3-1-X-0 }`, `Row{ 10 box jumps, position: from_sofa }` ]. → «after each wave» = просто второй ребёнок раунда, спец-триггер не нужен.
- **E. superset / cash-out OR** = `Container{ superset, count(3), rest: between(90s) }`·[`Row{placeholder: coach_choice biceps/triceps, reps:12}`, `Row{plank, reps: 45s}`]; cash-out = `Row{ or_alternative: [run 800m, row 1000m], scoring: none }`.

**Вывод: вся бумага собирается свободным вложением; ни одна комбинация не потребовала нового типа узла.** Не «исполняется» только условный скоринг (D) и parallel-интерлив-семантика (C) — но они **выражаются** (значения осей `scoring`/`arrangement`), просто не считаются в этот заход. Граница: выразимость ✅ сейчас, исполнение ⏸️ фаза 5.

`analysis/source/` (33 листа Дена; удалён 2026-06-22) — был расширенным корпусом для того же теста на 10.1; Gauntlet — каноничный минимум (и теперь единственный durable fixture).

---

## §4. Backbone delta (precise)

| ✅ Stays (sacred)                   | ♻️ Changes                                                                                                                                | ❌ Removed                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Week/Day/Session/Block tree         | `Schema.archetypeParams` → оси (`repetition`/`arrangement`/`scoring`/`rest`); персистенция (колонки vs Json `composition`) — решение 10.2 | `Archetype` table + `Schema.archetypeId` FK                                     |
| `SchemaRow` + все Json-VO           | `Schema.kind` → **computed-on-read** (есть дети? есть multiplier?), не хранится                                                           | `archetypeParamsSchema` discriminated-union (34 ветки)                          |
| `parentSchemaId` recursion          | `ArchetypeFamily` → **derived label**, не хранится                                                                                        | `packages/contracts/.../lms/archetype/*` сущность + endpoint + mapper           |
| `Exercise` / `Label` / `Performed*` | `AlternatingGroup` → ось `arrangement: parallel` (§5), данные переезжают                                                                  | 4× `prisma/seed/archetype-catalog/*.ts`                                         |
|                                     | `trailingConnector` → fold в `arrangement: ordered` ИЛИ keep как presentation-hint (решение 10.2)                                         | UI: `archetype-picker` + ~18 bespoke `*-schema-form.tsx` (row-editors выживают) |

**OQ-1 guardrail (жёсткий):** если будущий шаг предложит закешировать derived `kind`/`family` в колонку «для скорости» — **reject**, это `archetypeId` под новым именем. Эмерджентное остаётся вычисляемым.

---

## §5. `AlternatingGroup` fold (OQ-2) — representation refactor, not deletion

**Сейчас:** `AlternatingGroup` (block-scoped, `relationKind: ALTERNATING_SETS`) + `Schema.alternatingGroupId` FK; параллельные лестницы — через `pairedWithInnerRowId` в params + EXAMPLE-notes.

**Цель:** `arrangement: parallel` на контейнере, с под-структурой, в которую **переезжают** существующие данные связи:

- block-009 `alternating_sets` (чёт/нечёт сеты, `setEnumeration`) → под-режим `parallel` + enumeration данные на детях.
- `pairedWithInnerRowId` (какой inner-row к какой лестнице) → структура `arrangement: parallel` (какие дети-треки интерливятся и как).

Данные не теряются — они меняют носителя (сущность → значение оси). Фаза 5 (исполнение интерлива) опирается именно на них. Точная форма `arrangement: parallel` (как описан интерлив-порядок) — design-detail 10.2 (§7).

---

## §6. `scoring` present-but-inert contract (OQ-3)

- Значения оси `scoring` **валидны и персистятся** при сборке (`amrap`, `for_time`, `max_in_remaining`, `total`, `progressive(seed)`, `prescribed`).
- **Никакой** execution / score-computation логики до фазы 5.
- Громкая декларация инертности — через **тип + тест**, НЕ через комментарий:
  - **Type:** единый источник `ScoringDirective` — чисто data-дескриптор (без методов/исполнения); render-слой принимает его только как display-label.
  - **Test:** guard-тест (напр. `scoring-axis-is-inert.test.ts`), утверждающий, что ни один consumer не вычисляет результат по `scoring` (только хранение + label). Падает, если фаза 5 «протекла» раньше времени.

> Сознательно **без code-комментария**: house rule — no comments in code; тип + тест **enforced**, комментарий гниёт и не ловится CI. Это сильнее, чем «тип/коммент/тест», не слабее — даю инертности зубы, а не прозу.

Цель: следующая сессия видит валидные значения `scoring` и **не** принимает их за наличие исполнения — тип говорит «data-only», тест ловит регресс.

---

## §7. Acceptance gates

Прототип 10.1 проходит **оба** гейта (на моках, coach-POV, Денис-perspective):

1. **Expressiveness** — Денис собирает 3 злейших блока Gauntlet (B/C/D) свободным вложением. Канон — §3 (расширение `analysis/source/` удалено 2026-06-22).
2. **Ergonomics** — он собирает их _быстро_. Это реальный flee/stay-рычаг. Обязательный элемент скоупа прототипа: **дублирование** (неделя/день/блок/узел) — без него гейт меряет build-from-scratch, а не реальный clone-and-tweak воркфлоу Дена = ложно-негативный сигнал.

Провал любого гейта → итерация на моках до бэка, не после.

---

## §8. Work sequence (gated)

| #        | Step                                                                                                                          | Skill                  | Gate                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| **10.0** | **Эта спека** (planner design)                                                                                                | doc                    | **review gate ← СЕЙЧАС**; код после ратификации                                     |
| 10.1     | Compose-конструктор прототип **на моках** — tree canvas + node-inspector (оси) + reuse row-editors + **дублирование**         | `/feature`, UI-first   | coach-walkthrough: §7 оба гейта                                                     |
| 10.2     | Контракты + cut схемы — оси вместо `archetypeId`; `kind`/`family` computed; drop каталог                                      | `/feature`             | `db:reset`, не миграция (non-prod)                                                  |
| 10.3     | Бэк + сид-как-**композиции** (не каталог); endpoints/mappers; derived-label                                                   | `/feature`             | сид-fixture = деревья примитивов                                                    |
| 10.4     | Механический снос — 18 форм + picker + 34-way switch'и (`formatSchemaHeader`/`formatArchetypeParams`); render → derived-label | **отдельный workflow** | старт ТОЛЬКО после: (i) 10.1 walkthrough пройден, (ii) 10.2 схема заморожена (OQ-4) |
| фаза 5   | Scoring/execution-слой — оживить ось `scoring` + условный скоринг + parallel-интерлив                                         | отдельная инициатива   | **OUT этого захода**                                                                |

`/feature` UI-first где есть UI; бюджет ≤1 `/feature`/сессия → растянется на сессии. Снос (10.4) — единственный fan-out-able, туда workflow ложится; остальное — суждение + gate'ы.

---

## §9. Open design details (для build-шагов, не блокеры сейчас)

Не решаются в спеке — решаются в соответствующем шаге, вербатим из источника:

- **Ladder placement** — `repetition: ladder(steps)` на контейнере vs rep-scheme на Row (для parallel-треков с собственными steps). Решение — 10.2 contract design.
- **`arrangement: parallel` shape** — как кодируется интерлив-порядок (round-by-round) + переезд данных §5. Решение — 10.2.
- **Persistence осей** — структурированные колонки vs Json `composition`-блоб на `Schema`. Решение — 10.2. Constraint: что бы ни было — это оси, не archetype-id.
- **Derived `kind`/`family`** — алгоритм label-функции над осями. Решение — 10.3 (render).
- **`super-set` pairs** — внутри-схемная группировка row'ов (ссылки на `SchemaRow`). Решение — 10.2.
- **`trailingConnector`** — fold в `arrangement: ordered` vs keep presentation-hint. Решение — 10.2.

---

## §10. Non-goals / guardrails

- **НЕ** парсим записки Дена (не продукт; возможный будущий ускоритель ввода над моделью).
- **НЕ** мигрируем корпус (юзеров нет, мигрировать нечего).
- **НЕ** строим scoring-исполнение (фаза 5).
- **НЕ** денормализуем derived `kind`/`family` (OQ-1).
- **НЕ** сносим формы/picker до заморозки схемы 10.2 (OQ-4).
- 4th-attempt дисциплина: не торопимся; эта спека — гейт, не черновик. Прошлые попытки падали от слабого дизайна и спешки.
