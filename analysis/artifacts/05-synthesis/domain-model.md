# Domain model (Phase 5 synthesis)

Финальная доменная модель тренировочных сессий на естественном языке: entities, value objects, schema kinds + archetypes mapping, special structures, relations + invariants.

Inheritance: все ratified decisions Phase 1-4 + Phase 3.3/Phase 4 correction (Intensity = struct с optional fields) применяются как ground truth.

Scope: не Prisma/TS/Zod (Phase 6). Не calendar/week (out-of-scope per workflow).

Identifiers — English (для будущей формализации в Phase 6). Содержимое — Russian.

---

## §0. Inheritance recap

Перечисляю ratified decisions, чтобы остальные секции не повторяли обоснование:

1. **Hierarchy**: Day ⊃ Session ⊃ Block ⊃ Schema ⊃ (SchemaRow | SubSchema).
2. **Day-label**: single, optional. **Session-label**: single, optional. **Block-labels**: array 0..N, ordered.
3. **Empty body block** (`Block.schemas = []`) валидно. **Implicit block** (`Block.labels = []`) валидно.
4. **Composite block-labels decomposition** Phase 4: Rule 1 (bracket extraction → intensity/time-cap) → Rule 2 (schema-header extraction) → Rule 3 (`|` split).
5. **33 archetypes** ratified (Phase 2.2). 5 kinds: atomic / headerless / nested / named / composite.
6. **Intensity** — struct с **optional fields** `{ effort_percent?, rpe?, pace? }`, sibling VO к Load. Scope: block / schema / row. Inheritance — **partial overlay** (per-field, не full override).
7. **Load DPs** (Phase 3.3 ratified): per-exercise 1RM + movement_family soft grouping (DP1 c); live formula + actual_load (DP2 b); explicit bodyweight variant (DP3 b); trailing applies to compound + per-element override (DP4 a+c).
8. **Movement family** — soft grouping field на Exercise (string), не hard relation.
9. **Compound `+`** — Option (b) decompose + first-class CyclicalCompound + SandwichCompound VO.
10. **`&` composite-named** — atomic Exercise (Option c).
11. **OR-alternative** — first-class `OrAlternative` VO.
12. **Placeholders** — first-class slot + per-set assignment.
13. **Connector lines** (`then:`, `...then...:`, `...then N rounds:`) — в body предыдущей schema (Phase 2.1).
14. **149 canonical exercises** после Phase 3.2 merges.
15. **Labels catalog: Option C** — единый global namespace + soft `applicable_levels` metadata.

---

## §1. Entities catalog (Task 1)

Финальный список entities. Для каждой: purpose (1 предложение), attributes, key relations.

### 1.1 Day

**Purpose**: контейнер sessions в рамках одного календарного дня (календарная координата — out-of-scope Phase 4/5; владелец day-привязки — уровень выше Day).

**Attributes**:

- `id` — identity.
- `order` — позиция Day в parent context (week / plan — out-of-scope).
- `label` — optional single LabelRef.
- `notes` — optional free-text.
- `sessions` — ordered children, 0..N.

**Invariants**:

- `sessions.length === 0` валидно (REST DAY: 66 occurrences в sample).
- Single label (sample evidence: только `R E S T  D A Y`, всегда один).
- Нет даты / dayOfWeek / week index attributes.

**Sample evidence**: 1 label (`REST DAY`), 66 occurrences. Active days (5/7) — без label.

---

### 1.2 Session

**Purpose**: тренировочная сессия — set of blocks выполняемых в рамках одного entry под day.

**Attributes**:

- `id`.
- `order` — позиция внутри Day.
- `label` — optional single LabelRef.
- `notes` — optional free-text.
- `blocks` — ordered children, 0..N.

**Invariants**:

- Single label (sample: только `1ST SESSION`, 165 occurrences).
- `blocks.length === 0` теоретически валидно, в sample не встречается.
- В sample каждый active Day имеет ровно 1 session, но модель допускает N.

---

### 1.3 Block

**Purpose**: раздел сессии — группа schemas объединённых тренерским labelом и/или intent (strength-endurance / pump / core / warm-up).

**Attributes**:

- `id`.
- `order` — позиция внутри Session.
- `labels` — ordered array of LabelRef, 0..N (set semantics: dedup по identity, presentation-order).
- `intensity` — optional Intensity VO (block-level scope, inherits to schemas).
- `notes` — optional free-text.
- `time_cap` — optional TimeCap VO (для `PRACTICE [ 5-10 min ]`-style block-level time hint; см. edge-cases). **Эскалация Phase 4** — финализация Phase 6.
- `schemas` — ordered children, 0..N.

**Invariants**:

- `labels.length === 0` → implicit block (sample: 75 occurrences, 24 unique).
- `labels.length > 1` → multi-label (sample: 13 instances).
- `schemas.length === 0` → empty-body block (sample: 6 occurrences).
- Labels — set по identity (no duplicates), list по presentation.
- Intensity при schemas-inheritance: partial overlay (см. §2.3).
- Composite-string from inventory (Phase 1) decompose через Rule 1/2/3 на инstantiation (preprocessor).

**Sample evidence**:

- 17 distinct labels (canonical, после case-insensitive dedup).
- 1 instance с block-level intensity (block-055).

---

### 1.4 Schema

**Purpose**: единица «как это исполняется» внутри Block — паттерн (ladder / sets×reps / EMOM / AMRAP / for-time / flat-list / single-line / parallel-ladders / ...).

**Attributes**:

- `id`.
- `order` — позиция внутри Block.
- `kind` — discriminator: `atomic` | `headerless` | `nested` | `named` | `composite`.
- `archetype` — reference на Archetype (34 catalog после Phase 7).
- `header` — string? (null для headerless; для остальных — текст header'а из Phase 2.1 ratified формы). **Для named-exercise-program archetype (Q11 Phase 7.1) — optional display override**: null → fallback `displayHeader = exercise.canonicalName + ":"`; non-null → bare display override (e.g., block-008 sample: `"Bulgarian split squats:"` поверх concrete sibling `DB Bulgarian split squats`). Algorithm — `06-formalization/implementation-notes.md` §3.13.
- `archetype_params` — archetype-specific параметры (см. §3).
- `intensity` — optional Intensity VO (schema-level scope, inherits to rows).
- `body` — union: ordered SchemaRow[] (для atomic / headerless / named / composite) **или** ordered SubSchema[] (для nested).
- `trailing_connector` — optional ConnectorMarker (`then:` / `...then...:` / `...then N rounds:`; per Phase 2.1 — хранится в конце body предыдущей schema).

**Invariants**:

- `kind === 'nested'` ↔ body содержит SubSchema[], не SchemaRow[]. Mutually exclusive.
- `kind === 'headerless'` → `header === null`. Иначе `header` — non-empty string.
- `kind === 'named'` → `header` содержит имя exercise / theme (per Phase 2.2 archetype-named-themed-sets / -exercise-program).
- `kind === 'composite'` → `header` содержит `|`-separator с count + rest-spec / interval-cadence.
- Sub-schema всегда `kind === 'atomic'` (per archetype-emom-sub-minute-slot + Phase 2.1 emom case). Time-window-outer / nested-rounds-over-\* — sub-schemas могут быть atomic или headerless (см. block-010 sub-1).
- `archetype` consistent с `kind` (см. §3 mapping table).
- Intensity inheritance: row.effective = row.intensity ⊕ schema.intensity ⊕ block.intensity (partial overlay per Phase 4 correction).

**Sample evidence**: 337 schemas total (312 top-level + 25 sub).

---

### 1.5 SubSchema

**Purpose**: вложенная schema внутри nested schema. Структурно — instance of Schema, но позиционирована внутри outer `body`.

**Attributes**: тот же набор что у Schema, но семантически `order` нумерует sub-positions (sub-1, sub-2, ...).

**Invariants**:

- Parent schema `kind === 'nested'`.
- SubSchema sам по себе не может быть nested (одноуровневое вложение — sample не показывает deeper, и архетипы не определяют).

**Sample evidence**: 25 sub-schemas total.

**Реализация**: концептуально SubSchema = Schema; различие — позиционирование. Phase 6 может моделировать как self-reference Schema (`parent_schema_id?`) либо как distinct entity. Phase 5 ratify: те же attributes, одна shape.

---

### 1.6 SchemaRow (discriminated union)

**Purpose**: per-row primitive внутри schema body (для non-nested schemas).

**Subtype discriminator** (`row_kind`):

#### 1.6.1 ExerciseRow

- `kind = "exercise"`.
- `exercise` — reference на Exercise (atomic) **или** embedded CompoundRow / CyclicalCompound / SandwichCompound / OrAlternative VO (см. §4).
- `reps` — RepNotation VO (см. §2.4).
- `load` — optional Load VO (см. §2.1).
- `side` — optional PerLimbDistribution VO (см. §2.6).
- `tempo` — optional TempoModifier VO (см. §2.7).
- `position` — optional PositionEquipmentModifier enum (см. §2.10).
- `sequence` — optional SequenceIndicator VO (см. §2.9).
- `intensity` — optional Intensity VO (row-scope, out-of-sample в practice но model-ready).
- `media` — optional MediaReference VO (см. §2.13).
- `compound_rep` — optional CompoundRepDefinition VO (см. §2.5).
- `notes` — optional free-text для cases hybrid (singleton clarifications: `kind of wall balls`, `emphasis on the gluteal muscles`, multi-stage arm programs).

#### 1.6.2 InlineRestRow

- `kind = "rest"`.
- `text` — нормализованная rest-spec (`5 min`, `90 sec`, `until recovery`).
- `scope` — `between_sets` | `between_rounds` | `between_intervals` | `after_specific_set` (с index).
- `raw` — оригинальная строка (для cases like `- 5 min rest AFTER 3RD SET -`).

**Sample evidence**: 71 occurrences, 17 distinct strings.

#### 1.6.3 FootnoteRow

- `kind = "footnote"`.
- `marker` — `*` | `**`.
- `target` — `each_round` | `each_set` | `each_typed_round` (per Phase 3.1 §6.6).
- `content` — embedded compound row (e.g., `30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK`).

**Sample evidence**: 7 occurrences (см. Phase 3.1 §14).

#### 1.6.4 StandaloneLoadRow

- `kind = "standalone_load"`.
- `load` — Load VO.
- `scope` — `applies_to_all_preceding_rows` (per Phase 3.3 §1.9).

**Sample evidence**: 2 occurrences (block-005 / schema-2, block-077 / schema-1).

#### 1.6.5 StandaloneUrlRow

- `kind = "standalone_url"`.
- `url` — string.
- `wrapped` — bool (`[ URL ]` vs bare URL).
- `applies_to` — `previous_exercise_row` (default) | `whole_schema` (для block-149 warm up for feet / block-147 YOGA TIME).

**Sample evidence**: 52 lines (50 `[ URL ]` + 2 bare).

#### 1.6.6 PlaceholderRow

- `kind = "placeholder"`.
- `placeholder_kind` — `muscle_group_reference` | `purpose_category` | `coach_choice_slot`.
- `text` — placeholder identifier (`biceps / triceps`, `ANY exercise for ABS`, `*DB exercise`).
- `per_set_assignments` — optional PerSetSubstitution VO (когда раскрывается следующим annotation row).
- `paired_concrete` — optional reference на concrete ExerciseRow (для cases `ANY exercise for ABS + DB seated good morning`).

**Sample evidence**: 6 placeholder-rows + 2 per-set-substitution placeholders.

#### 1.6.7 InnerLadderMarkerRow

- `kind = "inner_ladder_marker"`.
- `steps` — array of integers (e.g., `[36, 28, 20]`).
- `pairs_with_next_row` — semantic flag (marker всегда associated с следующей exercise row в parallel-ladders archetype).

**Sample evidence**: 38 body-line occurrences (в ~15 schemas).

**Note**: эта row-type существует только внутри `archetype-parallel-ladders-*` и `archetype-parallel-pyramids` body. В nested archetypes (`archetype-nested-rounds-over-parallel-ladder`) — inner ladder marker лежит в sub-schema headerless body.

#### 1.6.8 RepDefinitionRow

- `kind = "rep_definition"`.
- `equality` — CompoundRepDefinition VO с inline-equality form (`5 reps = 1 rep [ composite ]`).

**Sample evidence**: 1 occurrence (block-043 `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]`).

**Note**: отличается от inline `compound_rep` field на ExerciseRow (форма curly-brace `{ ... = 1 rep }`) — здесь rep-definition сам по себе independent row.

#### 1.6.9 ConnectorRow

- `kind = "connector"`.
- `form` — `then:` | `...then...:` | `...then_N_rounds`.
- `rounds_count` — integer (если form = `...then_N_rounds`).

**Note**: per Phase 2.1, connector хранится в конце body предыдущей schema. Альтернативная trabajo: вместо отдельной row — это `Schema.trailing_connector` field. **Решение Phase 5**: ConnectorRow — explicit row на хвосте body (одна строка, последняя). Это симметрично с `then:` и `...then N rounds:` continuation, упрощает iteration. Phase 6 решает persistence (отдельная row vs nullable field).

---

### 1.7 Exercise

**Purpose**: упражнение как сущность в catalog'е (тренер управляет library). Intrinsic identity для всех use-site occurrences.

**Attributes** (intrinsic, per Phase 3.2):

- `id`.
- `canonical_name` — нормализованное имя.
- `primary_equipment` — enum: `assault_bike` | `atlas_stone` | `band` | `barbell` | `bodyweight` | `box` | `box_or_sofa` | `dumbbell` | `jump_rope` | `kettlebell` | `mixed` | `parallel_bars` | `rings` | `row_erg` | `ski_erg` | `sled` | `sofa` | `unknown` | `yoke` (Phase 7 Ext 6 / Q21 — additions: `assault_bike`, `atlas_stone`, `jump_rope`, `row_erg`, `ski_erg`, `sled`, `yoke` для professional CrossFit / strongman).
- `movement_type_tag` — primary enum: `squat` | `hinge` | `press` | `pull` | `lunge` | `carry` | `locomotion` | `static_hold` | `rotational` | `cardio_flow` | `core` | `combined_olympic` | `raise` | `extension` | `unknown`. Optional secondary tag для compound names.
- `default_demo_url` — optional URL string (per ≥80% stability rule, Phase 3.2).
- `canonical_compound_type` — enum: `atomic` | `compound_plus` | `composite_named` | `placeholder` | `alternative_or`.
- `placeholder_flag` — bool (если canonical_compound_type = placeholder).
- `movement_family` — optional string (soft grouping, e.g., `"snatch"`, `"clean"`, `"hspu"`). Не FK на entity; UX-помощник для 1RM suggestion и grouping (DP1 c hybrid).
- `default_load` — optional Load VO (intrinsic fallback weight — для weighted-implicit cases; UI prompts если absent). Per Phase 3.3 §2 / DP3.
- `aliases` — informational, ratified merges от Phase 3.2.
- `notes` — optional free-text для library management.

**Invariants**:

- Если `primary_equipment ∈ {bodyweight, band, parallel_bars, rings}` → `default_load.kind === "bodyweight"` либо absent. Не absolute weight intrinsic.
- Если `placeholder_flag === true` → `canonical_compound_type === "placeholder"`, имя начинается с `*` или содержит `ANY exercise for X`.

**Sample evidence**: 149 canonical exercises после Phase 3.2 merges (168 raw − 19 merged).

---

### 1.8 Label

**Purpose**: единичный тег для Day / Session / Block. Per Phase 4 Option C: единый global namespace + soft applicable_levels.

**Attributes**:

- `id`.
- `name` — human-readable, case-insensitive unique в library.
- `applicable_levels` — non-empty set из `{day, session, block}` (advisory hint, не enforced).
- `notes` — optional library-level description.

**Invariants**:

- Name dedup case-insensitive.
- `applicable_levels.size >= 1`.
- Removal blocked если `references_count > 0` (cascade-confirm в UI).

**Sample evidence**:

- 1 day-label (`REST DAY`).
- 1 session-label (`1ST SESSION`).
- 17 block-labels canonical (после composite decomposition — растёт до ~19 если считать `EASY PACE` и т.п. как separate labels per Phase 4 Rule 3).
- 0 cross-level name collisions.

---

### 1.9 Archetype

**Purpose**: catalog 33 структурных архетипов schemas (Phase 2.2). Используется как library reference; coach при создании schema выбирает archetype, system применяет invariants.

**Attributes**:

- `id`.
- `name` — kebab-case identifier (`n-rounds`, `ladder-descending`, `parallel-ladders-descending`, ...).
- `kind` — enum: `atomic` | `headerless` | `nested` | `named` | `composite` (matches Schema.kind).
- `family` — informational: `rounds_sets` | `ladder` | `time_cap` | `composite_rounds` | `nested` | `named` | `single_line_headerless` | `flat_parallel_headerless` | `modality_reference`.
- `header_pattern_description` — текстовое описание формы header'а (для UI doc).
- `body_layout_description` — текстовое описание body layout.
- `archetype_params_schema` — список parameter names (определяет какие `archetype_params` поле на Schema entity должно содержать; см. §3).
- `related_archetypes` — graph с типами relations: `specialization_of` | `paired_with` | `continuation_of` | `extension_of` | `contained_by` | `contains`.
- `cardinality_in_sample` — int (для analytics, не invariant).
- `notes` — optional.

**Sample**: 33 archetypes Phase 1-6 (см. `02-patterns/schema-archetypes.md` для полного списка) + **1 Phase 7 addition** `super-set` (Ext 5 / Q20) = 34 catalog total. 8 singletons (cardinality=1 в sample), 3 block-singletons (cardinality=2 в одном blocke). super-set — Phase 7 hypothetical (beyond sample).

---

### 1.10 Athlete

**Purpose**: пользователь, для которого создаётся сессия. Источник 1RM records, actual performance, profile-зависимых resolver'ов (dual-value, RX/SC).

**Attributes**:

- `id`.
- `display_name` — human-readable.
- `profile_attributes` — Map<string, Value> (для future resolver: sex / level / RX-SC tier — deferred per Phase 3.3 §1.6).

**Invariants**: minimum viable. Phase 5 не финализирует полный profile shape (Phase 6 / future).

**Sample evidence**: не моделируется в sample (1 athlete implicit). Out-of-sample модели — gym programs с N athletes.

---

### 1.11 OneRMRecord

**Purpose**: 1RM запись athlete для конкретного exercise. Используется для resolution `Percentage` Load variant.

**Attributes**:

- `id`.
- `athlete` — reference на Athlete.
- `exercise` — reference на Exercise (per DP1 option c — per-exercise primary).
- `value_kg` — number.
- `recorded_at` — timestamp.
- `source` — enum: `manual` | `auto_inferred` | `tested`.

**Invariants**:

- `(athlete, exercise)` — uniqueness либо most-recent (Phase 6 ratifies).
- Phase 3.3 DP1 c: `exercise` — primary FK; `movement_family` соседствует для smart-default (если athlete не имеет 1RM для `DB Snatches`, smart UI suggests 90% от `barbell snatch` 1RM из same `snatch` family).

**Sample evidence**: 0 в sample (домашняя тренировка, absolute weights only). Модель ready beyond sample.

---

### 1.12 PerformedSession

**Purpose**: запись об actual выполнении planned Session. Хранит actual_load + completion notes (per Phase 3.3 DP2 b: prescription = live formula, performance = recorded отдельно).

**Attributes**:

- `id`.
- `session` — reference на planned Session.
- `athlete` — reference на Athlete.
- `started_at` / `completed_at` — timestamps.
- `actual_rows` — ordered array of PerformedExerciseInstance (см. ниже).
- `coach_notes` / `athlete_notes` — optional free-text.

**Invariants**:

- 1:1 (или 1:0..1) с Session — каждое выполнение генерирует one PerformedSession. Если атлет переделывает session — open question, treat as new entry или versioned (deferred to Phase 6).
- `actual_rows` повторяют структуру Session (block × schema × row), но per-row хранят `actual_load` / `actual_reps` / `notes` (не полную rebuild structure).

---

### 1.13 PerformedExerciseInstance

**Purpose**: per-row выполненная нагрузка внутри PerformedSession. Привязана к concrete ExerciseRow planned Session.

**Attributes**:

- `id`.
- `performed_session` — reference.
- `planned_row_ref` — pointer на ExerciseRow planned (через block_id + schema_id + row_order).
- `actual_load` — Load VO (resolved at performance time).
- `actual_reps` — RepNotation VO (для MAX-cases — concrete number).
- `actual_intensity` — optional Intensity VO (если athlete recorded RPE, etc.).
- `notes` — free-text.

**Invariants**:

- planned_row_ref должен существовать на момент создания.
- Если planned ExerciseRow содержит `compound_rep` или per-set program — actual_rows может иметь sub-records (per-stage actual_load). Phase 5 ratify: для drop-set / per-set-substitution / compound-rep — actual instance расширяется sub-array `stage_actuals[]`. Phase 6 финализирует shape.

---

### 1.14 Catalog summary

| Entity                    | Cardinality                              | Owner            | Notes                                                        |
| ------------------------- | ---------------------------------------- | ---------------- | ------------------------------------------------------------ |
| Day                       | 1..N per parent                          | week / plan      | order, label?, notes?, sessions[]                            |
| Session                   | 0..N per Day                             | Day              | order, label?, notes?, blocks[]                              |
| Block                     | 0..N per Session                         | Session          | order, labels[], intensity?, notes?, time_cap?, schemas[]    |
| Schema                    | 0..N per Block                           | Block            | kind, archetype, header?, archetype_params, intensity?, body |
| SubSchema                 | 0..N per Schema (nested only)            | Schema (parent)  | те же attributes                                             |
| SchemaRow                 | 0..N per Schema (non-nested) / SubSchema | Schema/SubSchema | discriminated union по row_kind                              |
| Exercise                  | library                                  | global library   | intrinsic catalog (149 canonical)                            |
| Label                     | library                                  | global library   | unified namespace + applicable_levels                        |
| Archetype                 | library                                  | global library   | 34 catalog (33 Phase 1-6 + super-set Phase 7)                |
| Athlete                   | 1..N per system                          | system           | profile attributes                                           |
| OneRMRecord               | 0..N per (Athlete, Exercise)             | Athlete          | per-exercise, with movement_family fallback                  |
| PerformedSession          | 0..1 per (Session, Athlete)              | Athlete          | actual outcomes                                              |
| PerformedExerciseInstance | per planned row                          | PerformedSession | actual_load / reps / intensity                               |

**Movement family** — string field на Exercise, **не** отдельная entity (см. §1.7 + edge-cases для обоснования). Phase 6 может upgrade в entity при росте sample (5-15 families became >>15).

---

## §2. Value objects (Task 2)

VO embedded inside entities (no separate identity). Discriminated unions используются где variants структурно различны.

### 2.1 Load (discriminated union)

Per Phase 3.3 ratified DP3 b — `bodyweight` explicit. DP1 c — Percentage с per-exercise reference + movement_family soft fallback.

**Variants**:

#### 2.1.1 Absolute

- `kind = "absolute"`.
- `weight` — Weight VO (§2.2).
- Sample: 100% sample weight notations.

#### 2.1.2 Percentage

- `kind = "percentage"`.
- `value` — number (single percent) **или** `range` — `{ min, max }`.
- `reference` — `{ scope: "self" | "movement_family" | "other_exercise", target_exercise_id? }`.
  - `self`: 1RM атлета на тот же exercise (default).
  - `movement_family`: 1RM на family (`snatch` / `clean` / ...).
  - `other_exercise`: cross-exercise reference (`60% of back squat 1RM`).
- Sample: 0 (gym extension out-of-sample).
- Model-ready per DP1 c.

#### 2.1.3 Bodyweight

- `kind = "bodyweight"`.
- Не несёт numeric weight.
- Sample: ~250 occurrences (Exercise.primary_equipment ∈ {bodyweight, band, parallel_bars, rings}).
- Per DP3 b: explicit variant, не null.

#### 2.1.4 Negative (drop-stage)

- `kind = "without_weight"`.
- Контекст — drop-set final stage (`EXPLODE / WITHOUT WEIGHT`).
- Sample: 9 occurrences (Bulgarian split squats drop-set program).
- **Discussion**: можно унифицировать с `bodyweight` (Phase 3.3 §5.1 предположение). Phase 5 ratify: оставляем distinct. Reason — semantic difference: bodyweight = inherent equipment property exercise, without_weight = explicit drop-decision внутри weighted exercise's program. Сливать = терять differentiation в drop-set semantics.

#### 2.1.5 Unspecified

- `kind = "unspecified"`.
- Used для weighted-implicit cases (Exercise weighted, но row не несёт annotation, и default_load на Exercise absent).
- Sample: ~28 occurrences (DB Renegade row, weighted-implicit cases). Падает через fallback chain: row.load → standalone_load_in_schema → exercise.default_load → unspecified (UI prompts coach).

#### 2.1.6 RPE-based (deferred)

- `kind = "rpe"`.
- `value` — number 1-10.
- Phase 4 / Phase 5 hold: **per workflow correction, RPE = Intensity field, не Load variant** (§2.3). Drop из Load union.

**Финальный Load discriminator**: 5 variants (`absolute` / `percentage` / `bodyweight` / `without_weight` / `unspecified`).

---

### 2.2 Weight (sub-VO внутри Load.Absolute)

Per Phase 3.3 §5.1 catalog 11 variants. Финальный список:

#### 2.2.1 single

- `value_kg: number`.
- Sample: `[ 15 kg ]` (18), `[ 24 kg ]` (19).

#### 2.2.2 dual

- `value_kg: number`, `paired: true`.
- Sample: `[ 2x 15 kg ]` (157), `[ 2x15 kg ]` (6 typo-variant, нормализован).

#### 2.2.3 single_arm

- `value_kg: number`, `single_arm: true`.
- Sample: `[ 1x 15 kg ]` (14).

#### 2.2.4 compound_device

- `equipment: enum(DB|KB|...)`, `count: 1|2`, `value_kg: number`.
- Sample: `[ DB 2x 15 kg ]` (19), `[ DB 1x 15 kg ]` (9).

#### 2.2.5 split_tier

- `stages: Array<{ reps: number, equipment: string, value_kg: number }>`.
- Sample: `[ 5 KB 24 kg + 10 DB 15 kg ]` (6, single arm row).

#### 2.2.6 dual_value

- `first: Weight`, `second: Weight`, `resolver: "athlete_profile"`.
- Sample: `[ 50/30 kg ]` (1, block-003 overhead squats).
- Resolution deferred per Phase 3.3 §1.6. Phase 6 may finalize concrete profile attribute.

#### 2.2.7 with_asymmetric_arm

- `value_kg: number`, `working_arm: "left"|"right"`, `passive_arm_action: enum`.
- `passive_arm_action` enum: `hold_in_up` | `hold_with_extra_weight` (specifying additional KB / DB hold).
- Sample: `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]` (4, block-123), `[ another ARM HOLD DB in UP ]` (3), `[ another ARM HOLD KB 24 kg in UP ]` (1).

#### 2.2.8 with_depth_modifier

- `value_kg: number`, `depth: enum("to_parallel"|"full_rom"|...)`.
- Sample: `[ 24 kg | to the parallel ]` (1, block-189).

---

### 2.3 Intensity (struct с optional fields)

**Phase 3.3 / Phase 4 correction**: НЕ discriminated union, а struct с optional fields. Partial overlay inheritance — каждое поле наследуется independently.

**Structure**:

- `effort_percent` — optional: `{ value: number }` **или** `{ range: { min, max } }`.
- `rpe` — optional: `{ value: number }`. Deferred (out-of-sample, model-ready).
- `pace` — optional: enum `easy` | `moderate` | `hard` | `recovery` (extensible).
- `hr_zone` — optional: `{ zone: "Z1" | "Z2" | "Z3" | "Z4" | "Z5" }` (Phase 7 Ext 1 / Q16). Endurance / aerobic prescriptions. Athlete-specific BPM резолвится через `Athlete.profile_attributes.hr_max` placeholder; модель не хранит абсолютные BPM.
- `numeric_pace` — optional: `{ value: "MM:SS" string, distance_unit: "km" | "mi" | "m" | "yd" | "lap", pace_type: "min_per_distance" | "distance_per_min" }` (Phase 7 Ext 2 / Q17). Run / row / swim interval prescriptions. Default `pace_type = "min_per_distance"`.

**Scope**: block / schema / row.

**Inheritance** (partial overlay):

```
effective.effort_percent = row.effort_percent ?? schema.effort_percent ?? block.effort_percent ?? null
effective.rpe            = row.rpe            ?? schema.rpe            ?? block.rpe            ?? null
effective.pace           = row.pace           ?? schema.pace           ?? block.pace           ?? null
effective.hr_zone        = row.hr_zone        ?? schema.hr_zone        ?? block.hr_zone        ?? null
effective.numeric_pace   = row.numeric_pace   ?? schema.numeric_pace   ?? block.numeric_pace   ?? null
```

**Note**: это переопределяет hierarchy.md §4 (full override). Phase 5 ratify per workflow brief: partial overlay позволяет block-055 case `{ pace: easy, effort_percent: 70 }` собираться из двух раздельных слотов label / bracket-annotation.

**Sample evidence**:

- block-055: `EASY PACE` + `[ 70% EFFORT ]` → block.intensity = `{ effort_percent: { value: 70 }, pace: "easy" }`.
  - **Note**: pace=easy теперь не отдельный label (отход от hierarchy.md decision), а pace field intensity. Тоже под Rule 1 decomposition: `EASY PACE` parsed → intensity.pace = easy. Labels остаются `[STRENGTH ENDURANCE]`. **Эскалация**: Phase 4 hierarchy.md ratified pace как label; workflow brief переопределил pace как intensity field. Phase 5 принимает overrideный вариант (см. edge-cases для трекинга).
- block-078 / schema-1: `[ 75-80% Effort ]` → schema.intensity = `{ effort_percent: { range: { min: 75, max: 80 } } }`.
- Phase 7 hypothetical: Z2 endurance run → block.intensity = `{ hr_zone: { zone: "Z2" } }`. 500m row pace target → block.intensity = `{ numeric_pace: { value: "1:50", distance_unit: "m", pace_type: "min_per_distance" } }`.

---

### 2.4 RepNotation (discriminated union)

Per Phase 3.1 §2:

**Variants** (`rep_notation_kind`):

#### 2.4.1 count

- `value: number`.
- Sample: 684 rows.

#### 2.4.2 range

- `min: number`, `max: number`.
- Sample: 25 rows.

#### 2.4.3 unit_bound

- `value: number` **или** `range: { min, max }`.
- `unit`: `sec` | `min` | `km`.
- Sample: 14 rows.

#### 2.4.4 max

- `sub_form`: `bare` | `progressive` | `in_remaining_time`.
- `progressive_seed` — string (e.g., `"1-2-3-4-5 etc."`) для `progressive`.
- `target_exercise_ref` — Exercise reference для `in_remaining_time` variants.
- Sample: 4 occurrences (3 sub-forms).

#### 2.4.5 implicit

- Без value — наследуется из outer ladder marker / schema header.
- Sample: 141 rows.
- Resolution: parser смотрит на ближайший `InnerLadderMarkerRow` выше **или** на schema's `archetype_params.steps`.

#### 2.4.6 total_flag

- `value: number`, `total: true`.
- Marker `[ TOTAL ]` — overall counter, не per-round.
- Sample: 4 occurrences (block-102, 104, 113, 114 — `30 strict HSPU [ TOTAL ]`).

#### 2.4.7 compound_rep_unit

- Когда rep = composite action (через CompoundRepDefinition VO §2.5).
- Sample: 2 + 1 = 3 occurrences.

---

### 2.5 CompoundRepDefinition

Per Phase 3.1 §11, §12. Определяет «что считается за 1 rep».

**Variants** (`definition_form`):

- `curly_brace`: `{ <composite> = 1 rep }` trailing inline на row.
  - Sample: 2 occurrences, 1 pattern (`{ 1 push up + each arm row = 1 rep }` — DB Renegade row, block-125, 138).
- `inline_equality`: row-line `N reps = 1 rep [ <composite> ]`.
  - Sample: 1 occurrence (block-043 `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]`).

**Structure**:

- `total_reps` — number (`5` reps в inline_equality form; `1` rep в curly).
- `composition` — описание composite action: array of `{ exercise_ref / count }` (для inline form: `[{ HS walk, 1 }, { strict HSPU, 2 }]`).

---

### 2.6 PerLimbDistribution

Per Phase 3.1 §6.2.

**Variants** (`distribution_kind`):

- `each_leg` — total reps applies per leg.
- `each_arm` — total reps applies per arm.
- `explicit_split` — `{ side: "left" | "right" }` (используется на paired-rows, e.g., block-043 `[ LEFT arm ]` / `[ RIGHT arm ]`).

**Optional fields**:

- `count_per_limb` — explicit numeric (для `[ 5 each leg ]`).
- `LEFT_RIGHT_pair` — bool (если paired rows используются в одной schema, обе rows связаны).

**Sample evidence**: ~180 occurrences (each leg 105, each arm 45, LEFT/RIGHT pairs 20+).

---

### 2.7 TempoModifier

Per Phase 3.1 §6.5 + Phase 7 Ext 3 / Q18.

**Structure** (struct с optional fields):

- `pause_in_up` — `{ duration_sec: number, position: "up" }` (sample variants: 1 sec, 2 sec, with/without `position` keyword).
- `per_nth_rep_pause` — `{ every_n: number, pause_sec: number }` (`AFTER each 5th REP - 5 sec pause`).
- `slow_eccentric` — `{ duration_sec: number }` (`2 sec SLOW down`).
- `hold_after_last` — `{ duration_sec: number }` (`15 sec HOLD after LAST`).
- `full_tempo` — `{ eccentric: int, pause_bottom: int, concentric: int, pause_top: int }` (Phase 7). 4-digit Olympic / accessory tempo notation `3-1-2-0` (seconds). `"X"` (eXplosive) sub-position = 0 sec.

**Composition**: row может нести несколько tempo modifiers одновременно (sample не показывает combination, но struct shape позволяет). `full_tempo` typically не комбинируется с `pause_in_up` / `slow_eccentric` (они — projections от full_tempo формы), но модель не запрещает.

---

### 2.8 PositionEquipmentModifier (enum)

Per Phase 3.1 §6.3. Closed enum (extensible через library catalog в Phase 6).

**Values**: `neutral_grip` | `from_sofa` | `from_box` | `from_box_or_sofa` | `from_sofa_box` | `without_bench` | `without_jump` | `hold_farm_carry` | `hand_on_db` | `hands_on_db` | `hand_on_db_neutral_grip` (composite).

**Sample evidence**: ~60 occurrences, 11 distinct values.

---

### 2.9 SequenceIndicator

Per Phase 3.1 §6.6.

**Variants**:

- `before_named` — `{ target_label: string }` (`before BAR DIPS complex`).
- `after_named` — `{ target_label: string }` (`after BAR DIPS complex`).
- `before_named_after_named_composite` — `{ before_label, after_label }` (`after BAR DIPS complex and before NEXT block`).
- `only_once_before` — `{ target_label: string }` (`ONLY ONCE before METCON`).
- `after_each_round` — без params.
- `after_each_typed_round` — `{ type: string }` (`after each GYMNASTICS round`).

**Sample evidence**: 19 occurrences, 6 distinct.

---

### 2.10 StagedProgram (Phase 7 rename, ex-DropSetProgram)

Per Phase 3.1 §9 + Phase 7 Ext 4 / Q19. Используется внутри `archetype-named-exercise-program` schemas (Bulgarian split squats — legacy; wave loading, cluster sets — Phase 7 extensions).

Phase 7 rename DropSetProgram → StagedProgram, generalize через discriminator `program_kind`. Phase 5 ratify Phase 6 tentative naming.

**Structure**:

- `program_kind` — discriminator: `"drop_set"` | `"wave"` | `"cluster"` (Phase 7 addition).
- `stages` — ordered Array of `Stage` (см. ниже).
- `sets_count` — optional number (e.g., 3). Relevant для `drop_set` + `cluster` (outer set count).
- `stage_count_per_set` — optional number. Relevant для `drop_set` + `cluster`.
- `separator_form` — optional `"...then..."` (drop-set legacy literal).
- `media_per_stage` — optional Map<int, MediaReference>.
- `rest_between_stages` — optional `RestSpec` (Phase 7 addition). Cluster intra-cluster pause; wave inter-set rest.

**Stage** (sub-VO):

- `reps` — `number | RepNotation`.
- `load` — optional `Load` (override per stage; для wave / drop-set weight change).
- `indicator` — optional enum `"explode" | "without_weight"` (existing semantic, formalized in Phase 7).
- `label` — optional string (display, e.g. legacy `"EXPLODE"`).
- `media` — optional `MediaReference`.

**Semantic per program_kind**:

- `drop_set` (legacy Bulgarian split squats): outer N sets × inner stage progression с decreasing weight.
- `wave` (Phase 7): stages = sequential sets с varying weight (e.g., snatch 3 sets @ 70/80/90%). No outer repetition.
- `cluster` (Phase 7): outer N sets × cluster mini-stages (intra-cluster rest), e.g., strict pull-ups 5×[3+3+3].

**Sample evidence**: 9 occurrences (drop_set Bulgarian split squats x5/x7 reps variants). Wave / cluster — Phase 7 hypothetical (beyond sample, для professional CrossFit programming).

---

### 2.11 PerSetSubstitution

Per Phase 3.1 §8. Используется когда placeholder row раскрывается annotation row с per-set mapping.

**Structure**:

- `placeholder_name` — string (`*DB exercise`, `* Burpee variation`).
- `assignments` — Array of `{ set_index: number, exercise_ref / inline_compound: ... }`.

**Sample evidence**: 2 occurrences (block-020, 021).

---

### 2.12 OrAlternative

Per Phase 3.1 §5 + Phase 3.2 ratified Option (first-class).

**Structure**:

- `primary_exercise` — Exercise reference.
- `primary_reps` — RepNotation VO.
- `alternative_exercise` — Exercise reference.
- `alternative_reps` — RepNotation VO.
- `purpose` — enum (advisory): `scale_down` (e.g., bar dips → push ups) | `equipment_substitute` | `coach_choice`.

**Sample evidence**: 3 distinct rows in body (all bar dips ↔ push ups). 1 singleton inline `[ push press OR push jerk ]` — within annotation, treated как technique-choice (modeled как `OrAlternative` внутри `compound_rep` или sub-row, depending on context).

---

### 2.13 MediaReference

Per Phase 3.1 §13. First-class entity (refers к URL + position + label + applies-to).

**Structure**:

- `url` — string.
- `position` — enum: `inline` (на той же row как exercise) | `standalone_row` (отдельная row, `[ URL ]` или bare) | `bare` (без `[ ]` wrapper).
- `label` — optional string (`EXPLODE:` для labeled URLs, sample: 9 occurrences).
- `applies_to` — enum: `previous_row` (default для standalone) | `current_row` (inline) | `whole_schema` (для block-149 warm up for feet — 2 bare URLs на entire schema) | `drop_stage` (для `EXPLODE:` внутри Bulgarian split squats stages).

**Sample evidence**: ~374 total URL references (322 inline + 50 standalone `[ URL ]` + 2 bare).

---

### 2.14 TimeCap (для PRACTICE-style блоков)

Per Phase 4 §case-time-cap-on-label.

**Structure**:

- `min` — number.
- `max` — optional number (для range `5-10 min`).
- `unit` — `min` | `sec`.

**Scope**: block-level (для labels вида `PRACTICE [ 5-10 min ]`).

**Sample evidence**: 2 occurrences (block-146 only).

**Status**: ratified Phase 5 как block-attribute (см. Block §1.3 `time_cap`). Не Intensity, не Load — отдельный block-level temporal hint.

---

### 2.15 CyclicalCompound

Per Phase 3.2 ratified compound option (b) + first-class structure для repeated-pattern compounds.

**Structure**:

- `primary_element` — Exercise reference (`traverses`).
- `secondary_element` — Exercise reference (`bar dips`).
- `cycles` — Array of `{ primary_reps?: number, secondary_reps: number }`. Primary reps часто implicit (traverses имеет implicit count в sample).
- `optional_rotation_step` — Exercise reference (`turn back 180*` для variant 2).

**Sample evidence**:

- Variant 1 (`traverses + N bar dips + traverses + M bar dips`): 14 rows.
- Variant 2 (`bar dips + traverses + turn back 180* + traverses`): 9 rows.

---

### 2.16 SandwichCompound

Per Phase 3.2 ratified compound option (b) + first-class structure для X + Y + X compounds.

**Structure**:

- `opening` — `{ exercise_ref, reps, load? }`.
- `middle` — `{ exercise_ref, reps, load? }`.
- `closing` — `{ exercise_ref, reps, load? }` (typically same exercise as opening).
- `shared_modifiers` — optional (tempo / load applied к whole compound).

**Sample evidence**: ~5 rows (SUCCESSORY shoulders work: `3 strict DB press + N DB push press + 3 strict DB press`).

---

### 2.17 CompoundRow (general decomposed `+`)

Per Phase 3.2 ratified Option (b) decompose для paired / chained compounds, не falling into Cyclical / Sandwich.

**Structure**:

- `elements` — ordered Array of `{ exercise_ref, reps, load? }`.
- `shared_modifiers` — optional (trailing weight applies to all loaded elements per DP4 a).

**Per DP4 logic**:

- При parse trailing `[ weight ]` после whole compound → apply к all loaded elements (skip bodyweight exercises via Exercise.primary_equipment).
- Per-element inline `[ weight ]` overrides shared for that element.

**Sample evidence**: 49 paired + 20 chained + ~7 extended non-repeated = ~76 compound rows fit в general CompoundRow (97 total − 23 specialized в Cyclical/Sandwich).

---

### 2.18 Catalog summary

| VO                                | Type                        | Variants count                              | Sample evidence                                                 |
| --------------------------------- | --------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Load                              | discriminated union         | 5                                           | universal                                                       |
| Weight                            | sub-VO of Load.Absolute     | 8 sub-variants                              | sample-rich (11 patterns Phase 3.3)                             |
| Intensity                         | struct optional fields      | 5 fields (Phase 7: +hr_zone, +numeric_pace) | block-055, block-078 + Phase 7 hypothetical                     |
| RepNotation                       | discriminated union         | 7                                           | universal                                                       |
| CompoundRepDefinition             | discriminated union         | 2 forms                                     | 3 occurrences                                                   |
| PerLimbDistribution               | discriminated union         | 3 + optional                                | ~180 occurrences                                                |
| TempoModifier                     | struct optional fields      | 5 fields (Phase 7: +full_tempo)             | ~67 occurrences                                                 |
| PositionEquipmentModifier         | closed enum                 | 11 values                                   | ~60 occurrences                                                 |
| SequenceIndicator                 | discriminated union         | 6                                           | 19 occurrences                                                  |
| StagedProgram (ex-DropSetProgram) | struct (Phase 7 generalize) | 3 kinds (drop_set / wave / cluster)         | 9 occurrences (drop_set), Phase 7 hypothetical (wave / cluster) |
| PerSetSubstitution                | struct                      | —                                           | 2 occurrences                                                   |
| OrAlternative                     | struct                      | —                                           | 3 + 1 occurrences                                               |
| MediaReference                    | struct                      | —                                           | ~374 references                                                 |
| TimeCap                           | struct                      | —                                           | 2 occurrences                                                   |
| CyclicalCompound                  | struct                      | —                                           | 23 occurrences                                                  |
| SandwichCompound                  | struct                      | —                                           | ~5 occurrences                                                  |
| CompoundRow                       | struct (general)            | —                                           | ~76 occurrences                                                 |
| ArchetypeSuperSetParams (Phase 7) | struct                      | —                                           | Phase 7 hypothetical (super-set archetype params)               |

---

## §3. Schema kinds + archetypes mapping (Task 3)

Schema entity имеет:

- `kind` — coarse discriminator (atomic / headerless / nested / named / composite).
- `archetype` — fine-grained reference (34 catalog после Phase 7).
- `header` — string?.
- `archetype_params` — archetype-specific bag.
- `body` — SchemaRow[] или SubSchema[].

`archetype` determines что внутри `archetype_params` ожидается. Phase 5 ratifies parameter shapes per archetype:

### 3.1 Rounds/Sets family

| Archetype           | Kind   | archetype_params shape                                                                                                                     |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| n-rounds            | atomic | `{ count_form: "exact" \| "range" \| "count_times_reps", count?: int, count_range?: {min,max}, reps_per_set?: int, rest_spec?: RestSpec }` |
| alternating-sets    | atomic | `{ set_enumeration: int[], paired_with_schema_ref?: ref }`                                                                                 |
| super-set (Phase 7) | atomic | `{ pairs: Array<{ label: string, schema_rows: SchemaRowRef[] }>, rest_between_pairs?: RestSpec, rounds: int }`                             |

### 3.2 Ladder family

| Archetype                        | Kind       | archetype_params shape                                                                    |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| ladder-descending                | atomic     | `{ steps: int[] }` (strictly decreasing)                                                  |
| ladder-ascending                 | atomic     | `{ steps: int[] }` (strictly increasing)                                                  |
| ladder-vertex-down-pyramid       | atomic     | `{ steps: int[] }` (symmetric, min in middle)                                             |
| ladder-spike                     | atomic     | `{ steps: int[] }` (descending + tail spike)                                              |
| parallel-ladders-descending      | headerless | `{ ladders: Array<{steps: int[], paired_with_inner_row_ref: ref}> }`                      |
| parallel-ladders-mixed-direction | headerless | `{ ladders: Array<{steps: int[], direction: "asc"\|"desc", paired_with_inner_row_ref}> }` |
| parallel-pyramids                | headerless | `{ pyramids: Array<{steps: int[], paired_with_inner_row_ref}> }`                          |

### 3.3 Time-cap family

| Archetype              | Kind         | archetype_params shape                                                                                   |
| ---------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| amrap-flat             | atomic       | `{ duration_min: int }`                                                                                  |
| emom-nested-per-minute | nested       | `{ duration_min: int, rounds?: int }`                                                                    |
| emom-sub-minute-slot   | atomic (sub) | `{ slot: SlotSpec }` где SlotSpec = `{kind: "single", minute: int} \| {kind: "grouped", minutes: int[]}` |
| time-window-outer      | nested       | `{ window: { start_hh_mm: string, end_hh_mm: string } }`                                                 |

### 3.4 Composite-rounds family

| Archetype                                 | Kind      | archetype_params shape                                                                       |
| ----------------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| composite-rounds-with-rest                | composite | `{ count: int \| {min,max}, rest_spec: RestSpec }`                                           |
| composite-intervals-then-rounds           | composite | `{ intervals_count: int, rest_min: int, inner_rounds: int, preamble_exercise: ExerciseRow }` |
| composite-intervals-work-rest-fixed       | composite | `{ intervals_count: int, work_min: int, rest_min: int }`                                     |
| composite-intervals-work-rest-progressive | composite | `{ sets: int, work_min: int, off_min: int, progressive_seed: string }`                       |
| composite-intervals-on-off-max-tail       | composite | `{ intervals: int, on_min: int, off_min: int, tail_exercise_ref: ref }`                      |
| composite-rolling-rounds                  | composite | `{ every_nth_min: int, rounds: int, total_min: int }`                                        |

### 3.5 Nested family (non-EMOM, non-time-window)

| Archetype                           | Kind   | archetype_params shape                                                            |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------- |
| nested-rounds-over-rounds           | nested | `{ outer_count: int \| {min,max} }` (inner — separate sub-schema with own params) |
| nested-rounds-over-parallel-ladder  | nested | `{ outer_count: int \| {min,max} }`                                               |
| nested-composite-rounds-over-ladder | nested | `{ outer_count: int, rest_spec: RestSpec }`                                       |

### 3.6 Named family

| Archetype              | Kind  | archetype_params shape                                                                                                                                                                                                                                                                             |
| ---------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| named-themed-sets      | named | `{ count: int \| {min,max}, theme: string }` (theme = "shoulders", "legs & glutes")                                                                                                                                                                                                                |
| named-exercise-program | named | `{ exercise_id: ExerciseId, program: StagedProgram }` (Q11 Phase 7.1 — any Exercise valid FK target; `Schema.header String?` — optional display override per entity §1.4 / `06-formalization/implementation-notes.md` §3.13. Phase 7 rename — covers drop_set / wave / cluster via `program_kind`) |

### 3.7 Single-line headerless family

| Archetype                       | Kind       | archetype_params shape                                      |
| ------------------------------- | ---------- | ----------------------------------------------------------- |
| single-line-with-then-connector | headerless | `{}` (body содержит ConnectorRow в конце)                   |
| single-line-bare                | headerless | `{}`                                                        |
| single-line-total-counter       | headerless | `{ total_flag: true }` (rep-row carries `[ TOTAL ]` marker) |

### 3.8 Flat / Parallel headerless family

| Archetype            | Kind       | archetype_params shape                     |
| -------------------- | ---------- | ------------------------------------------ |
| flat-list-headerless | headerless | `{}`                                       |
| pull-ups-dips-cycle  | headerless | `{}` (body содержит CyclicalCompound rows) |

### 3.9 Modality / Reference family

| Archetype        | Kind       | archetype_params shape                                                    |
| ---------------- | ---------- | ------------------------------------------------------------------------- |
| run-distance     | headerless | `{ distance?: { value: int \| {min,max}, unit: "km" }, modality: "RUN" }` |
| placeholder-body | headerless | `{}`                                                                      |
| practice-list    | headerless | `{}` (body содержит practice MediaReference rows)                         |
| url-only-body    | headerless | `{}` (body содержит StandaloneUrlRows)                                    |

### 3.10 Common types

#### RestSpec

- `duration` — `{ value: number, unit: "sec" \| "min" \| "range_sec" \| "range_min" }`.
- `scope` — enum: `between_sets` | `between_rounds` | `between_intervals` | `after_specific_set` (с `set_index`).
- `qualifier` — optional enum: `until_recovery` | `fixed` | `range`.

#### SlotSpec (для emom-sub-minute-slot)

- `kind: "single"` → `{ minute: int }` (e.g., `1 min:`, `3 min:`).
- `kind: "grouped"` → `{ minutes: int[] }` (e.g., `1st & 2nd min:` → `[1, 2]`; `3 & 4 min:` → `[3, 4]`).

---

## §4. Special structures decision (Task 4)

Финализация как special compound / alternative structures появляются внутри ExerciseRow.

### 4.1 ExerciseRow.exercise polymorphic body

ExerciseRow.exercise может быть одним из:

| Form               | Reference / VO                                                                                     | Когда                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| atomic ExerciseRef | reference на Exercise (canonical_compound_type=`atomic` либо `composite_named` либо `placeholder`) | row содержит one named movement                          |
| CompoundRow        | embedded VO (§2.17)                                                                                | row содержит `+` connector с general decomposed elements |
| CyclicalCompound   | embedded VO (§2.15)                                                                                | row matches cyclical pattern (`A + N B + A + M B`)       |
| SandwichCompound   | embedded VO (§2.16)                                                                                | row matches sandwich pattern (`X + Y + X`)               |
| OrAlternative      | embedded VO (§2.12)                                                                                | row содержит `OR` substitution (`A OR B`)                |
| PlaceholderRef     | reference на Exercise с placeholder_flag=true                                                      | placeholder row (`*DB exercise`, `ANY exercise for ABS`) |

**Discrimination strategy**: Parser determines which VO/ref to embed at parse time. Persistence (Phase 6): `exercise_form` discriminator + `exercise_ref / compound_row_json / ...` slots.

### 4.2 `&` composite-named — atomic Exercise

`clean & jerk`, `DB hang power clean & push press`, `KB clean & push press`, `hang power clean & push press` — все 4 в catalog как single Exercise с `canonical_compound_type = "composite_named"`.

**No decomposition**. Тренер видит это как одно named движение (исторически Olympic-lift naming convention).

### 4.3 `+` decomposed (DP4 application)

Trailing weight on compound:

1. Parser detects trailing `[ weight ]` после whole compound.
2. Applies к all elements с loaded equipment (Exercise.primary_equipment ∈ {dumbbell, kettlebell, barbell, mixed}).
3. Bodyweight elements (Exercise.primary_equipment ∈ {bodyweight, band, parallel_bars, rings}) — skip, остаются Load=bodyweight.
4. Per-element inline `[ weight ]` — overrides shared trailing for that element.

**Sample case**: `5 DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses [ 2x 15 kg ]` (block-129):

- Element 1: DB bench presses, Load=Absolute Weight {dual: 2x15kg} — explicit.
- Element 2: plyo push ups, Load=Bodyweight — Exercise.primary_equipment=bodyweight.
- Element 3: DB bench presses, Load=Absolute Weight {dual: 2x15kg} — explicit.

**Compound rep semantics**: 5+10+5 = 20 reps as one logical compound-rep unit (per Phase 3.1 §11 implied), не три independent sets.

### 4.4 OR-alternative — first-class VO

OrAlternative — отдельный embedded VO, не Exercise variant. Coach в UI может label purpose (scale_down / equipment / coach_choice).

### 4.5 Placeholder — first-class slot + per-set assignment

PlaceholderRow + PerSetSubstitution VO:

- Placeholder row — Exercise reference с placeholder_flag=true.
- Per-set assignment — separate annotation row (PerSetSubstitution VO).
- UI resolution: при просмотре session — слот raскрывается в actual exercises per set.

### 4.6 Connector lines — body trailing primitive

Per Phase 2.1: `then:` / `...then...:` / `...then N rounds:` хранятся в body предыдущей schema (или в schema's own body, если continuation внутри composite).

Phase 5 ratify: ConnectorRow (см. §1.6.9) — explicit row. Альтернатива `Schema.trailing_connector` — equivalent semantically. **Решение Phase 5**: explicit row (упрощает iteration + matches Phase 2.1 ratification).

---

## §5. Relations catalog (Task 5)

### 5.1 Hierarchy

| Relation              | Cardinality              | Ordered? | Invariants                                |
| --------------------- | ------------------------ | -------- | ----------------------------------------- |
| Day → Session         | 1:N (0..N)               | yes      | order: integer; sparse vs dense — Phase 6 |
| Session → Block       | 1:N (0..N)               | yes      | order                                     |
| Block → Schema        | 1:N (0..N)               | yes      | order; empty array valid                  |
| Schema → SchemaRow    | 1:N (kind ≠ nested)      | yes      | order                                     |
| Schema → SubSchema    | 1:N (kind = nested only) | yes      | order; SubSchema.parent_schema = parent   |
| SubSchema → SchemaRow | 1:N                      | yes      | те же invariants как Schema → SchemaRow   |

### 5.2 Library references

| Relation                                      | Cardinality                               | Notes                                                                       |
| --------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Day → Label                                   | M:1 (0..1)                                | Label.applicable_levels должен содержать `day` (soft warning if absent)     |
| Session → Label                               | M:1 (0..1)                                | applicable_levels includes `session`                                        |
| Block ↔ Label                                | M:N                                       | `Block.labels[]` ordered list; set semantics (no duplicates на одном Block) |
| Schema → Archetype                            | M:1                                       | `Schema.archetype` обязательная reference                                   |
| ExerciseRow → Exercise                        | M:1 (либо embedded VO с reference внутри) | для atomic / placeholder rows                                               |
| CompoundRow.elements → Exercise               | M:1 per element                           | embedded в SchemaRow                                                        |
| CyclicalCompound.primary/secondary → Exercise | M:1                                       | embedded                                                                    |
| OrAlternative.primary/alternative → Exercise  | M:1                                       | embedded                                                                    |
| PerSetSubstitution.assignment → Exercise      | M:1 per assignment                        | embedded                                                                    |
| StagedProgram.media → MediaReference          | embedded                                  | optional per-stage media (Phase 7 rename DropSetProgram → StagedProgram)    |

### 5.3 Intensity / Load attached to rows

| Relation                 | Cardinality | Inheritance                                    |
| ------------------------ | ----------- | ---------------------------------------------- |
| Block → Intensity        | 1:0..1      | inherits to Schema (partial overlay per-field) |
| Schema → Intensity       | 1:0..1      | inherits to Row (partial overlay)              |
| Row → Intensity          | 1:0..1      | leaf                                           |
| Block → TimeCap          | 1:0..1      | block-level time hint (PRACTICE)               |
| ExerciseRow → Load       | 1:0..1      | optional per-row                               |
| StandaloneLoadRow → Load | 1:1         | applies к all preceding rows in schema         |
| Exercise → default_load  | 1:0..1      | intrinsic fallback                             |

### 5.4 Athlete data

| Relation                                        | Cardinality          | Notes                                                                                             |
| ----------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| Athlete → OneRMRecord                           | 1:N                  | per (Athlete, Exercise) unique latest                                                             |
| OneRMRecord → Exercise                          | M:1                  | per-exercise reference per DP1 c                                                                  |
| Exercise.movement_family → string               | 1:1 (optional)       | soft grouping for OneRM fallback / UI                                                             |
| Session → PerformedSession                      | 1:0..1 (per Athlete) | если N athletes выполняют same Session, expect 1 PerformedSession per Athlete (1:N через Athlete) |
| Athlete → PerformedSession                      | 1:N                  | atлет имеет историю performances                                                                  |
| PerformedSession → PerformedExerciseInstance    | 1:N                  | per planned row                                                                                   |
| PerformedExerciseInstance → planned ExerciseRow | M:1 (pointer)        | (block_id, schema_id, row_order) — composite pointer                                              |

### 5.5 Invariants — cross-cutting

1. **Bodyweight equipment ↔ Load.kind**: если `Exercise.primary_equipment ∈ {bodyweight, band, parallel_bars, rings}` → `ExerciseRow.load.kind ∈ {bodyweight, undefined}`. Никогда `absolute`.
2. **Placeholder ↔ PerSetSubstitution**: если placeholder row не сопровождается PerSetSubstitution annotation row в той же schema → coach UX prompts «slot не назначен». Validation soft (warning), не hard.
3. **OrAlternative reps**: `primary_reps` и `alternative_reps` могут отличаться (sample: 2x scaling).
4. **Nested schema kinds**: outer Schema.kind = nested; sub-schema kinds может быть atomic / headerless (per Phase 2.1 EMOM / time-window evidence).
5. **Composite schema parsing**: `Schema.header` parsing extracts count + rest-spec / preamble structure → populates `archetype_params`.
6. **Compound trailing load resolution**: при чтении CompoundRow.element.load = element.load ?? compound.shared_modifiers.load (если element loaded) ?? bodyweight (если element bodyweight) ?? undefined.
7. **Intensity partial overlay**: row.effective.field = row.intensity.field ?? schema.intensity.field ?? block.intensity.field (per field independently).
8. **Label applicable_levels** — soft hint, не enforced. UI rendering filters by current level.

---

## §6. Open questions Phase 5 → Phase 6

(Не финализируем в Phase 5; для Phase 6 / future)

1. **Order semantics** — sparse vs dense (Phase 4 Q6). Persisted as integer; gap-or-no-gap convention — Phase 6.
2. **Block.labels[] uniqueness** — DB constraint vs app-level (Phase 4 Q7). Default set semantics.
3. **applicable_levels enforcement** strength (Phase 4 Q1). Soft per Option C.
4. **Label.applicable_levels mutation policy** (Phase 4 Q2). What happens to existing assignments при change.
5. **Empty-body block semantic** placeholder explanation field (Phase 4 Q4).
6. **Dual-value resolver** — конкретное правило (M/F, RX/SC, athlete profile attribute). Deferred.
7. **RPE inclusion** — model-ready как Intensity.rpe field, но 0 sample evidence. Phase 6 keeps или drops.
8. **Movement family upgrade** — string field на Exercise сейчас; если sample растёт и family >> 15 — upgrade в entity. Phase 6 / future.
9. **PerformedSession versioning** — if athlete repeats session, separate entry или single most-recent?
10. **Snapshot mode для Load** (Phase 3.3 DP2 c hybrid) — sample не требует, но gym use case может. Phase 6 / future.

---

## §7. Summary

- **Entities**: 13 (Day, Session, Block, Schema, SubSchema, SchemaRow, Exercise, Label, Archetype, Athlete, OneRMRecord, PerformedSession, PerformedExerciseInstance).
- **Value Objects**: 18 (Load, Weight, Intensity, RepNotation, CompoundRepDefinition, PerLimbDistribution, TempoModifier, PositionEquipmentModifier, SequenceIndicator, StagedProgram, PerSetSubstitution, OrAlternative, MediaReference, TimeCap, CyclicalCompound, SandwichCompound, CompoundRow, ArchetypeSuperSetParams). Phase 7: StagedProgram = rename DropSetProgram + generalize; ArchetypeSuperSetParams = new VO.
- **Schema kinds**: 5 (atomic, headerless, nested, named, composite).
- **Archetypes**: 34 catalog (33 Phase 1-6 + super-set Phase 7).
- **SchemaRow subtypes**: 9 (exercise, rest, footnote, standalone_load, standalone_url, placeholder, inner_ladder_marker, rep_definition, connector).
- **Movement family**: string field на Exercise (soft grouping, не entity).
- **Intensity**: struct с optional fields (5 после Phase 7: effort_percent / rpe / pace / hr_zone / numeric_pace), partial overlay inheritance (per Phase 4 correction).
- **TempoModifier**: 5 optional fields (4 Phase 1-6 + full_tempo Phase 7).
- **Equipment enum**: 19 values после Phase 7 (12 Phase 1-6 + 7 Phase 7 для professional CrossFit / strongman).
- **Open questions** Phase 5 → Phase 6: 10 documented. Phase 7 closes Q16-Q21 (см. `edge-cases.md` §10).
