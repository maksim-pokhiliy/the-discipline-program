Задача: Phase 6 — Formalization (Prisma schema + TS types + final ER + stress test всех 33 листов) для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1-5 выполнены. Артефакты в `analysis/artifacts/01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/`, `05-synthesis/`.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Не нарушать. Эта задача = Phase 6 (Formalization). **Финальная фаза** — после Phase 6 у нас полная domain model готовая для имплементации.

DECISIONS INHERITED ОТ MAIN SESSION

Все ratified decisions из Phase 1-5 — ground truth. Применяй полностью. Полные тексты Phase 5 artifacts:

- `05-synthesis/domain-model.md` — 13 entities + 17 VOs + 33 archetypes + Schema kinds + SchemaRow subtypes.
- `05-synthesis/er-diagram.md` — Phase 5 ER (Phase 6 refines с финализациями).
- `05-synthesis/stress-test.md` — 9 sessions stress-tested fit.
- `05-synthesis/edge-cases.md` — Phase 5 deferred + escalations.

Q1-Q15 FINAL RESOLUTIONS (применяй при формализации)

| ID  | Question                                    | Final Resolution                                                                                                                                                                                     |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | applicable_levels enforcement               | **soft**, UI warning level; API silent accept + warning header. Validation runs but не reject.                                                                                                       |
| Q2  | Label.applicable_levels mutation policy     | **keep existing assignments**; migration warning on mutation; no auto-removal of orphaned assignments.                                                                                               |
| Q3  | Intensity inheritance                       | **partial overlay** — каждое поле (effort_percent / rpe / pace) наследуется independently row → schema → block. Child field overrides only that field, parent fields fill missing.                   |
| Q4  | Empty-body block                            | **no explanation field**; UI shows as-is. `Block.schemas = []` valid.                                                                                                                                |
| Q5  | Implicit-block UI                           | "Без названия" placeholder (UI decision). Model: `Block.labels = []` valid.                                                                                                                          |
| Q6  | Order semantics                             | **sparse integer**, default 10-step increments (10, 20, 30, ...) для easy insertion. Allow gaps.                                                                                                     |
| Q7  | Block.labels set/list                       | DB unique constraint `(block_id, label_id)` (set semantics for dedup) + ordered through `order` integer field на BLOCK_LABEL_ASSIGNMENT join table.                                                  |
| Q8  | Pace = label или Intensity field            | **Intensity field**. `EASY PACE` НЕ в labels catalog — это `Intensity.pace = "easy"`.                                                                                                                |
| Q9  | PerformedSession versioning                 | **latest-only per (Session, Athlete)** — single performance per planned Session. Re-do = new Session.                                                                                                |
| Q10 | Snapshot mode для Load                      | optional **`Session.freeze_loads_at_creation` boolean**, default false. When true: при создании сессии все percentage loads резолвятся в absolute kg и записываются. Default — live formula per DP2. |
| Q11 | exercise_name в named-exercise-program      | **FK на Exercise**. Add canonical "Bulgarian split squats" в Exercise catalog (alongside DB/KB variants).                                                                                            |
| Q12 | `rest_slot` row kind                        | **add to row_kind enum**. Используется для REST body внутри EMOM sub-schemas.                                                                                                                        |
| Q13 | `alternating` variant в PerLimbDistribution | **add to distribution_kind enum**. Используется для `[ alternative ]` modifier.                                                                                                                      |
| Q14 | SequenceIndicator.target_label              | **string** (free-text). Upgrade на Label reference — optional future.                                                                                                                                |
| Q15 | Schema.notes field                          | **add `notes: string?` на Schema**. Для EXAMPLE-style explanatory rows.                                                                                                                              |

ДОПОЛНИТЕЛЬНЫЕ FINAL DECISIONS

- **Dual-value resolver** (`[ 50/30 kg ]`): модель хранит `{ first, second, resolver: "athlete_profile" }`. Concrete resolver attribute name — defer (placeholder в `Athlete.profile_attributes` JSON).
- **RPE inclusion**: keep optional в Intensity.rpe (`{ value: N }`).
- **Cross-movement percentage**: keep `Load.Percentage.reference.scope = "other_exercise"` с `target_exercise_id` FK.
- **MovementFamily**: string field на Exercise (не entity).
- **MediaReference**: embedded VO в SchemaRow + Exercise.default_demo_url.
- **paired_with_schema_ref**: **separate `SCHEMA_PAIRING` join table** для alternating-sets bidirectional FK.

ВХОДНЫЕ ДАННЫЕ

- Все артефакты Phase 1-5 в `analysis/artifacts/`.
- Особо приоритет: `05-synthesis/*` для entity / VO structure.
- `01-inventory/block-instances.md` — 198 block instances для stress test всех 33 листов.
- `02-patterns/schema-archetype-mapping.md` — block → schema → archetype mapping.

Читай селективно через Read с offset/limit. Не пытайся загрузить всё.

ЦЕЛЬ

Финальный deliverable workflow: Prisma schema + TS types + финальная ER + stress test всех 198 block instances.

ЗАДАЧИ

### Task 1 — Prisma schema (`schema.prisma`)

Полная Prisma schema с:

**Configuration**:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Entities** (с конкретными полями):

- `Day { id, order, labelId?, notes?, sessions[], createdAt, updatedAt }`
- `Session { id, dayId, order, labelId?, notes?, freezeLoadsAtCreation, blocks[], performedSessions[], createdAt, updatedAt }`
- `Block { id, sessionId, order, labelAssignments[], intensity Json?, timeCap Json?, notes?, schemas[], createdAt, updatedAt }`
- `BlockLabelAssignment { id, blockId, labelId, order }` — many-to-many с unique (blockId, labelId).
- `Schema { id, blockId, parentSchemaId?, order, kind, archetypeId, header?, archetypeParams Json, intensity Json?, trailingConnector Json?, notes?, rows[], pairings[], pairedBy[], createdAt, updatedAt }`
- `SchemaPairing { id, schemaAId, schemaBId, relationKind }` — для alternating-sets paired schemas.
- `SchemaRow { id, schemaId, order, rowKind, rowPayload Json, load Json?, reps Json?, side Json?, tempo Json?, position?, sequence Json?, intensity Json?, media Json?, compoundRep Json?, notes?, createdAt, updatedAt }`
- `Exercise { id, canonicalName, primaryEquipment, movementTypeTagPrimary, movementTypeTagSecondary?, defaultDemoUrl?, canonicalCompoundType, placeholderFlag, movementFamily?, defaultLoad Json?, aliases Json?, notes?, createdAt, updatedAt }`
- `Label { id, name, applicableLevels Json, notes?, createdAt, updatedAt }`
- `Archetype { id, name, kind, family, headerPatternDescription, bodyLayoutDescription, archetypeParamsSchema Json, relatedArchetypes Json, createdAt, updatedAt }`
- `Athlete { id, displayName, profileAttributes Json, oneRMRecords[], performedSessions[], createdAt, updatedAt }`
- `OneRMRecord { id, athleteId, exerciseId, valueKg, recordedAt, source }`
- `PerformedSession { id, sessionId, athleteId, startedAt, completedAt?, coachNotes?, athleteNotes?, performedExerciseInstances[] }` — unique (sessionId, athleteId).
- `PerformedExerciseInstance { id, performedSessionId, plannedSchemaRowId, actualLoad Json, actualReps Json, actualIntensity Json?, stageActuals Json?, notes? }`

**Enums**:

- `Equipment { BODYWEIGHT, DUMBBELL, KETTLEBELL, BARBELL, BAND, PARALLEL_BARS, RINGS, BOX, SOFA, BOX_OR_SOFA, MIXED, UNKNOWN }`
- `MovementType { SQUAT, HINGE, PRESS, PULL, LUNGE, CARRY, LOCOMOTION, STATIC_HOLD, ROTATIONAL, CARDIO_FLOW, UNKNOWN }`
- `CanonicalCompoundType { ATOMIC, COMPOUND_PLUS, COMPOSITE_NAMED, PLACEHOLDER, ALTERNATIVE_OR }`
- `SchemaKind { ATOMIC, HEADERLESS, NESTED, NAMED, COMPOSITE }`
- `RowKind { EXERCISE, REST, FOOTNOTE, STANDALONE_LOAD, STANDALONE_URL, PLACEHOLDER, INNER_LADDER_MARKER, REP_DEFINITION, CONNECTOR, REST_SLOT }`
- `ArchetypeFamily { ROUNDS_SETS, LADDER, TIME_CAP, COMPOSITE_ROUNDS, NESTED, NAMED, SINGLE_LINE_HEADERLESS, FLAT_PARALLEL_HEADERLESS, MODALITY_REFERENCE }`
- `Position { NEUTRAL_GRIP, FROM_SOFA, FROM_BOX, FROM_SOFA_BOX, WITHOUT_BENCH, WITHOUT_JUMP, HOLD_FARM_CARRY, HAND_ON_DB, HANDS_ON_DB }`
- `OneRMRecordSource { MANUAL, AUTO_INFERRED, TESTED }`
- `SchemaPairingRelation { ALTERNATING_SETS }` — extensible enum.

**Constraints**:

- Unique: `Exercise.canonicalName` (case-insensitive через unique index с lower()), `Label.name` (case-insensitive), `BlockLabelAssignment(blockId, labelId)`, `PerformedSession(sessionId, athleteId)`, `OneRMRecord(athleteId, exerciseId)` (latest-only or versioned — comment в schema).
- Foreign keys с ondelete cascade для container-child (Day → Session, Session → Block, etc.); restrict для library refs (Label, Exercise).

**Indexes** (минимальный набор):

- FKs (auto-indexed Prisma).
- `Exercise.canonicalName`, `Label.name` для lookup.
- `Schema(blockId, order)` для ordered scan.
- `SchemaRow(schemaId, order)` для ordered scan.

### Task 2 — TS types (`types.ts`)

Файл с TypeScript types:

- Export Prisma types (через `import { ... } from '@prisma/client'`).
- Custom VO types для Json columns:
  - `Load` discriminated union (5 variants).
  - `Weight` discriminated union (8 variants).
  - `Intensity` struct с optional fields.
  - `RepNotation` discriminated union.
  - `CompoundRepDefinition`, `PerLimbDistribution`, `TempoModifier`, `PositionEquipmentModifier`, `SequenceIndicator`, `DropSetProgram`, `PerSetSubstitution`, `OrAlternative`, `MediaReference`, `TimeCap`, `CyclicalCompound`, `SandwichCompound`, `CompoundRow`.
- `SchemaRowPayload` discriminated union (по `rowKind`).
- `ArchetypeParams` discriminated union (по archetype family + name).
- `ProfileAttributes` placeholder type для Athlete.profileAttributes.

**Naming**: PascalCase types, camelCase fields, UPPER_SNAKE_CASE enum values (match Prisma).

**Discriminated union format**:

```typescript
export type Load =
  | { kind: "absolute"; weight: Weight }
  | { kind: "percentage"; value: number; rangeMax?: number; reference: PercentageReference }
  | { kind: "bodyweight" }
  | { kind: "negative"; context: "drop_set_stage" }
  | { kind: "unspecified" };

export type Weight =
  | { variant: "single"; valueKg: number }
  | { variant: "dual"; valueKg: number }
  | { variant: "single_arm"; valueKg: number }
  | { variant: "compound_device"; equipment: Equipment; count: 1 | 2; valueKg: number }
  | { variant: "split_tier"; stages: { reps: number; equipment: Equipment; valueKg: number }[] }
  | { variant: "dual_value"; first: number; second: number; resolver: "athlete_profile" }
  | {
      variant: "with_asymmetric_arm";
      valueKg: number;
      workingArm: "left" | "right";
      passiveArmAction: "hold_in_up" | "hold_static";
    }
  | { variant: "with_depth_modifier"; valueKg: number; depth: "to_parallel" | "full_rom" };

// ... etc для всех VOs.
```

Не финализируй каждое поле maximally — обеспечь structural fidelity Phase 5 и leave room для UI extensions.

### Task 3 — Финальная ER (`er-final.md`)

Mermaid ER на основе Phase 5 + Phase 6 финализаций. Update vs Phase 5:

- Add `BLOCK_LABEL_ASSIGNMENT` (с `order` field) — explicit join table вместо M:N abstract.
- Add `SCHEMA_PAIRING` join table.
- Add `Session.freezeLoadsAtCreation` boolean field.
- Drop EASY PACE label from any Label-related сomment.
- Add canonical Exercise "Bulgarian split squats" — это note в commentary, not diagram.
- All enum values per Task 1.

Render-ready mermaid block.

### Task 4 — Stress test всех 33 листов (`stress-final.md`)

Для каждого из **198 block instances** из Phase 1 `block-instances.md`: verify fitment в финальную модель.

Подход:

- Group по archetype mapping (`schema-archetype-mapping.md`) — для каждого archetype выбрать 1-2 representative blocks + sample variation.
- Для каждой группы: document Prisma entity instances (psevdo-code) + verify все fields fill.
- Catalog gaps explicitly. **0 gaps required** для acceptance.

Не нужно verbose per-block описание — sample-based проверка покрытия + явный count "X/198 fit".

Если есть gap: эскалация в main session (явный flag).

### Task 5 — Implementation notes (`implementation-notes.md`)

Файл с:

- JSON shape examples для каждого embedded VO (TypeScript interface mirror).
- Zod schemas для validation на API boundaries (sample для 5-7 critical VOs).
- Resolution algorithms (pseudocode):
  - Compound trailing weight (DP4 a+c): "for each compound row, default load = trailing weight; per-element inline overrides; bodyweight elements skip".
  - Intensity partial overlay (Q3): "for each Intensity field independently: row.field ?? schema.field ?? block.field".
  - 1RM lookup (DP1 c): "find OneRMRecord by (athleteId, exerciseId); fallback: latest record для exercises с same movement_family".
  - Dual-value resolver (deferred placeholder).
  - Live formula resolution (DP2): "при render Session: if freezeLoadsAtCreation=false, resolve все Percentage loads through athlete's current 1RM; if true, use stored absolute".
- Migration considerations:
  - Order field default values (10, 20, 30, ... per Q6).
  - Label.applicableLevels default (non-empty, recommend ["block"] для legacy labels).
  - Exercise.defaultLoad nullable.

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/06-formalization/`:

1. `schema.prisma` — основной Prisma file (валидный синтаксис).
2. `types.ts` — TS types + Zod (опционально для critical VOs).
3. `er-final.md` — финальная mermaid ER.
4. `stress-final.md` — все 198 block instances fit (или явные gaps + escalation).
5. `implementation-notes.md` — JSON shapes + Zod + resolution algorithms + migration notes.

ACCEPTANCE

- Prisma schema syntactically valid (можно проверить локально `prisma validate` если есть env; иначе — careful manual review).
- TS types compile (TypeScript syntactically correct).
- ER final renders в mermaid.
- Stress test: 198/198 block instances fit без gaps. Любой gap = эскалация.
- All Q1-Q15 resolutions implemented в schema / types.
- Прочие resolutions (dual-value, RPE, cross-movement, MovementFamily, MediaReference, paired_with_schema) implemented.

ПРАВИЛА РАБОТЫ

- НЕ генерируй migrations (отдельная задача).
- НЕ создавай seed data (отдельная задача).
- НЕ касайся existing проекта code (`apps/`, `packages/`) — это greenfield analysis.
- НЕ выходи выше Day.
- НЕ модифицируй Phase 1-5 артефакты.
- НЕ память, web, video.
- НЕ читать вне `analysis/`.
- НЕ делегируй sub-agentам — Phase 6 требует tight synthesis.
- Russian content для documentation, English identifiers/code.
- Без эмодзи / подписей / комментариев в коде.

ВАЖНЫЕ ТЕХНИЧЕСКИЕ NOTES

- **Prisma version target**: Prisma 6 (project pnpm catalog). Используй современный синтаксис.
- **PostgreSQL** as datasource (project default).
- **CUID** для IDs (`cuid()` default).
- **Timestamps**: `createdAt @default(now())`, `updatedAt @updatedAt`.
- **Json columns** для embedded VOs — Prisma `Json` type. Validation на app layer через Zod.
- **No optional VOs as nullable strings** — используй `Json?` для всех polymorphic VOs.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко:

- Prisma entity count + relationship count.
- TS interfaces count.
- Stress test coverage (X/198).
- All Q1-Q15 resolutions verified implemented.
- Readiness for production implementation (any blockers).
