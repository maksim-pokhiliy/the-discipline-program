# Top-level hierarchy (Phase 4)

Атрибуты Day / Session / Block помимо children-collection. Все имена идентификаторов — English; обсуждение — Russian. Inheritance из решений main session применяется как ground truth (см. §0 ниже).

Уровни ниже недели. Никаких calendar / date / timestamp / day-of-week полей в этой фазе (это координата выше Day, не атрибут Day самого по себе).

---

## 0. Inheritance от main session (ratified ground truth)

Перед атрибутами фиксирую вход:

1. **Multi-labels на block** — `Block.labels: LabelRef[]` (массив, 0..N). Composite `|`-strings из Phase 1 — поверхностное представление, decomposition в `labels-catalog.md`.
2. **Empty body blocks** — `Block.schemas: Schema[]` может быть пустым массивом. Валидное состояние. Не collapse в placeholder.
3. **Lowercase block-labels** (`warm up for feet`, `warm up BEFORE run`, …) — обычные block-labels, модель не различает регистр.
4. **Basic GYMNASTICS vs GYMNASTICS** — distinct library entries. Модель ничего не знает про литералы.
5. **`Temporarily without STRENGTH ENDURANCE`** — instruction-row, не block-label. Содержимое обрабатывается как (implicit)-блок.
6. **Phase 3.3 DPs финальны** (1RM hybrid, live formula + actual_load, explicit bodyweight, compound trailing+override).
7. **Intensity** — sibling VO к Load. Variants: `effort_percent` (value | range), `rpe` (out-of-sample), `pace` (categorical enum). Scope: block / schema / row.
8. **Connector `then:` / `...then...:`** — в body of preceding schema (Phase 2.1).
9. **Movement family** — soft grouping на Exercise.
10. **Workflow rule** — ничего выше Day; Day без calendar attributes.

---

## 1. Day

Контейнер sessions в рамках одного дня (1 календарный day в источнике, но Phase 4 не моделирует календарную координату).

### attributes

- `order: integer` — позиция Day в parent context (выше Day — out-of-scope; conceptually это week / plan).
- `label: LabelRef?` — optional, **single** reference (Day несёт максимум один лейбл).
- `notes: string?` — optional free-text.
- `sessions: Session[]` — children, ordered, 0..N.

### invariants

- Day **не** содержит date / timestamp / dayOfWeek / calendar reference. Календарная координата привязывается на уровень выше (out-of-scope Phase 4).
- `sessions.length === 0` валидно. Соответствует REST DAY pattern (66 occurrences в sample: каждый sheet × THURSDAY + SUNDAY = REST). Тренер вообще может оставить day с label и без sessions — это валидный «пустой день».
- `label` — single, не array. Sample evidence: единственный day-label в sample — `R E S T  D A Y` (66 occurrences), всегда один. Нет случаев multi-label на Day. Гибкость на multi-label не нужна (Day — высокоуровневая категория, тип дня единичен).
- `notes` отсутствует в sample. Атрибут предложен для completeness (будущая возможность free-text заметки от тренера); если main session решит не добавлять — drop, ничего не теряем.

### sample observations

- 1 day-label (`R E S T  D A Y`), 66 occurrences (33 sheets × 2 rest-days).
- Active days (5/7) — без label, общий случай.
- Empty sessions[] на REST days: содержательное тело отсутствует, день помечен label'ом и всё.
- Calendar gaps (6 пропущенных недель в 9-месячном окне, см. inventory edge-cases) — характеристика источника, не свойство Day-уровня; адресуется выше Day в фазе 5/6.

---

## 2. Session

Тренировочная сессия. Контейнер blocks. Workflow.md: 1 session = 1 блок не соблюдается, sessions с разноtypeовыми блоками — норма.

### attributes

- `order: integer` — позиция Session внутри Day. 1+ session per Day теоретически возможен.
- `label: LabelRef?` — optional, **single** reference.
- `notes: string?` — optional free-text.
- `blocks: Block[]` — children, ordered, 0..N.

### invariants

- `label` — single, не array. Sample evidence: единственный session-label — `1ST SESSION` (165 occurrences), всегда один. Нет случаев multi-label на Session. Сессия — высокоуровневая категория, single label достаточно.
- `blocks.length === 0` теоретически валидно (session-placeholder), но в sample не встречается — каждая 1ST SESSION имеет ≥1 блок. Оставляем разрешённым без специального handling.
- В sample каждый active Day имеет ровно 1 session. `2ND SESSION:` / `YOGA SESSION` / `SWIM SESSION` не встречается — но модель должна допускать N sessions per Day. См. edge-case YOGA TIME (sheet-08/15/18 TUESDAY) — borderline случай второй сессии без явного `2ND SESSION:` маркера, классифицирован Phase 1 как block-label.

### sample observations

- 1 session-label (`1ST SESSION`), 165 occurrences (33 sheets × 5 active days).
- Sessions с разнотипными блоками — норма: STRENGTH ENDURANCE + SUCCESSORY WORK + CORE MUSCLES (MONDAY/FRIDAY); Basic GYMNASTICS + PUMP + SUCCESSORY + CORE (WEDNESDAY); warm-up + GYMNASTICS + PUMP + CORE (SATURDAY).
- `PUMP SESSION` — это **block** внутри `1ST SESSION`, не самостоятельная сессия. Лексический сдвиг тренера; классификация по позиции в иерархии, не по имени.

---

## 3. Block

Раздел сессии. Контейнер schemas. Phase 4 — критическое изменение: **labels — массив (0..N)**, optional block-level intensity, empty body разрешён.

### attributes

- `order: integer` — позиция Block внутри Session.
- `labels: LabelRef[]` — **multi-label**, 0..N references. Упорядоченный список (preserves текстовый порядок из composite).
- `intensity: Intensity?` — optional VO. Block-level; применяется ко всем schemas внутри, если schema не переопределяет.
- `notes: string?` — optional free-text.
- `schemas: Schema[]` — children, ordered, 0..N. **May be empty** (per Phase 4 ratification).

### invariants

- `labels.length === 0` валидно. Это (implicit)-блок — обозначает: «контент идёт без явной категории-обёртки». Sample: 75 occurrences (24 unique cards) — типично MONDAY/FRIDAY где content directly после `1ST SESSION:` без block-label, или RUN-дни с warm-up без явного label.
- `labels.length > 1` валидно — multi-label tagging. Sample: 13 instances (12 occurrences `STRENGTH ENDURANCE | Gymnastics` + 1 occurrence `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`). Composite `|`-формы Phase 1 decompose к multi-label assignment (см. `labels-catalog.md`).
- `schemas.length === 0` валидно — empty-body block. Sample: 6 occurrences (1 `STRENGTH ENDURANCE` в sheet-18 MONDAY + 5 `CORE MUSCLES` без двоеточия в sheet-20/23/26/29/32 SATURDAY). Тренер помечает блок label'ом без content — placeholder / интенциональная пауза / forgotten body.
- `intensity` опционален. Если present — scope=block, наследуется в schemas. Если schema несёт собственный intensity → overrides block.intensity для данной schema.
- Composite-label decomposition rules (см. `labels-catalog.md`) — preprocessor от inventory-string к (labels[], intensity, schema-header-prefix).

### multi-labels semantics (ratified)

- **Semantic**: чистое labeling / tagging. Не композиция типа «STRENGTH ENDURANCE + Gymnastics семантически означает strength_with_gymnastics_blend». Тренер addressed обоим категориям как тегам.
- **Order**: значимый для presentation (UI рендерит в порядке assignment, preserves textual order). НЕ load-bearing для бизнес-логики (sort labels алфавитно дал бы тот же контент).
- **Duplicate prevention**: одинаковый Label не может появляться дважды в одном `labels[]` (set semantics на identity, list semantics на presentation).
- **Cross-level dedup**: один Label может быть присвоен Block в одной сессии и тому же Block в другой — это разные block-instances. Library label — один.

### sample observations

- 17 distinct block-labels (canonical, после дедупа case-insensitive). 75 implicit (label-less) instances. 13 multi-label instances.
- 1 instance с block-level intensity (block-055): `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` → `labels=[STRENGTH ENDURANCE, EASY PACE]`, `intensity={ kind: effort_percent, value: 70 }`.
- 6 empty-schemas blocks (`schemas.length=0`).
- Lowercase block-labels (`warm up for feet`, `warm up BEFORE run`, …) — обычные labels.

---

## 4. Intensity VO

Sibling VO к Load (Phase 3.3 §6.5 эскалация ratified). НЕ часть Load discriminator; отдельная VO. Каждый level (block / schema / row) может нести Intensity опционально.

### Variants (discriminated union)

```
Intensity =
  | { kind: "effort_percent", value: N }                  // single percent
  | { kind: "effort_percent", range: { min: N, max: M } } // range percent
  | { kind: "rpe", value: N }                              // RPE 1-10, out-of-sample
  | { kind: "pace", value: PaceEnum }                      // categorical
```

`PaceEnum`: enum (text-based). Sample даёт 1 значение — `easy`. Расширяемое для будущих значений (`moderate`, `hard`, `recovery`, …).

### Scope hierarchy

Block → Schema → Row, с inheritance + override semantics:

1. **Block-level** (`Block.intensity`): применяется ко всем schemas внутри блока. Sample: 1 occurrence — `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` block-055 (combined: `pace=easy` + `effort_percent=70` — но composite case разделён на 2 entries: см. `labels-catalog.md` rule 2 + this section §inheritance edge ниже).
2. **Schema-level** (`Schema.intensity` — Phase 5 решит точное поле, но scope-уровень ratified): применяется ко всем rows внутри schema. Sample: 1 occurrence — `[ 75-80% Effort ]` в первой body row AMRAP 12 min schema (block-078 / schema-1).
3. **Row-level** (`Row.intensity`): per-exercise-row, out of sample. Используется в gym-context для `5 squats @ RPE 8`-стиля prescription.

**Resolution rule** (inheritance):

- Эффективная intensity для row = row.intensity ?? schema.intensity ?? block.intensity ?? null.
- Override implicit: дочерний уровень полностью заменяет родительский (не merge fields).

### Inheritance edge: composite block-label с дополнительной intensity-аннотацией

`STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`:

- `EASY PACE` (categorical pace) → label component, не intensity (см. `labels-catalog.md` decomposition; pace тут treated как separate label, не intensity-VO. Альтернатива: pace=easy как intensity. Решение Phase 4 — pace остаётся label, потому что `EASY PACE` в inventory заявлен как label-имя; `[ 70% EFFORT ]` — отдельная аннотация — intensity).
- `[ 70% EFFORT ]` → `Block.intensity = { kind: effort_percent, value: 70 }`.

Phase 4 расщепляет: `labels=[STRENGTH ENDURANCE, EASY PACE]`, `intensity={kind:effort_percent, value:70}`.

**Альтернатива (рассмотрена, отклонена)**: трактовать `EASY PACE` как intensity (pace=easy), а не label. Тогда `intensity` — multi-axis: pace + effort_percent. Отклонено потому, что:

- Phase 1 канонизировал `EASY PACE` именно как label-имя (не как intensity attribute).
- Intensity discriminated union с одним вариантом за раз проще; multi-axis intensity усложняет модель ради 1 occurrence.
- Coach UX: «pace» как тег прозрачен; mix с numeric effort_percent — путаница.

Phase 4 эскалирует Phase 5: при росте sample (если pace начнёт встречаться часто с numeric intensity на том же level), возможен upgrade pace из label в Intensity variant. См. `edge-cases.md`.

### Sample evidence summary

| location                    | source string                       | parsed                                                              |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| block-055 (block-level)     | `[ 70% EFFORT ]` в block-label      | `intensity = { kind:effort_percent, value:70 }`                     |
| block-078 / schema-1        | `[ 75-80% Effort ]` body первая row | `schema.intensity = { kind:effort_percent, range:{min:75,max:80} }` |
| block-055 (label component) | `EASY PACE`                         | label, не intensity (`pace=easy` — categorical label)               |
| (none in sample)            | —                                   | RPE variant: deferred, no sample evidence                           |

### Не-Intensity модификаторы (NOT в этой VO)

- `[ TOTAL ]` (Phase 3.1 §6.1) — counter-marker, schema-scope, но это про **rep aggregation**, не intensity.
- `[ ONLY ONCE before METCON ]` (Phase 3.1 §6.6) — positional / cyclical modifier, не intensity.
- `[ AFTER each Nth REP - M sec pause ]` (Phase 3.1 §4) — tempo, не intensity.

Эти модификаторы — отдельные attributes на row / schema, не Intensity VO. Phase 5 решит конкретные имена.

---

## 5. Implicit blocks finalization

Phase 1 ratified 75 implicit-block instances (24 unique cards) — content без явного block-label в начале сессии. Phase 4 finalizes:

- `Block.labels = []` (empty array) — **достаточный и единственный** representation для implicit-блока.
- **Нет special marker** (`is_implicit: true`, kind=implicit, отдельный класс) — не нужен. `labels.length === 0` self-evidently означает implicit.
- Inventory category `(implicit)` в `block-instances.md` — это **inventory artifact** для группировки карточек. Не model class, не type tag.
- Tooling / UI может рендерить implicit-блоки спецификой («Без названия» / placeholder text), но это presentation layer, не model.

### Sample evidence

- 75 implicit occurrences (24 unique bodies). Типы:
  - RUN-дни (TUE/SAT): `RUN X km` + warm-up exercises до `warm up for feet:` блока.
  - MONDAY/FRIDAY: EMOM/AMRAP/CHIPPER/INTERVALS схемы directly под `1ST SESSION:` без block-label.
  - Late period: тренер регулярно пропускает `STRENGTH ENDURANCE:` label — content всё равно strength-endurance по смыслу.
- Все 75 fit в простой `labels=[]` representation. Тело — обычные schemas[].

---

## 6. Empty-body blocks finalization

Phase 1 inventory identified 6 empty-body block instances. Phase 4 finalizes:

- `Block.schemas = []` (empty array) — **достаточный и единственный** representation для empty-body.
- **Не collapse** в placeholder, marker-only block, или `schemas: null` sentinel. Пустой массив seamlessly интегрирован.
- UI рендерит block с label'ом без content — coach видит «STRENGTH ENDURANCE [пусто]» и понимает: либо placeholder для будущего content, либо intentional null content.

### Sample evidence

| occurrence          | block-label                    | reason (Phase 1 observation)                                                |
| ------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| sheet-18 / MONDAY   | `STRENGTH ENDURANCE`           | label без тела (block-002). Возможно: пропуск тренера или intentional pause |
| sheet-20 / SATURDAY | `CORE MUSCLES` (без двоеточия) | label-only marker. Все 5 раз — после PUMP SESSION на SATURDAY               |
| sheet-23 / SATURDAY | `CORE MUSCLES`                 | same pattern                                                                |
| sheet-26 / SATURDAY | `CORE MUSCLES`                 | same pattern                                                                |
| sheet-29 / SATURDAY | `CORE MUSCLES`                 | same pattern                                                                |
| sheet-32 / SATURDAY | `CORE MUSCLES`                 | same pattern                                                                |

5 occurrences `CORE MUSCLES` без двоеточия + empty body — устойчивый pattern. Phase 1 рекомендовала классифицировать как «placeholder», Phase 4 ratify: `schemas=[]` достаточно (placeholder semantics не нужна как separate flag).

---

## 7. Workflow rule compliance

Workflow.md правило: «ничего выше Day. Day = pure container с order и optional label». Phase 4 соблюдает:

- **Day** — order + label? + notes? + sessions[]. Никаких date / dayOfWeek / weekIndex / calendar polей.
- **Session** — order + label? + notes? + blocks[]. Аналогично.
- **Block** — order + labels[] + intensity? + notes? + schemas[]. Никаких progression / cycle / phase polей.

Никаких «week_number», «cycle_id», «training_phase» атрибутов в Day / Session / Block. Эти концепты адресуются выше Day (out-of-scope Phase 4).

---

## 8. Open architectural notes (для Phase 5 synthesis)

Не решения, а pointer'ы куда смотреть в Phase 5:

1. **Notes vs annotation**: `notes` на Day / Session / Block — free-text от тренера. Не путать с inline `[ ]` annotations на rows / schemas (which Phase 3 caталог). Notes — high-level комментарий тренера; annotations — structured metadata. Phase 5 ratifies clear separation.
2. **Label library entity** — описана в `labels-catalog.md`. Phase 4 finalizes catalog structure; Phase 5 проектирует library entity (Library.labels[], CRUD operations, etc.).
3. **Intensity ↔ Load relationship** — sibling VO, не nested. Phase 5 решает, где Intensity stored (отдельная column / JSON / nested), но Phase 4 фиксирует concept: not part of Load discriminator.
4. **Schema/Row level Intensity persistence** — Phase 4 говорит про concept (scope hierarchy + resolution rule). Phase 5/6 решает persistence (field on Schema/Row entity, или separate Intensity association).

---

## Summary

| level            | attributes                                     | invariants                                                                                      |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Day**          | order, label?, notes?, sessions[]              | no calendar; empty sessions valid (REST DAY); single label                                      |
| **Session**      | order, label?, notes?, blocks[]                | single label; multi-block норма; empty blocks теоретически валидно                              |
| **Block**        | order, labels[], intensity?, notes?, schemas[] | multi-label (0..N); empty labels = implicit; empty schemas valid; intensity inherits to schemas |
| **Intensity VO** | discriminated: effort_percent (value           | range), rpe (future), pace (enum)                                                               | scope: block / schema / row с inheritance + override |

**Ratified Phase 4 decisions**:

- Multi-labels на Block — массив, не одно значение.
- Empty bodies (schemas[]=[]) — валидное состояние.
- Implicit-блоки (labels[]=[]) — представимы пустым массивом, без специального marker.
- Lowercase labels — обычные labels.
- Single label на Day / Session — sample-supported, не нужна гибкость multi-label.
- Intensity VO — sibling к Load, 3-variant discriminated union (effort_percent / rpe / pace).
- Intensity scope hierarchy: block → schema → row, child overrides parent (no merge).
- `EASY PACE` остаётся label, не intensity variant (decision не блокирует Phase 5 upgrade).
- No calendar / progression / week attributes ниже Phase 4 scope.
