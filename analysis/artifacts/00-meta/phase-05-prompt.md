Задача: Phase 5 — Synthesis (final domain model) для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1, 2.1, 2.2, 3.1, 3.2, 3.3, 4 выполнены. Артефакты в `analysis/artifacts/01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/`.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Не нарушать. Эта задача = Phase 5 (Synthesis). После Phase 5 идём в Phase 6 (Prisma + TS formalization).

DECISIONS INHERITED ОТ MAIN SESSION

Все ratified decisions из Phase 1-4 — ground truth. Применяй полностью при синтезе.

### Phase 1 (Inventory)

- 1 day-label (REST DAY), 1 session-label (1ST SESSION), 17 block-labels + (implicit).
- 198 unique block-instances, 168 unique exercises (до Phase 3.2 merge).
- `Temporarily without STRENGTH ENDURANCE` — инструкция, не label.

### Phase 2.1 (Schema boundaries) — ratified

- `then:` / `...then...:` connector в конец body предыдущей schema.
- block-009 alternation = 2 atomic schemas (структурная связь — архетипальная, не nested/composite).
- block-046 `...then... | N-M-L:` = atomic (connector в header).
- 30-HSPU-TOTAL preface = отдельная headerless schema.
- block-005 rest-split parallel = 2 headerless schemas.
- Headerless без markers — зонтичный kind.

### Phase 2.2 (Archetypes) — 33 архетипа ratified

- 8 singletons (vertex-down-pyramid, spike, amrap-flat, rolling-rounds, work-rest-fixed, on-off-max-tail, parallel-pyramids, practice-list).
- 3 block-singletons (alternating-sets, time-window-outer, parallel-ladders-mixed-direction).
- n-rounds dominance (~38%) — это OK, единый archetype с notation variants.

### Phase 3.1 (Schema content primitives) — modifier classification ratified

First-class structured fields/enums:

- Weight (VO с variants).
- Rep semantics: count / range / MAX (3 sub-forms) / TOTAL flag / compound-rep.
- Per-limb: enum each_leg / each_arm + LEFT/RIGHT.
- Tempo/pause: pause_in_up / per_nth_rep_pause / slow_eccentric / hold_after_last.
- Effort intensity → Intensity VO (см. ниже).
- Position/equipment: enum (neutral_grip / from_sofa / from_box / from_sofa_box / without_bench / without_jump / hold_farm_carry / hand_on_db / hands_on_db).
- Sequence indicator: before_named / after_named / only_once_before / after_each_round / after_each_typed_round.
- Media reference: first-class entity (url + position + label + applies-to).
- Drop-set program: first-class structure.
- Per-set substitution: first-class slot.

Second-class free-text notes:

- Clarifications (EXAMPLE, EXPLODE без URL).
- Multi-stage arm programs (`1 ARM HOLD in UP | another ARM DO 5 reps | ...`).
- Unique movement descriptors (`kind of wall balls`, `emphasis on the gluteal muscles`).
- Composite annotations с `|` без regular pattern.

Hybrid: все first-class entities могут иметь optional `notes` field.

### Phase 3.2 (Exercise as entity) — ratified

- 149 canonical exercises после 19 merges.
- `DB alt. snatches` → merge into `DB Snatches` (alternating = use-site `[ alternative ]`).
- `&` vs `+` для Olympic lifts — keep separate в каталоге; Phase 6 formalizes Option (c): `&` atomic / `+` decomposed.
- KB vs Kettlebell: ratify abbreviation `KB`. Rename `Single Leg Kettlebell Hip Thrust` → `Single Leg KB Hip Thrust`.
- **Movement family** — soft grouping field на Exercise (`movement_family: string`), не hard relation.
- `single arm row` (mixed) → merge into `DB single arm row`; split-tier = use-site composite weight.
- `DB bench presses LEFT arm | RIGHT arm HOLD in UP` — extract pipe-modifier, canonical = `DB bench presses` + use-site composite weight-with-asymmetric-arm-action.
- `Cossacs squats AFTER EACH GYMNASTICS set` — extract sequence, canonical = `Cossacs squats` + use-site `after_each_typed_round: GYMNASTICS`.
- `3x 10 DB Jefferson curls` — extract `3x 10` как schema header; canonical = `DB Jefferson curls`.
- `MAX ROUNDS in remaining time...` — remove from Exercise list, move в schema-content primitive.
- `pull overs` vs `DB pull overs` — keep separate.
- Compound `+` model: **Option (b) decompose** + first-class structures для:
  - **CyclicalCompound** (`traverses + N bar dips + traverses + M bar dips`)
  - **SandwichCompound** (`X + Y + X`)
- `&` composite-named: **atomic** (Option c).
- OR-alternative: **first-class** `OrAlternative` structure.
- Placeholders: **first-class slot** + per-set assignment.

### Phase 3.3 (Load representation) — 4 DPs ratified

- **DP1 (c) hybrid**: 1RM per-exercise + movement_family soft grouping для UX.
- **DP2 (b) live formula** + separate `actual_load` recorded performance field.
- **DP3 (b) explicit `bodyweight`** variant в Load discriminated union.
- **DP4 (a)+(c) hybrid**: trailing applies to whole compound (loaded-only) + per-element inline override.

Дополнительные ratified:

- Dual-value `[ 50/30 kg ]` → `resolver: "athlete_profile"`, concrete rule deferred to runtime.
- Multi-row standalone weight → **first-class** standalone-load row primitive.
- Weighted-implicit default → **Exercise.default_load** intrinsic optional attribute (fallback). UI prompts если absent.
- **Intensity** = sibling VO к Load (НЕ variant Load).
- RPE → first-class через Intensity VO.
- Cross-movement percentage → `Percentage.reference.scope = "other_exercise"`.

### Phase 3.3 / Phase 4 correction — Intensity = struct с optional fields

**Не discriminated union, а struct с optional fields**:

```
Intensity {
  effort_percent?: { value: N } | { range: [N, M] }
  rpe?: { value: N }
  pace?: enum("easy" | "moderate" | "hard")
}
```

Это позволяет одновременно `{ pace: easy, effort_percent: 70 }` (block-055 case).

Scope: block / schema / row.
Inheritance: **partial overlay** — каждое поле наследуется independently. Block: `pace=easy`; Schema: `effort_percent=70` → merged: `{ pace: easy, effort_percent: 70 }`.

### Phase 4 (Top-level structure) — ratified

- **Multi-labels на Block**: `block.labels[]` cardinality 0..N. Composite `|`-strings — textual representation of multi-label.
- **Empty-body block**: `block.schemas = []` valid.
- **Lowercase block labels**: обычные labels (no special treatment).
- **Basic GYMNASTICS vs GYMNASTICS**: keep separate в library (тренер управляет).
- **Implicit block**: `block.labels = []` empty array, no special marker.
- **Day.notes / Session.notes**: keep optional (universally useful, no overengineering).
- **Labels catalog: Option C hybrid** — один global namespace + soft `applicable_levels: [day|session|block]` metadata (advisory, не enforced).
- **Decomposition rules** (composite labels):
  - Rule 1: extract intensity `[ N% EFFORT ]` / `EASY PACE` → block.intensity (pace) + remaining labels.
  - Rule 2: extract schema-spec (`3 sets`, `N rounds`) → schema header in body.
  - Rule 3: split remaining `|`-separated labels → block.labels[].
  - Example: `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` → labels=[`STRENGTH ENDURANCE`], intensity={pace: easy, effort_percent: 70}.
  - Note: `EASY PACE` — это pace value, не label. Drop из labels catalog.

### Other ratified

- Scope ниже недели. Day = pure container с order + optional label + optional notes.
- Block.labels[] set semantics (no duplicates), ordered list (presentation).
- Order semantics (sparse vs dense) — defer Phase 6.

ВХОДНЫЕ ДАННЫЕ

Все артефакты:

- `01-inventory/` (6 файлов).
- `02-patterns/` (5 файлов).
- `03-content/` (10 файлов).
- `04-structure/` (3 файла).

Это много контента — читай селективно через Read с offset/limit для больших файлов. Не пытайся загрузить всё сразу.

Используй артефакты как источник:

- Lists / cardinality → inventory / canonical lists.
- Decisions → ratified text выше.
- Sample contexts → schema-boundaries.md для конкретных block-XXX.

ЦЕЛЬ

Построить **formal domain model** на естественном языке: entities, value objects, relations, invariants. Без Prisma / TS / Zod (Phase 6). Включить ER diagram (mermaid) и stress test против sample.

ЗАДАЧИ

### Task 1 — Entities catalog

Финальный список entities с описанием. Минимум следующие (могут быть additional если данные диктуют):

- **Day** — контейнер sessions, scope ≤ week, attributes: order / label? / notes? / sessions[].
- **Session** — контейнер blocks, attributes: order / label? / notes? / blocks[].
- **Block** — контейнер schemas, attributes: order / labels[] / intensity? / notes? / schemas[]. Multi-label, может быть пустой.
- **Schema** — единица "как это исполняется", с kind discriminator (atomic / headerless / nested / named / composite) + archetype reference + header? + body. Может содержать sub-schemas (nested).
- **SchemaRow** или **SchemaContentRow** — per-row primitive внутри schema body. Subtypes: exercise-row / inline-rest / footnote / standalone-load / standalone-url / placeholder-row. Discriminated union.
- **Exercise** — 149 canonical с intrinsic + use-site разделением. Intrinsic: canonical_name / primary_equipment / movement_type_tag / default_demo_url? / canonical_compound_type / movement_family? / default_load? / placeholder_flag.
- **Label** — Option C polymorphic с applicable_levels.
- **MovementFamily** — soft grouping, может быть имплицитен через string поле на Exercise. Решить: separate entity или just string field.
- **Archetype** — 33 schema archetypes catalog.
- **AthleteProfile** — owner для 1RM records, минимум attributes (sex? для dual-value resolver, но deferred).
- **OneRMRecord** — athlete × exercise × value.
- **PerformedSession** — для actual_load recording per DP2. Структура (минимум): reference на planned session + actual_load per exercise instance + timestamp / notes.

Для каждой entity: purpose (1 sentence), key attributes, relations (references).

### Task 2 — Value objects (VO) catalog

- **Load** — discriminated union с variants:
  - `Absolute` (Weight VO внутри).
  - `Percentage` (% 1RM, с reference scope).
  - `Bodyweight` — explicit.
  - `Negative` — drop-stage indicator.
  - `Unspecified` — для weighted-implicit case (UI prompts).
- **Weight** — sub-VO для Absolute Load:
  - `single` (value_kg, equipment context из exercise).
  - `dual` (paired, value_kg).
  - `single_arm` (value_kg, single_arm flag).
  - `compound_device` (equipment + count + value_kg).
  - `split_tier` (stages: [(reps, equipment, value_kg)]).
  - `dual_value` (first / second / resolver = athlete_profile).
  - `with_asymmetric_arm` (value_kg + working_arm + passive_arm_action enum).
  - `with_depth_modifier` (value_kg + depth enum).
- **Intensity** — struct с optional fields (effort_percent? / rpe? / pace?). Partial overlay inheritance.
- **RepNotation** — count / range / MAX (3 sub-forms: bare, progressive, in-remaining-time) / TOTAL flag.
- **CompoundRepDefinition** — для curly + inline-equality (`{ 1 push up + each arm row = 1 rep }`, `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]`).
- **SequenceIndicator** — before_named / after_named / only_once_before / after_each_round / after_each_typed_round.
- **TempoModifier** — pause_in_up / per_nth_rep_pause / slow_eccentric / hold_after_last (с params).
- **DropSetProgram** — `rep_stages[]` для named-exercise-program (Bulgarian style).
- **PerSetSubstitution** — `placeholder_name + per_set_assignments[]`.
- **OrAlternative** — primary + alternative (с reps).
- **MediaReference** — url + position (inline / standalone-row / bare) + label? (EXPLODE:) + applies-to (previous-row / current-row / whole-schema).
- **CyclicalCompound** — `primary_element + secondary_element + cycles[reps_per_cycle] + optional_rotation_step`.
- **SandwichCompound** — `opening + middle + closing` с per-element rep counts.

Для каждой VO: structure, variants, sample evidence (1-2 примера).

### Task 3 — Schema kinds + archetypes mapping

Schema entity имеет fields:

- **kind** discriminator (atomic / headerless / nested / named / composite) — для structural validation.
- **archetype** reference (33 archetypes from Phase 2.2).
- **header**: string? (null для headerless).
- **body**: SchemaRow[] (для atomic/named/headerless/composite) OR SubSchema[] (для nested).
- **archetype_params**: archetype-specific параметры (ladder steps / sets count / EMOM duration / etc.).

Document как archetype_params вписываются:

- ladder-descending: `steps: [N1, N2, ..., Nk]`.
- n-rounds: `count: N` (или `range: [min, max]`).
- emom-nested-per-minute: `duration_min: N` + `rounds: N?` (optional composite).
- time-window-outer: `windows: [{ start_min, end_min, sub_schema_ref }]`.
- parallel-ladders-descending: `ladders: [{ steps, exercise_ref }]`.
- (etc. для всех 33 archetypes — финальный list)

### Task 4 — Special structures decision

Для Phase 3.2 ratified compound options:

- **CompoundRep** general decomposed `+` — модель как compound_rep VO внутри SchemaRow (compound-rep references на 2-N Exercise IDs + per-element reps + per-element load override).
- **CyclicalCompound** — отдельная VO (см. Task 2), используется когда `traverses + N bar dips + traverses + M bar dips` pattern.
- **SandwichCompound** — отдельная VO, `X + Y + X` pattern.
- **CompositeNamed** (`&`) — atomic Exercise, имя содержит `&` или `clean & jerk`-style.

Финализируй как они появляются:

- SchemaRow может содержать: atomic Exercise ref OR CompoundRep VO OR CyclicalCompound VO OR SandwichCompound VO OR OrAlternative VO.
- Discrimination через row.kind или через polymorphic body type.

### Task 5 — Relations catalog

Document все relations:

- Day → Session (1:N, ordered).
- Session → Block (1:N, ordered).
- Block → Schema (1:N, ordered).
- Block ↔ Label (M:N, ordered list semantics per Phase 4).
- Block → Intensity (1:0..1).
- Schema → Archetype (M:1).
- Schema → Intensity (1:0..1).
- Schema → SchemaRow или SubSchema (1:N, ordered).
- SchemaRow → Exercise (M:1 reference, через atomic / compound members).
- Exercise → MovementFamily (M:1, soft).
- Exercise → MediaReference (1:0..1, intrinsic default URL).
- Athlete → OneRMRecord (1:N).
- OneRMRecord → Exercise (M:1).
- Session → PerformedSession (1:0..1).
- PerformedSession → ExerciseInstance × actual_load (multi-attribute).

С cardinalities и invariants для каждой.

### Task 6 — ER diagram (mermaid)

Чистый mermaid ER с entities (no VOs — VOs embedded fields).

Format:

```mermaid
erDiagram
    DAY ||--o{ SESSION : contains
    SESSION ||--o{ BLOCK : contains
    BLOCK ||--o{ SCHEMA : contains
    BLOCK }o--o{ LABEL : has
    ...
```

Embed Intensity / Load / etc. как fields в entities (не отдельные boxes).

### Task 7 — Stress test

Выбери 7 разных sessions из sample, представляющих разные archetypes / edge cases:

Recommended sample set:

- **block-037** STRENGTH ENDURANCE (canonical parallel-ladders-descending + EXAMPLE annotation).
- **block-003** STRENGTH ENDURANCE (time-window-outer singleton).
- **block-009** STRENGTH ENDURANCE (alternating-sets singleton).
- **block-080 или 081** (implicit) (EMOM nested per-minute).
- **block-008** STRENGTH ENDURANCE (parallel-ladders + Bulgarian named-exercise-program).
- **block-145** CHIPPER (flat-list-headerless singleton).
- **block-006** STRENGTH ENDURANCE (then-connector multi-schema 4 schemas).

(Используй точные block-ids из schema-boundaries.md / schema-archetype-mapping.md.)

Для каждого:

- Покажи raw body (из block-instances.md).
- Покажи как session "укладывается" в модель — конкретные entity instances и VO values.
- Найди gaps (что не лезет, или требует объяснения).

Дополнительно: 1 session с composite multi-label (block с `STRENGTH ENDURANCE | Gymnastics` label, например block-047) — для проверки Rule 3 decomposition.

### Task 8 — Edge cases catalog в model

Document:

- **Singletons handling**: 8 archetypes с cardinality=1 (vertex-down-pyramid, etc.) — все first-class в model? Или сливать?
- **Block-singletons**: alternating-sets (block-009), time-window-outer (block-003), parallel-ladders-mixed-direction (block-005) — first-class structures или block-instance specifics?
- **Deferred decisions**:
  - dual-value resolver (M/F vs RX/SC) — модель просто хранит first/second, runtime resolves.
  - RPE inclusion — first-class в Intensity, sample empty но model ready.
  - Cross-movement percentage reference.
- **Movement family abstraction**: separate entity или string field на Exercise? Sample weak evidence (4-5 family groups очевидны из demo URLs). Recommend string field для start (upgrade позже).
- **Per-set substitution**: how slot resolves в UI/data.
- **Drop-set program**: как named-exercise-program archetype interfaces со Schema.
- **OrAlternative**: structure для scaling.
- **PerformedSession** vs **Session**: separate entity или log table.

Эскалации к main session для open questions.

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/05-synthesis/`:

1. **`domain-model.md`** — Tasks 1-5 (entities + VOs + Schema kinds + special structures + relations) на естественном языке. Russian explanation, English identifiers.

2. **`er-diagram.md`** — Task 6 mermaid ER (clean, без VO boxes).

3. **`stress-test.md`** — Task 7 (7+ sessions укладываются в модель, gaps documented).

4. **`edge-cases.md`** — Task 8 + эскалации в main session.

ACCEPTANCE

- Все ratified decisions из Phase 1-4 reflected в модели.
- Каждая entity / VO имеет sample evidence либо явное обоснование "deferred / future".
- 7+ sessions stress-tested, gaps documented или явный success.
- ER diagram complete и rendering-ready.
- Open questions Phase 4 (Q1-Q7) могут оставаться для Phase 6 — НЕ финализируй здесь.

ПРАВИЛА РАБОТЫ

- НЕ Prisma / TS / Zod (Phase 6).
- НЕ table schemas, indices, constraints, migrations.
- НЕ выходи выше Day (no week / calendar attributes).
- НЕ модифицируй Phase 1-4 артефакты.
- НЕ память, web, video.
- НЕ читать вне `analysis/`.
- НЕ делегируй sub-agentам — Phase 5 требует synthesis по полному context.
- Russian content, English identifiers/filenames.
- Без эмодзи / подписей / комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: total entities + VOs counts, stress test coverage (X/7 sessions укладываются, Y gaps), open эскалации (если есть), готовность к Phase 6 (Prisma).
