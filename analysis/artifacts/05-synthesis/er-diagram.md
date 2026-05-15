# ER diagram (Phase 5 synthesis, Task 6)

Mermaid ER модели тренировочных сессий. Value objects embedded как fields внутри entities (отдельные boxes не выводятся — это атрибуты, не identity).

Identifiers — English; descriptions inline в диаграмме на English (mermaid рендерится моноширинно и translation в диаграммах путает связи).

> **Revised 2026-05-12** — synced с `06-formalization/er-final.md` после D1-D4: добавлены `TRAINING_PLAN` + `WEEK` nodes, `ATHLETE` → `USER` (external stub), `DAY.order` заменён на `(week_id, day_of_week)`. См. `06-formalization/implementation-notes.md` (Phase 7 Integration Ratifications).

---

## §1. Core diagram

```mermaid
erDiagram
    TRAINING_PLAN ||--o{ WEEK : "indefinite train (D1)"
    WEEK ||--o{ DAY : "ISO Mon-Sun slot (≤7 Days)"

    DAY ||--o{ SESSION : contains
    DAY }o--o| LABEL : "labeled by (0..1)"

    SESSION ||--o{ BLOCK : contains
    SESSION }o--o| LABEL : "labeled by (0..1)"
    SESSION ||--o{ PERFORMED_SESSION : "is performed as"

    BLOCK ||--o{ SCHEMA : contains
    BLOCK }o--o{ LABEL : "labeled by (0..N ordered)"

    SCHEMA }o--|| ARCHETYPE : "is shaped as"
    SCHEMA ||--o{ SCHEMA : "has sub-schemas (kind=nested)"
    SCHEMA ||--o{ SCHEMA_ROW : contains

    SCHEMA_ROW }o--o| EXERCISE : "references (atomic / placeholder)"
    SCHEMA_ROW }o--o{ EXERCISE : "references (compound elements)"

    EXERCISE }o--o| EXERCISE : "OR-alternative substitute"

    USER ||--o{ ONE_RM_RECORD : "owns"
    ONE_RM_RECORD }o--|| EXERCISE : "for"

    USER ||--o{ PERFORMED_SESSION : "owns"
    PERFORMED_SESSION ||--o{ PERFORMED_EXERCISE_INSTANCE : contains
    PERFORMED_EXERCISE_INSTANCE }o--|| SCHEMA_ROW : "actuals against planned"

    TRAINING_PLAN {
        id pk "external — full shape lives in app-level schema"
    }

    WEEK {
        id pk
        ref plan_id "FK TrainingPlan"
        date start_date "Monday of ISO week (D1)"
        text notes "optional, coach-facing"
    }

    DAY {
        id pk
        ref week_id "FK Week"
        enum day_of_week "MONDAY..SUNDAY (D1)"
        ref label_id "FK Label optional"
        text notes "optional"
    }

    SESSION {
        id pk
        ref day_id "FK Day"
        int order
        ref label_id "FK Label optional"
        text notes "optional"
    }

    BLOCK {
        id pk
        ref session_id "FK Session"
        int order
        json labels "ordered ref array (0..N)"
        json intensity "VO optional (effort_percent, rpe, pace)"
        json time_cap "VO optional (PRACTICE-style block hint)"
        text notes "optional"
    }

    SCHEMA {
        id pk
        ref block_id "FK Block"
        ref parent_schema_id "FK Schema, nullable, for sub-schemas"
        int order
        enum kind "atomic / headerless / nested / named / composite"
        ref archetype_id "FK Archetype"
        text header "nullable for headerless"
        json archetype_params "shape per archetype"
        json intensity "VO optional"
        json trailing_connector "VO optional then / then-N-rounds"
    }

    SCHEMA_ROW {
        id pk
        ref schema_id "FK Schema"
        int order
        enum row_kind "exercise / rest / footnote / standalone_load / standalone_url / placeholder / inner_ladder_marker / rep_definition / connector"
        json row_payload "polymorphic VO bag per row_kind"
        json load "VO optional (Load discriminated union)"
        json reps "VO optional (RepNotation)"
        json side "VO optional (PerLimbDistribution)"
        json tempo "VO optional (TempoModifier)"
        json position "enum optional (PositionEquipmentModifier)"
        json sequence "VO optional (SequenceIndicator)"
        json intensity "VO optional"
        json media "VO optional (MediaReference)"
        json compound_rep "VO optional (CompoundRepDefinition curly form)"
        text notes "optional free-text"
    }

    EXERCISE {
        id pk
        text canonical_name "unique case-insensitive"
        enum primary_equipment "bodyweight / dumbbell / kettlebell / barbell / band / parallel_bars / rings / box / sofa / box_or_sofa / mixed / unknown"
        enum movement_type_tag_primary
        enum movement_type_tag_secondary "optional"
        text default_demo_url "optional"
        enum canonical_compound_type "atomic / compound_plus / composite_named / placeholder / alternative_or"
        bool placeholder_flag
        text movement_family "soft string grouping, optional"
        json default_load "VO optional intrinsic fallback"
        json aliases "informational merged names"
        text notes "library notes optional"
    }

    LABEL {
        id pk
        text name "unique case-insensitive"
        json applicable_levels "set day/session/block, non-empty"
        text notes "library description optional"
    }

    ARCHETYPE {
        id pk
        text name "kebab-case identifier"
        enum kind "atomic / headerless / nested / named / composite"
        enum family "rounds_sets / ladder / time_cap / composite_rounds / nested / named / single_line_headerless / flat_parallel_headerless / modality_reference"
        text header_pattern_description
        text body_layout_description
        json archetype_params_schema "param keys catalog"
        json related_archetypes "graph specialization_of / paired_with / continuation_of / extension_of / contained_by / contains"
    }

    USER {
        id pk "external — full shape lives in app-level schema (User + AthleteProfile)"
    }

    ONE_RM_RECORD {
        id pk
        ref user_id "FK User (D2)"
        ref exercise_id "FK Exercise"
        decimal value_kg
        timestamp recorded_at
        enum source "manual / auto_inferred / tested"
    }

    PERFORMED_SESSION {
        id pk
        ref session_id "FK Session"
        ref user_id "FK User (D2)"
        timestamp started_at
        timestamp completed_at "optional"
        text coach_notes "optional"
        text athlete_notes "optional"
    }

    PERFORMED_EXERCISE_INSTANCE {
        id pk
        ref performed_session_id "FK PerformedSession"
        ref planned_schema_row_id "FK SchemaRow"
        json actual_load "VO Load"
        json actual_reps "VO RepNotation"
        json actual_intensity "VO Intensity optional"
        json stage_actuals "optional per-stage actuals for drop-set / per-set-substitution"
        text notes "optional"
    }
```

---

## §2. Notes on the diagram

### 2.1 Embedded VOs (no separate entity)

Все Value Objects (per Phase 5 §2 catalog) хранятся как JSON / structured columns внутри entity rows:

- `Block.intensity`, `Block.time_cap` — embedded JSON.
- `Schema.archetype_params`, `Schema.intensity`, `Schema.trailing_connector` — embedded.
- `SchemaRow.*` — почти все use-site attributes embedded (load, reps, side, tempo, position, sequence, intensity, media, compound_rep).
- `Exercise.default_load`, `Exercise.aliases` — embedded.

Phase 6 (Prisma) решит конкретный JSON-shape persistence vs FK-split (например, MediaReference может быть отдельной таблицей если будет нужен library-wide URL dedup).

### 2.2 Self-reference SCHEMA для sub-schemas

`Schema → Schema (parent_schema_id, nullable)` — self-reference для nested archetype's sub-schemas. Альтернатива — отдельная SUB_SCHEMA entity, но shape идентичен (kind, header, body) → reuse SCHEMA table.

Invariants:

- `parent_schema_id IS NULL` → top-level schema внутри Block.
- `parent_schema_id IS NOT NULL` → sub-schema; parent.kind = `nested`.
- Depth: max 2 (top + sub). Sample не показывает sub-sub-schemas.

### 2.3 SCHEMA_ROW polymorphic payload

`SCHEMA_ROW.row_kind` discriminator + `row_payload` JSON varies per kind:

| row_kind              | row_payload shape                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------- | ---------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exercise`            | `{ exercise_form: "atomic"                                                                                        | "compound"                                    | "cyclical" | "sandwich" | "or_alternative" | "placeholder_ref", exercise_ref?: id, compound: CompoundRow?, cyclical: CyclicalCompound?, sandwich: SandwichCompound?, or_alternative: OrAlternative?, placeholder: PlaceholderRef? }` |
| `rest`                | `{ raw: string, parsed: RestSpec }`                                                                               |
| `footnote`            | `{ marker: "\*"                                                                                                   | "\*\*", target: enum, content: CompoundRow }` |
| `standalone_load`     | `{ load: Load, scope: "applies_to_all_preceding_rows" }`                                                          |
| `standalone_url`      | `{ url: string, wrapped: bool, applies_to: enum }`                                                                |
| `placeholder`         | `{ placeholder_kind: enum, text: string, per_set_assignments?: PerSetSubstitution, paired_concrete?: SchemaRow }` |
| `inner_ladder_marker` | `{ steps: int[] }`                                                                                                |
| `rep_definition`      | `{ equality: CompoundRepDefinition_inline_form }`                                                                 |
| `connector`           | `{ form: enum, rounds_count?: int }`                                                                              |

**Ref-fields** (например `exercise_ref` внутри ExerciseRow polymorphic body) — это FK на EXERCISE, но из JSON; Phase 6 решит, делать ли отдельные FK columns для query-friendly access.

### 2.4 ExerciseRow ↔ Exercise — две связи

В диаграмме показано две relations:

- `SCHEMA_ROW }o--o| EXERCISE` — 1 reference (atomic / placeholder form).
- `SCHEMA_ROW }o--o{ EXERCISE` — M-N (compound elements: CompoundRow, CyclicalCompound, SandwichCompound содержат N exercise references).

Phase 6 решит persistence: отдельные join-tables или JSON-array of exercise_ids внутри `row_payload`.

### 2.5 OR-alternative — internal exercise relation

`EXERCISE }o--o| EXERCISE : "OR-alternative substitute"` — концептуально это reference внутри OrAlternative VO (primary / alternative pair). На диаграмме показано как entity-level relation для clarity, но persistence — embedded в SchemaRow.row_payload, не отдельная Exercise.alternative FK.

### 2.6 Movement family

`EXERCISE.movement_family` — text field, **не** FK. Soft grouping per DP1 c. Если будет upgrade в entity (Phase 6 / future) — становится `EXERCISE }o--o| MOVEMENT_FAMILY`.

### 2.7 PerformedSession ↔ User

Session — planned (создаётся coach). PerformedSession — actual выполнение (1 per (Session, User) tuple). Per D2 (2026-05-12) `athleteId` переименован в `userId`; standalone `Athlete` entity отсутствует — athlete = `User` с `role=ATHLETE` + `AthleteProfile` (живут в app-level schema).

Текущая cardinality:

- `SESSION ||--o{ PERFORMED_SESSION` (1 planned может быть выполнена N athletes — group sessions).
- `USER ||--o{ PERFORMED_SESSION` (1 athlete имеет N performances).

В sample (1 athlete, no group sessions) — это (1:1). Модель готова к (1:N).

### 2.8 Что НЕ в диаграмме

- **MovementFamily entity** — не выделена (soft string field на Exercise).
- **MediaReference entity** — embedded VO, не отдельный entity. Если Phase 6 решит выделить (для library URL dedup) — добавится `EXERCISE ||--o{ MEDIA_REFERENCE` + `SCHEMA_ROW }o--o{ MEDIA_REFERENCE`.
- **RestSpec / TimeCap / RepNotation / Load / Intensity** — embedded VOs.
- **StagedProgram (ex-DropSetProgram, Phase 7 Q19) / PerSetSubstitution / CompoundRow / ArchetypeSuperSetParams (Phase 7 Q20)** — embedded VOs (внутри SchemaRow.row_payload или Schema.archetype_params).
- **TRAINING_PLAN / USER** (external stubs, D1/D2 2026-05-12) — отображены здесь PK-only ради FK validity; full shape живёт в `packages/api-server/prisma/schema.prisma` (TrainingPlan = creator/status/name; User = identity + role + AthleteProfile/CoachProfile).
- **Calendar derivations** (week-end date, ISO year+week number, per-day calendar date) — derived в app layer, не stored.

---

## §3. Quick-reference invariants

| Invariant                                                                                                 | Scope            | Source                      |
| --------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------- |
| Day.sessions[] может быть пустым                                                                          | Day              | REST DAY 66 occurrences     |
| Block.labels[] может быть пустым (implicit)                                                               | Block            | 75 implicit occurrences     |
| Block.schemas[] может быть пустым (empty-body)                                                            | Block            | 6 empty-body occurrences    |
| Schema.kind === 'headerless' ↔ header IS NULL                                                            | Schema           | structural rule             |
| Schema.kind === 'nested' ↔ body содержит sub-schemas, не SchemaRows                                      | Schema           | Phase 2.1                   |
| SubSchema.parent.kind === 'nested'                                                                        | Schema           | self-reference invariant    |
| Block.labels — set semantics (no dups), ordered list (presentation)                                       | Block            | Phase 4                     |
| Label.applicable_levels — non-empty set                                                                   | Label            | Phase 4 Option C            |
| Intensity scope hierarchy: row → schema → block (partial overlay per field)                               | Intensity        | Phase 4 correction          |
| Exercise.primary_equipment ∈ {bodyweight,band,parallel_bars,rings} → row.load.kind ∉ {absolute}           | Load consistency | DP3 b                       |
| 1RM record (User, Exercise) — primary FK per DP1 c (renamed from Athlete per D2); family is soft fallback | OneRMRecord      | Phase 3.3 + D2 (2026-05-12) |
| Compound trailing weight applies to loaded elements only (bodyweight skip)                                | DP4              | Phase 3.3                   |
| Per-element inline weight overrides shared trailing                                                       | DP4              | Phase 3.3                   |

---

## §4. Renderability

Диаграмма выше — single mermaid block `erDiagram`. Все entity-аttributes описаны inline в mermaid syntax (`{ id pk; ... }`). Relations:

- `||--o{` — one-to-many mandatory parent, optional child.
- `}o--o{` — many-to-many (Block ↔ Label, SchemaRow ↔ Exercise compound).
- `}o--o|` — many-to-one optional.
- `}o--||` — many-to-one mandatory.

Render-tested против mermaid spec (standard erDiagram syntax). Ready for any markdown renderer with mermaid support.
