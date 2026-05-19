# Step 8.0b — Entity contract slice для Schema / SchemaRow / SchemaPairing / Archetype

> Self-contained executor prompt. **Read § 0 first.** Wrapper: `/feature small` per ratified OQ-7. Branch: existing `feat/training-domain` — branch-cut override mandatory per [[training-domain-workflow]].

---

## § 0 — Hard execution triggers (READ FIRST, BEFORE ANY WRITE)

### § 0.0 — Branch-cut override

Ship on the existing long-lived `feat/training-domain` branch. Do NOT cut a new branch under `/feature small`. Confirm before any commit:

```bash
git rev-parse --abbrev-ref HEAD   # must print: feat/training-domain
```

Per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` precedent.

### § 0.0.A — Verbatim source discipline

Before writing ANY code OR modifying ANY file, you MUST:

1. Read **verbatim** each source listed in § 2 + each § 0.X quote section.
2. Run **verbatim** each grep listed in § 0.A; reconcile actual outputs against expected.
3. Confirm `.husky/{pre-commit,pre-push}` + `turbo.json` + commitlint config per § 0.B + § 0.C.
4. If actual file content drifts from a § 0.X quote — STOP and escalate via `AskUserQuestion`.

Per `[[planner-verbatim-registration]]` flavour. Q-1 lesson из Step 8.0a output: planner cited conceptual paraphrases в § 0.10 prompt; this prompt aims к verbatim-copy-at-prompt-write-time discipline.

### § 0.0.B — Dep-cruiser `contracts-no-prisma` compliance (CRITICAL)

Per `.dependency-cruiser.cjs:26-33` — `@repo/contracts` forbids `@prisma/client` imports. Self-define all enum values mirroring Prisma enums via `as const` tuple + `z.enum(TUPLE)` per existing `lms/exercise/exercise.constants.ts` + `lms/_shared/enums.ts` (shipped Step 8.0a) patterns. **DO NOT** import `RowKind`, `SchemaKind`, `ArchetypeFamily`, `SchemaPairingRelation`, `Position` from `@prisma/client`. Self-define `as const` tuples в new entity slices.

### § 0.0.C — Adversarial pass discipline + Zod 3 library type-system constraints

Per `[[planner-lint-impact-trace]]` (extended Step 8.0a with library type-system axis):

- **Zod 3 discriminatedUnion limitation**: `z.discriminatedUnion(d, [variants])` принимает ТОЛЬКО pure `ZodObject` variants; inner `z.object({...}).refine(...)` returns `ZodEffects` → TS2345. Cross-field invariants must move к outer `.superRefine((v, ctx) => { switch (v[d]) ... ctx.addIssue({code: z.ZodIssueCode.custom, message}) })` wrapper.
- **Z.lazy() recursive types**: `schemaSchema` self-references through `parentSchemaId` + recursive `SchemaWithBody`. Zod recursive types через `z.lazy(() => ...)` wrap + explicit type annotation: `export const schemaSchema: z.ZodType<Schema> = z.lazy(() => ...)`. Without manual annotation TypeScript inference может collapse к `unknown`.

Per `[[planner-adversarial-review]]` axes для §3 phases:

- Concurrent / TOCTOU: N/A (no DB mutations)
- Partial inputs (subset/superset/empty/duplicates): cover в tests
- Malformed: cover (e.g., schemaSchema с parentSchemaId но kind ≠ ATOMIC → reject per sub-schema invariant)
- Boundary: max archetypeParams variants (34); recursive depth (sub-schema = atomic only per domain §1.5 invariant, single-level)
- Static analysis surfaces: ESLint + TS strict + dep-cruiser (covered above)
- Library type-system: Zod 3 (covered above)

### § 0.0.D — Wrapper choice ratified

`/feature small` per ratified OQ-7. Step 8.0a carve-out **does NOT apply** к 8.0b (touches `packages/api-server/prisma/schema.prisma` enum drop + analysis-artifacts — NOT single-package additive). Wrap в `/feature small` skill. Branch-cut override mandatory per § 0.0.

---

### § 0.1 — Verbatim quote: domain-model.md §1.4 Schema (lines 154-181)

```
### 1.4 Schema

**Purpose**: единица «как это исполняется» внутри Block — паттерн (ladder / sets×reps / EMOM / AMRAP / for-time / flat-list / single-line / parallel-ladders / ...).

**Attributes**:

- `id`.
- `order` — позиция внутри Block.
- `kind` — discriminator: `atomic` | `headerless` | `nested` | `named` | `composite`.
- `archetype` — reference на Archetype (34 catalog после Phase 7).
- `header` — string? (null для headerless; для остальных — текст header'а из Phase 2.1 ratified формы). **Для named-exercise-program archetype (Q11 Phase 7.1) — optional display override**: null → fallback `displayHeader = exercise.canonicalName + ":"`; non-null → bare display override (e.g., block-008 sample: `"Bulgarian split squats:"` поверх concrete sibling `DB Bulgarian split squats`).
- `archetype_params` — archetype-specific параметры (см. §3).
- `intensity` — optional Intensity VO (schema-level scope, inherits to rows).
- `body` — union: ordered SchemaRow[] (для atomic / headerless / named / composite) **или** ordered SubSchema[] (для nested).
- `trailing_connector` — optional ConnectorMarker (`then:` / `...then...:` / `...then N rounds:`; per Phase 2.1 — хранится в конце body предыдущей schema).

**Invariants**:

- `kind === 'nested'` ↔ body содержит SubSchema[], не SchemaRow[]. Mutually exclusive.
- `kind === 'headerless'` → `header === null`. Иначе `header` — non-empty string.
- `kind === 'named'` → `header` содержит имя exercise / theme (per Phase 2.2 archetype-named-themed-sets / -exercise-program).
- `kind === 'composite'` → `header` содержит `|`-separator с count + rest-spec / interval-cadence.
- Sub-schema всегда `kind === 'atomic'` (per archetype-emom-sub-minute-slot + Phase 2.1 emom case). Time-window-outer / nested-rounds-over-* — sub-schemas могут быть atomic или headerless (см. block-010 sub-1).
- `archetype` consistent с `kind` (см. §3 mapping table).
- Intensity inheritance: row.effective = row.intensity ⊕ schema.intensity ⊕ block.intensity (partial overlay per Phase 4 correction).
```

**Note**: «Sub-schema всегда `kind === 'atomic'`» имеет исключение по второй фразе («Time-window-outer / nested-rounds-over-\* — sub-schemas могут быть atomic или headerless»). Per ratified OQ-3 thesis-time hypothesis: enforce sub-schema kind ∈ {ATOMIC, HEADERLESS} в Zod refine; domain §1.5 says ATOMIC default, but §1.4 invariant explicitly allows HEADERLESS for two archetype families. **Executor verify exact set at prompt-execution time via Read of §1.5 lines 184-200**; widen refine to {ATOMIC, HEADERLESS} if confirmed.

### § 0.2 — Verbatim quote: domain-model.md §1.5 SubSchema (lines 184-198)

```
### 1.5 SubSchema

**Purpose**: вложенная schema внутри nested schema. Структурно — instance of Schema, но позиционирована внутри outer `body`.

**Attributes**: тот же набор что у Schema, но семантически `order` нумерует sub-positions (sub-1, sub-2, ...).

**Invariants**:

- Parent schema `kind === 'nested'`.
- SubSchema sам по себе не может быть nested (одноуровневое вложение — sample не показывает deeper, и архетипы не определяют).

**Sample evidence**: 25 sub-schemas total.

**Реализация**: концептуально SubSchema = Schema; различие — позиционирование. Phase 6 может моделировать как self-reference Schema (`parent_schema_id?`) либо как distinct entity. Phase 5 ratify: те же attributes, одна shape.
```

**Note for executor**: §1.5 invariant «SubSchema sам по себе не может быть nested» = Zod refine: `parentSchemaId !== undefined → kind !== "NESTED"` (one-level nesting only). Per D10 ratified — single recursive `schemaSchema` через `z.lazy()` + recursive `SchemaWithBody` type.

### § 0.3 — Verbatim quote: domain-model.md §1.6 SchemaRow discriminator (lines 201-293)

```
### 1.6 SchemaRow (discriminated union)

**Purpose**: per-row primitive внутри schema body (для non-nested schemas).

**Subtype discriminator** (`row_kind`):

#### 1.6.1 ExerciseRow
- `kind = "exercise"`. Fields: exercise (ref OR embedded CompoundRow/CyclicalCompound/SandwichCompound/OrAlternative), reps (RepNotation), load (optional Load), side (optional PerLimbDistribution), tempo (optional TempoModifier), position (optional PositionEquipmentModifier), sequence (optional SequenceIndicator), intensity (optional Intensity), media (optional MediaReference), compound_rep (optional CompoundRepDefinition), notes (optional free-text).

#### 1.6.2 InlineRestRow
- `kind = "rest"`. Fields: text (нормализованный rest-spec), scope (between_sets/between_rounds/between_intervals/after_specific_set), raw (оригинальная строка).

#### 1.6.3 FootnoteRow
- `kind = "footnote"`. Fields: marker (`*`|`**`), target (each_round/each_set/each_typed_round), content (CompoundRow).

#### 1.6.4 StandaloneLoadRow
- `kind = "standalone_load"`. Fields: load (Load VO), scope (`applies_to_all_preceding_rows`).

#### 1.6.5 StandaloneUrlRow
- `kind = "standalone_url"`. Fields: url (string), wrapped (bool), applies_to (`previous_exercise_row` default | `whole_schema`).

#### 1.6.6 PlaceholderRow
- `kind = "placeholder"`. Fields: placeholder_kind (muscle_group_reference/purpose_category/coach_choice_slot), text (string), per_set_assignments (optional PerSetSubstitution), paired_concrete (optional ExerciseRow ref).

#### 1.6.7 InnerLadderMarkerRow
- `kind = "inner_ladder_marker"`. Fields: steps (int[]), pairs_with_next_row (semantic flag).

#### 1.6.8 RepDefinitionRow
- `kind = "rep_definition"`. Fields: equality (CompoundRepDefinition VO с inline-equality form).

#### 1.6.9 ConnectorRow
- `kind = "connector"`. Fields: form (`then:`|`...then...:`|`...then_N_rounds`), rounds_count (optional integer).
**Note**: per Phase 2.1, connector хранится в конце body предыдущей schema. Альтернативная trabajo: вместо отдельной row — это `Schema.trailing_connector` field. **Решение Phase 5**: ConnectorRow — explicit row на хвосте body (одна строка, последняя). Это симметрично с `then:` и `...then N rounds:` continuation, упрощает iteration. Phase 6 решает persistence (отдельная row vs nullable field).
```

**🔴 CRITICAL per D12 ratified 2026-05-18**: §1.6.9 «Phase 5 ratify ConnectorRow as explicit row» **OVERRIDDEN** — `Schema.trailingConnector` field canonical; `RowKind.CONNECTOR` enum value DROPPED. § 0.5 Phase 7 details analysis-sync (§1.6.9 reframe + types.ts SchemaRowPayload variant removal + prisma RowKind enum drop).

### § 0.4 — Verbatim quote: domain-model.md §1.9 Archetype (lines 353-372)

```
### 1.9 Archetype

**Catalog tag**: **configuration** (per D4, 2026-05-12) — часть доменной модели; полный канонический набор (34 после Phase 7: 33 + super-set) **обязателен** при Step 2 seed. **Нет admin CRUD** — UI-редактирование archetype-каталога без синхронного апдейта parser/renderer бессмысленно. `archetypeParamsSchema Json` живёт в Prisma column (не enum), чтобы расширять каталог без code redeploy при необходимости.

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

**Sample**: 33 archetypes Phase 1-6 (см. `02-patterns/schema-archetypes.md` для полного списка) + **1 Phase 7 addition** `super-set` (Ext 5 / Q20) = 34 catalog total.
```

**Note для executor**: Archetype = read-only configuration в API surface; no CRUD endpoints. 8.0b ships только `archetypeSchema` (read) + `getArchetypesResponseSchema = z.array(archetypeSchema)`. Никаких create/update/delete schemas для Archetype.

### § 0.5 — Verbatim quote: `analysis/artifacts/06-formalization/types.ts` SchemaRowPayload + ArchetypeName + ArchetypeParams (lines 344-639)

Executor MUST Read at prompt-execution time — lines listed below for reference target:

- **lines 344-379**: `SchemaRowPayload` discriminated union — 10 variants currently; **drop CONNECTOR variant (lines 374-378) per D12**; resulting union = 9 variants.
- **lines 387-525**: per-archetype params types (LadderArchetypeParams, ArchetypeRoundsSetsParams, ..., ArchetypeSuperSetParams).
- **lines 527-561**: `ArchetypeName` 34 values (kebab-case identifiers).
- **lines 563-639**: `ArchetypeParams` discriminated union — 34 variants. **Reference target** для `archetypeParamsSchema` Zod design.
- **lines 641-644**: `TrailingConnector = { form: ConnectorForm; roundsCount?: number }` — reference target для `trailingConnectorSchema` Zod (с XOR refine per ratified OQ-6).
- **lines 653-657**: `SchemaWithBody { schema, rows, subSchemas: SchemaWithBody[] }` — recursive type, reference target для D10 ratified `schemaSchema` design.

### § 0.6 — Verbatim quote: `packages/api-server/prisma/schema.prisma` Schema/SchemaRow/SchemaPairing/Archetype models (lines 687-813)

Executor MUST Read at prompt-execution time. Models:

- **lines 543-554**: `enum RowKind { EXERCISE, REST, FOOTNOTE, STANDALONE_LOAD, STANDALONE_URL, PLACEHOLDER, INNER_LADDER_MARKER, REP_DEFINITION, CONNECTOR, REST_SLOT }` — **drop `CONNECTOR` value per D12** в Phase 6 commit.
- **lines 687-714**: `model Schema { ..., archetypeParams Json, intensity Json?, trailingConnector Json?, ... }` — reference target для `schemaSchema` Zod shape (Prisma JSON columns → Zod typed unions in contracts).
- **lines 716-728**: `model SchemaPairing { id, schemaAId, schemaBId, relationKind SchemaPairingRelation }` — flat M:N association.
- **lines 730-754**: `model SchemaRow { ..., rowKind RowKind, rowPayload Json, load Json?, reps Json?, side Json?, tempo Json?, position Position?, sequence Json?, intensity Json?, media Json?, compoundRep Json?, ... }` — reference target для `schemaRowSchema`.
- **lines 797-812**: `model Archetype { id, name, kind SchemaKind, family ArchetypeFamily, headerPatternDescription, bodyLayoutDescription, archetypeParamsSchema Json, relatedArchetypes Json }`.
- **lines 535-541**: `enum SchemaKind { ATOMIC, HEADERLESS, NESTED, NAMED, COMPOSITE }`.
- **lines 556-566**: `enum ArchetypeFamily { ROUNDS_SETS, LADDER, TIME_CAP, COMPOSITE_ROUNDS, NESTED, NAMED, SINGLE_LINE_HEADERLESS, FLAT_PARALLEL_HEADERLESS, MODALITY_REFERENCE }`.
- **lines 588-590**: `enum SchemaPairingRelation { ALTERNATING_SETS }`.
- **lines 568-580**: `enum Position { NEUTRAL_GRIP, FROM_SOFA, FROM_BOX, FROM_BOX_OR_SOFA, FROM_SOFA_BOX, WITHOUT_BENCH, WITHOUT_JUMP, HOLD_FARM_CARRY, HAND_ON_DB, HANDS_ON_DB, HAND_ON_DB_NEUTRAL_GRIP }` — 11 values (Step 8.0a `media.ts` already exports `POSITION_EQUIPMENT_MODIFIERS` const tuple).

### § 0.7 — Verbatim quote: `packages/contracts/src/entities/lms/exercise/exercise-api.schema.ts` (canonical API pair pattern)

```typescript
import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createExerciseSchema, exerciseSchema, updateExerciseSchema } from "./exercise.schema";

export const getExercisesResponseSchema = z.array(exerciseSchema);

export const getExerciseByIdParamsSchema = idParamSchema;

export const createExerciseRequestSchema = createExerciseSchema;

export const updateExerciseParamsSchema = idParamSchema;

export const updateExerciseRequestSchema = updateExerciseSchema;

export const deleteExerciseParamsSchema = idParamSchema;

export const getExercisesPageDataResponseSchema = z.object({
  exercises: getExercisesResponseSchema,
});

export const getMovementFamiliesResponseSchema = z.array(z.string());
```

`idParamSchema` imported from `../../../common`. Mirror pattern в new entity API schemas.

### § 0.8 — Verbatim quote: `packages/contracts/src/entities/lms/_shared/index.ts` (Step 8.0a output)

```typescript
export * from "./cap-spec";
export * from "./compounds";
export * from "./day-of-week";
export * from "./enums";
export * from "./intensity";
export * from "./load";
export * from "./media";
export * from "./reps";
export * from "./sequence";
export * from "./side";
export * from "./staged-program";
export * from "./tempo";
export * from "./time-cap";
export * from "./weight";
```

**8.0b will consume** (via `import { xxx } from "../_shared"`):

- `intensitySchema`, `Intensity` type
- `connectorFormSchema`, `CONNECTOR_FORMS`, `ConnectorForm` (for trailingConnectorSchema)
- `loadSchema`, `Load` (for SchemaRow STANDALONE_LOAD + Stage)
- `repNotationSchema`, `RepNotation` (for ArchetypeParams + SchemaRow REP_DEFINITION + ExerciseForm)
- `restSpecSchema`, `RestSpec` (for ArchetypeParams + Stage)
- `slotSpecSchema`, `SlotSpec` (for ArchetypeParams emom-sub-minute-slot)
- `exerciseFormSchema` (for SchemaRow EXERCISE)
- `compoundRepDefinitionSchema` (for SchemaRow REP_DEFINITION)
- `mediaReferenceSchema` (for SchemaRow STANDALONE_URL + Stage)
- `placeholderPayloadSchema` (for SchemaRow PLACEHOLDER)
- `compoundRowSchema` (for SchemaRow FOOTNOTE.content)
- `stagedProgramSchema` (for ArchetypeParams named-exercise-program)
- `footnoteTargetSchema`, `standaloneLoadScopeSchema`, `countFormSchema` (per-row-payload enum surfaces)

### § 0.9 — Verbatim quote: `packages/contracts/src/entities/lms/index.ts` (current top-level barrel)

```typescript
export * from "./_shared";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

**8.0b will add 4 entries**:

```typescript
export * from "./_shared";
export * from "./archetype";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./schema";
export * from "./schema-pairing";
export * from "./schema-row";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

Strict alphabetic. 13 exports total (9 existing + 4 new).

### § 0.10 — Verbatim quote: `.dependency-cruiser.cjs` lms-relevant rules (lines 26-110)

```javascript
{
  name: "contracts-no-prisma",
  severity: "error",
  comment:
    "@repo/contracts is a pure zod schema package. It must not import Prisma types — " +
    "the contracts is the API contract, Prisma is the DB reality, and they can drift. " +
    "Use the mapper layer in @repo/api-server to bridge.",
  from: { path: "^packages/contracts/" },
  to: { path: "@prisma/client" },
},
{
  name: "contracts-lms-no-coaching-cms-billing",
  ...
  from: { path: "^packages/contracts/src/entities/lms/" },
  to: { path: "^packages/contracts/src/entities/(coaching|cms|billing)/" },
},
```

**Executor MUST Read verbatim at prompt-execution time** (lines 26-110 of `.dependency-cruiser.cjs`). Step 8.0a Q-1 lesson: planner-side paraphrase ≠ actual file content; copy verbatim at execution time.

---

### § 0.A — Grep enumeration (run verbatim at execution time)

Each grep has expected outcome documented. If actual differs — STOP and `AskUserQuestion`.

```bash
# 1. Confirm zero @prisma/client imports in contracts package
grep -rn 'from "@prisma/client"' packages/contracts/src/ 2>/dev/null
# expect: 0 matches

# 2. Confirm zero z.nativeEnum in lms entity slices (pattern compliance)
grep -rn "z\.nativeEnum" packages/contracts/src/entities/lms/ 2>/dev/null
# expect: 0 matches

# 3. Enumerate existing lms/ entity directories (verify 9 baseline)
ls -d packages/contracts/src/entities/lms/*/
# expect: _shared block day exercise label plan-enrollment session training-plan week (9 directories)

# 4. Confirm zero RowKind.CONNECTOR references в api-server (commit-strategy precondition per OQ-9)
grep -rn 'RowKind\.CONNECTOR\|"CONNECTOR"' packages/api-server/src/ 2>/dev/null
# expect: 0 matches (verified pre-prompt 2026-05-18; re-confirm at execution time)

# 5. Confirm zero RowKind.CONNECTOR references в apps
grep -rn 'RowKind\.CONNECTOR\|"CONNECTOR"' apps/ 2>/dev/null
# expect: 0 matches

# 6. Find RowKind enum в Prisma schema for drop scope
grep -n "enum RowKind\|CONNECTOR" packages/api-server/prisma/schema.prisma
# expect: enum RowKind at line ~543, CONNECTOR value within

# 7. Find SchemaRowPayload CONNECTOR variant в types.ts for drop scope
grep -n '"CONNECTOR"\|rowKind: "CONNECTOR"' analysis/artifacts/06-formalization/types.ts
# expect: lines 374-378 (variant block)

# 8. Find RowKind enum в analysis schema mirror
grep -n "enum RowKind\|CONNECTOR" analysis/artifacts/06-formalization/schema.prisma
# expect: enum RowKind, CONNECTOR value

# 9. Find §1.6.9 ConnectorRow paragraph для reframe
grep -n "1.6.9\|ConnectorRow" analysis/artifacts/05-synthesis/domain-model.md
# expect: §1.6.9 header + Phase 5 ratify paragraph

# 10. Confirm Step 8.0a VOs available for import
grep -n "export" packages/contracts/src/entities/lms/_shared/index.ts
# expect: 14 export lines (Step 8.0a barrel state)

# 11. Verify idParamSchema location for new entity API schemas
grep -rn "export.*idParamSchema" packages/contracts/src/common/ 2>/dev/null
# expect: 1+ match (canonical id-param schema for getById/update/delete params)
```

---

### § 0.B — Husky verifications (verbatim from `.husky/`)

`.husky/pre-commit`:

```
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

`.husky/pre-push`:

```
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**Implications для 8.0b commit strategy**:

- Phase 1-5 (entity slices + barrel) = single-package additive (`@repo/contracts` only). No downstream consumers yet.
- Phase 6 (drop `RowKind.CONNECTOR` в prisma) = api-server package re-generates Prisma client. Per § 0.A grep 4 + 5 (zero references) — atomic safe; no broken intermediate. **Verify at execution time before commit.**
- Phase 7 (analysis-sync) = doc-only; pre-commit hooks pass-through.
- Per `[[husky-cross-package-squash]]` flavour (e) — squash NOT required at this granularity per pre-condition; per-layer atomic OK.

### § 0.C — Commitlint verification

Subject ≤100 chars lowercase only. Body lines ≤100 chars safety margin per Step 7.4 Q-4 + Step 7.5 D-1 precedent. Avoid em-dashes near boundary + avoid `Word: value` patterns at body end.

---

## § 1 — Goal

Ship entity contract slice consuming Step 8.0a VOs. 4 new entity directories в `packages/contracts/src/entities/lms/{schema, schema-row, schema-pairing, archetype}/` mirror `block/`/`exercise/`/`label/` pattern. `schemaSchema` через self-reference `parentSchemaId` + recursive `SchemaWithBody` type (D10). `archetypeParamsSchema` flat 34-variant discriminated union per types.ts:563-639 canonical. `schemaRowPayloadSchema` 9-variant union (drops CONNECTOR per D12). Drop `RowKind.CONNECTOR` value в `packages/api-server/prisma/schema.prisma`. Sync analysis-artifacts (06-formalization/schema.prisma mirror + types.ts SchemaRowPayload variant drop + domain-model.md §1.6.9 reframe + implementation-notes addendum).

Acceptance: all 4 entity slices typecheck strict, ~150-200 test cases pass, baseline checks all-green per § 7. Smoke-test N/A (contract-only step + read-only Prisma drop; downstream consumer = Step 8.1a `lmsSchemaApi`).

Per Step 8 top-level thesis D9 split policy — second sub-step of Step 8. Wrap в `/feature small` per ratified OQ-7. Branch-cut override mandatory per `[[training-domain-workflow]]`.

---

## § 2 — Inputs (verbatim sources MUST be read at execution time)

| Source                                                                                                                                                                                   | Lines                                                                         | Purpose                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `analysis/artifacts/05-synthesis/domain-model.md`                                                                                                                                        | §1.4 (154-181), §1.5 (184-198), §1.6 (201-293), §1.9 (353-372), §3 (914-1019) | per-entity domain semantics + invariants + archetype family mapping                             |
| `analysis/artifacts/06-formalization/types.ts`                                                                                                                                           | 344-379, 387-639, 641-644, 653-657                                            | canonical TS shapes for SchemaRowPayload + ArchetypeParams + TrailingConnector + SchemaWithBody |
| `analysis/artifacts/06-formalization/implementation-notes.md`                                                                                                                            | §1.7 (438-495), §4.5 (1269-1318)                                              | ArchetypeParams JSON samples + Archetype seed catalog reference                                 |
| `analysis/artifacts/06-formalization/schema.prisma`                                                                                                                                      | full (413 LOC)                                                                | Prisma DSL mirror — RowKind enum drop scope в Phase 7                                           |
| `packages/api-server/prisma/schema.prisma`                                                                                                                                               | 535-541, 543-554, 556-566, 568-580, 588-590, 687-813                          | live Prisma model для Schema/SchemaRow/SchemaPairing/Archetype + enums                          |
| `packages/contracts/src/entities/lms/_shared/{index, intensity, load, reps, cap-spec, tempo, side, sequence, media, staged-program, compounds, enums, weight, time-cap, day-of-week}.ts` | full                                                                          | Step 8.0a VO infrastructure — entity slices consume                                             |
| `packages/contracts/src/entities/lms/block/{block.constants, block.schema, block.schema.test, block.types, block-api.schema, block-api.schema.test, block-api.types, index}.ts`          | full                                                                          | Step 7.0 canonical entity slice pattern (8-file structure target)                               |
| `packages/contracts/src/entities/lms/exercise/{exercise.constants, exercise.schema, exercise.schema.test, exercise.types, exercise-api.schema, exercise-api.types, index}.ts`            | full                                                                          | Step 4 canonical entity slice (7-file structure variant — без api.schema.test)                  |
| `packages/contracts/src/common/`                                                                                                                                                         | full                                                                          | `idParamSchema` location для new entity API schemas                                             |
| `packages/contracts/src/entities/lms/index.ts`                                                                                                                                           | full                                                                          | barrel update target (9 → 13 exports)                                                           |
| `.dependency-cruiser.cjs`                                                                                                                                                                | 26-110                                                                        | confirm contracts-no-prisma + contracts-lms boundary rules                                      |
| `.husky/{pre-commit, pre-push}`                                                                                                                                                          | full                                                                          | confirm commit-strategy gates per § 0.B                                                         |
| `turbo.json`                                                                                                                                                                             | full                                                                          | confirm task pipelines                                                                          |
| `commitlint.config.{js,cjs,mjs,ts}` (whichever exists)                                                                                                                                   | full                                                                          | confirm subject/body length caps + lowercase rule                                               |

---

## § 3 — Implementation phases

7 phases. Commit strategy per § 6: 4 commits total (Phase 1-5 atomic code + Phase 6 prisma + Phase 7 analysis-sync + docs).

### Phase 1 — `lms/schema/` entity slice (8 files)

Files (mirror Step 7.0 block/ structure):

#### Phase 1.1 — `schema.constants.ts`

```typescript
export const SCHEMA_CONSTANTS = {
  MAX_HEADER_LENGTH: 500,
  MAX_NOTES_LENGTH: 2000,
} as const;

export const SCHEMA_KINDS = ["ATOMIC", "HEADERLESS", "NESTED", "NAMED", "COMPOSITE"] as const;
export type SchemaKind = (typeof SCHEMA_KINDS)[number];

export const SUB_SCHEMA_ALLOWED_KINDS = ["ATOMIC", "HEADERLESS"] as const;
export type SubSchemaAllowedKind = (typeof SUB_SCHEMA_ALLOWED_KINDS)[number];

export const ARCHETYPE_FAMILIES = [
  "ROUNDS_SETS",
  "LADDER",
  "TIME_CAP",
  "COMPOSITE_ROUNDS",
  "NESTED",
  "NAMED",
  "SINGLE_LINE_HEADERLESS",
  "FLAT_PARALLEL_HEADERLESS",
  "MODALITY_REFERENCE",
] as const;
export type ArchetypeFamily = (typeof ARCHETYPE_FAMILIES)[number];

export const ARCHETYPE_NAMES = [
  "n-rounds",
  "alternating-sets",
  "ladder-descending",
  "ladder-ascending",
  "ladder-vertex-down-pyramid",
  "ladder-spike",
  "parallel-ladders-descending",
  "parallel-ladders-mixed-direction",
  "parallel-pyramids",
  "amrap-flat",
  "emom-nested-per-minute",
  "emom-sub-minute-slot",
  "time-window-outer",
  "composite-rounds-with-rest",
  "composite-intervals-then-rounds",
  "composite-intervals-work-rest-fixed",
  "composite-intervals-work-rest-progressive",
  "composite-intervals-on-off-max-tail",
  "composite-rolling-rounds",
  "nested-rounds-over-rounds",
  "nested-rounds-over-parallel-ladder",
  "nested-composite-rounds-over-ladder",
  "named-themed-sets",
  "named-exercise-program",
  "single-line-with-then-connector",
  "single-line-bare",
  "single-line-total-counter",
  "flat-list-headerless",
  "pull-ups-dips-cycle",
  "run-distance",
  "placeholder-body",
  "practice-list",
  "url-only-body",
  "super-set",
] as const;
export type ArchetypeName = (typeof ARCHETYPE_NAMES)[number];
```

#### Phase 1.2 — `schema.schema.ts`

```typescript
import { z } from "zod";

import {
  connectorFormSchema,
  compoundRowSchema,
  exerciseFormSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  repNotationSchema,
  restSpecSchema,
  slotSpecSchema,
  stagedProgramSchema,
} from "../_shared";

import {
  ARCHETYPE_FAMILIES,
  ARCHETYPE_NAMES,
  SCHEMA_CONSTANTS,
  SCHEMA_KINDS,
  SUB_SCHEMA_ALLOWED_KINDS,
} from "./schema.constants";

export const schemaKindSchema = z.enum(SCHEMA_KINDS);
export const archetypeFamilySchema = z.enum(ARCHETYPE_FAMILIES);
export const archetypeNameSchema = z.enum(ARCHETYPE_NAMES);

// trailing connector — Schema.trailingConnector field per D12
export const trailingConnectorSchema = z
  .object({
    form: connectorFormSchema,
    roundsCount: z.number().int().positive().optional(),
  })
  .superRefine((c, ctx) => {
    if (c.form === "then_n_rounds" && c.roundsCount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "roundsCount required when form is then_n_rounds",
      });
    }
    if (c.form !== "then_n_rounds" && c.roundsCount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "roundsCount only allowed when form is then_n_rounds",
      });
    }
  });

// archetypeParamsSchema — flat 34-variant discriminated union per OQ-2 ratified
// Reference: types.ts:563-639. Self-define sub-types для archetypes that take params.
// EXECUTOR: implement all 34 variants per types.ts:387-525 sub-types. Sample shapes below;
// MUST cover ALL 34 ArchetypeName values; use Record<string, never> for archetypes with empty params
// (single-line-bare / flat-list-headerless / pull-ups-dips-cycle / placeholder-body / practice-list / url-only-body / single-line-with-then-connector — 7 empty-param archetypes).

const exactOrRangeSchema = z.union([
  z.number().int().positive(),
  z
    .object({
      min: z.number().int().positive(),
      max: z.number().int().positive(),
    })
    .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
]);

const countFormUnion = z.union([
  z.object({ countForm: z.literal("exact"), count: z.number().int().positive() }),
  z.object({
    countForm: z.literal("range"),
    countRange: z
      .object({
        min: z.number().int().positive(),
        max: z.number().int().positive(),
      })
      .refine((r) => r.min < r.max),
  }),
  z.object({
    countForm: z.literal("count_times_reps"),
    count: z.number().int().positive(),
    repsPerSet: z.number().int().positive(),
  }),
]);

// Sample variant (n-rounds):
const archetypeRoundsSetsParamsSchema = z.object({
  countForm: z.enum(["exact", "range", "count_times_reps"]),
  count: z.number().int().positive().optional(),
  countRange: z
    .object({ min: z.number().int().positive(), max: z.number().int().positive() })
    .optional(),
  repsPerSet: z.number().int().positive().optional(),
  rest: restSpecSchema.optional(),
});

const ladderArchetypeParamsSchema = z.object({
  steps: z.array(z.number().int().positive()).min(1),
});

const parallelLadderEntrySchema = z.object({
  steps: z.array(z.number().int().positive()).min(1),
  pairedWithInnerRowId: z.string().cuid().optional(),
  direction: z.enum(["asc", "desc"]).optional(),
});

const archetypeAlternatingSetsParamsSchema = z.object({
  setEnumeration: z.array(z.number().int().positive()).min(1),
  pairedWithSchemaId: z.string().cuid().optional(),
});

const archetypeAmrapFlatParamsSchema = z.object({
  durationMin: z.number().int().positive(),
});

const archetypeEmomNestedParamsSchema = z.object({
  durationMin: z.number().int().positive(),
  rounds: z.number().int().positive().optional(),
});

const archetypeEmomSubSlotParamsSchema = z.object({ slot: slotSpecSchema });

const archetypeTimeWindowOuterParamsSchema = z.object({
  window: z.object({
    startHhMm: z.string().regex(/^\d{1,2}:\d{2}$/),
    endHhMm: z.string().regex(/^\d{1,2}:\d{2}$/),
  }),
});

const archetypeCompositeRoundsWithRestParamsSchema = z.object({
  count: exactOrRangeSchema,
  rest: restSpecSchema,
});

const archetypeCompositeIntervalsThenRoundsParamsSchema = z.object({
  intervalsCount: z.number().int().positive(),
  restMin: z.number().int().positive(),
  innerRounds: z.number().int().positive(),
  preambleExercise: exerciseFormSchema,
  preambleReps: repNotationSchema,
});

const archetypeCompositeIntervalsWorkRestFixedParamsSchema = z.object({
  intervalsCount: z.number().int().positive(),
  workMin: z.number().int().positive(),
  restMin: z.number().int().positive(),
});

const archetypeCompositeIntervalsWorkRestProgressiveParamsSchema = z.object({
  sets: z.number().int().positive(),
  workMin: z.number().int().positive(),
  offMin: z.number().int().positive(),
  progressiveSeed: z.string().min(1),
});

const archetypeCompositeIntervalsOnOffMaxTailParamsSchema = z.object({
  intervals: z.number().int().positive(),
  onMin: z.number().int().positive(),
  offMin: z.number().int().positive(),
  tailExerciseId: z.string().cuid(),
});

const archetypeCompositeRollingRoundsParamsSchema = z.object({
  everyNthMin: z.number().int().positive(),
  rounds: z.number().int().positive(),
  totalMin: z.number().int().positive(),
});

const archetypeNestedRoundsOverRoundsParamsSchema = z.object({ outerCount: exactOrRangeSchema });
const archetypeNestedRoundsOverParallelLadderParamsSchema = z.object({
  outerCount: exactOrRangeSchema,
});
const archetypeNestedCompositeRoundsOverLadderParamsSchema = z.object({
  outerCount: z.number().int().positive(),
  rest: restSpecSchema,
});

const archetypeNamedThemedSetsParamsSchema = z.object({
  count: exactOrRangeSchema,
  theme: z.string().min(1),
});

const archetypeNamedExerciseProgramParamsSchema = z.object({
  exerciseId: z.string().cuid(),
  program: stagedProgramSchema,
});

const archetypeSingleLineTotalCounterParamsSchema = z.object({
  totalFlag: z.literal(true),
});

const archetypeParallelLaddersDescendingParamsSchema = z.object({
  ladders: z.array(parallelLadderEntrySchema).min(1),
});
const archetypeParallelLaddersMixedDirectionParamsSchema = z.object({
  ladders: z.array(parallelLadderEntrySchema).min(1),
});
const archetypeParallelPyramidsParamsSchema = z.object({
  pyramids: z.array(parallelLadderEntrySchema).min(1),
});

const superSetPairSchema = z.object({
  label: z.string().min(1),
  schemaRows: z.array(z.string().cuid()).min(2),
});

const archetypeSuperSetParamsSchema = z.object({
  pairs: z.array(superSetPairSchema).min(1),
  restBetweenPairs: restSpecSchema.optional(),
  rounds: z.number().int().positive(),
});

const archetypeRunDistanceParamsSchema = z.object({
  modality: z.literal("RUN"),
  distance: z
    .object({
      unit: z.literal("km"),
      value: z.number().positive().optional(),
      range: z
        .object({
          min: z.number().positive(),
          max: z.number().positive(),
        })
        .optional(),
    })
    .optional(),
});

const emptyParamsSchema = z.object({}).strict();

// Flat 34-variant discriminated union per OQ-2:
export const archetypeParamsSchema = z.discriminatedUnion("archetype", [
  z.object({ archetype: z.literal("n-rounds"), params: archetypeRoundsSetsParamsSchema }),
  z.object({
    archetype: z.literal("alternating-sets"),
    params: archetypeAlternatingSetsParamsSchema,
  }),
  z.object({ archetype: z.literal("ladder-descending"), params: ladderArchetypeParamsSchema }),
  z.object({ archetype: z.literal("ladder-ascending"), params: ladderArchetypeParamsSchema }),
  z.object({
    archetype: z.literal("ladder-vertex-down-pyramid"),
    params: ladderArchetypeParamsSchema,
  }),
  z.object({ archetype: z.literal("ladder-spike"), params: ladderArchetypeParamsSchema }),
  z.object({
    archetype: z.literal("parallel-ladders-descending"),
    params: archetypeParallelLaddersDescendingParamsSchema,
  }),
  z.object({
    archetype: z.literal("parallel-ladders-mixed-direction"),
    params: archetypeParallelLaddersMixedDirectionParamsSchema,
  }),
  z.object({
    archetype: z.literal("parallel-pyramids"),
    params: archetypeParallelPyramidsParamsSchema,
  }),
  z.object({ archetype: z.literal("amrap-flat"), params: archetypeAmrapFlatParamsSchema }),
  z.object({
    archetype: z.literal("emom-nested-per-minute"),
    params: archetypeEmomNestedParamsSchema,
  }),
  z.object({
    archetype: z.literal("emom-sub-minute-slot"),
    params: archetypeEmomSubSlotParamsSchema,
  }),
  z.object({
    archetype: z.literal("time-window-outer"),
    params: archetypeTimeWindowOuterParamsSchema,
  }),
  z.object({
    archetype: z.literal("composite-rounds-with-rest"),
    params: archetypeCompositeRoundsWithRestParamsSchema,
  }),
  z.object({
    archetype: z.literal("composite-intervals-then-rounds"),
    params: archetypeCompositeIntervalsThenRoundsParamsSchema,
  }),
  z.object({
    archetype: z.literal("composite-intervals-work-rest-fixed"),
    params: archetypeCompositeIntervalsWorkRestFixedParamsSchema,
  }),
  z.object({
    archetype: z.literal("composite-intervals-work-rest-progressive"),
    params: archetypeCompositeIntervalsWorkRestProgressiveParamsSchema,
  }),
  z.object({
    archetype: z.literal("composite-intervals-on-off-max-tail"),
    params: archetypeCompositeIntervalsOnOffMaxTailParamsSchema,
  }),
  z.object({
    archetype: z.literal("composite-rolling-rounds"),
    params: archetypeCompositeRollingRoundsParamsSchema,
  }),
  z.object({
    archetype: z.literal("nested-rounds-over-rounds"),
    params: archetypeNestedRoundsOverRoundsParamsSchema,
  }),
  z.object({
    archetype: z.literal("nested-rounds-over-parallel-ladder"),
    params: archetypeNestedRoundsOverParallelLadderParamsSchema,
  }),
  z.object({
    archetype: z.literal("nested-composite-rounds-over-ladder"),
    params: archetypeNestedCompositeRoundsOverLadderParamsSchema,
  }),
  z.object({
    archetype: z.literal("named-themed-sets"),
    params: archetypeNamedThemedSetsParamsSchema,
  }),
  z.object({
    archetype: z.literal("named-exercise-program"),
    params: archetypeNamedExerciseProgramParamsSchema,
  }),
  z.object({ archetype: z.literal("single-line-with-then-connector"), params: emptyParamsSchema }),
  z.object({ archetype: z.literal("single-line-bare"), params: emptyParamsSchema }),
  z.object({
    archetype: z.literal("single-line-total-counter"),
    params: archetypeSingleLineTotalCounterParamsSchema,
  }),
  z.object({ archetype: z.literal("flat-list-headerless"), params: emptyParamsSchema }),
  z.object({ archetype: z.literal("pull-ups-dips-cycle"), params: emptyParamsSchema }),
  z.object({ archetype: z.literal("run-distance"), params: archetypeRunDistanceParamsSchema }),
  z.object({ archetype: z.literal("placeholder-body"), params: emptyParamsSchema }),
  z.object({ archetype: z.literal("practice-list"), params: emptyParamsSchema }),
  z.object({ archetype: z.literal("url-only-body"), params: emptyParamsSchema }),
  z.object({ archetype: z.literal("super-set"), params: archetypeSuperSetParamsSchema }),
]);

// schemaSchema — recursive self-reference per D10
// Type alias declared upfront для z.lazy() type inference
export type Schema = {
  id: string;
  blockId: string;
  parentSchemaId: string | null;
  order: number;
  kind: z.infer<typeof schemaKindSchema>;
  archetypeId: string;
  header: string | null;
  archetypeParams: z.infer<typeof archetypeParamsSchema>;
  intensity: z.infer<typeof intensitySchema> | null;
  trailingConnector: z.infer<typeof trailingConnectorSchema> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const schemaSchema: z.ZodType<Schema> = z.lazy(() =>
  z.object({
    id: z.string().cuid(),
    blockId: z.string().cuid(),
    parentSchemaId: z.string().cuid().nullable(),
    order: z.number().int().positive(),
    kind: schemaKindSchema,
    archetypeId: z.string().cuid(),
    header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable(),
    archetypeParams: archetypeParamsSchema,
    intensity: intensitySchema.nullable(),
    trailingConnector: trailingConnectorSchema.nullable(),
    notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

// Sub-schema invariant per domain §1.5 — parentSchemaId !== null → kind ∈ {ATOMIC, HEADERLESS}
// Applied via outer refine pattern (Step 8.0a D-1 lesson — refines on discriminatedUnion variants impossible).
// schemaSchema does NOT use discriminatedUnion (uses kind enum, not discriminator), so inner refine OK.
// Use .superRefine to add invariant без breaking z.lazy:
export const schemaSchemaWithInvariants = schemaSchema.superRefine((s, ctx) => {
  if (s.parentSchemaId !== null) {
    if (!SUB_SCHEMA_ALLOWED_KINDS.includes(s.kind as (typeof SUB_SCHEMA_ALLOWED_KINDS)[number])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kind"],
        message: `sub-schema kind must be one of ${SUB_SCHEMA_ALLOWED_KINDS.join(", ")} (parentSchemaId !== null)`,
      });
    }
  }
});

// Form schemas (create/update — body for API requests)
export const createSchemaSchema = z.object({
  blockId: z.string().cuid(),
  parentSchemaId: z.string().cuid().nullable().optional(),
  kind: schemaKindSchema,
  archetypeId: z.string().cuid(),
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
  archetypeParams: archetypeParamsSchema,
  intensity: intensitySchema.nullable().optional(),
  trailingConnector: trailingConnectorSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const updateSchemaSchema = createSchemaSchema.partial();

export const reorderSchemasSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
```

**Note для executor**: z.lazy + explicit type annotation is canonical Zod 3 recursive pattern. Without `: z.ZodType<Schema>` annotation, TypeScript inference collapses к `unknown`. Verify TypeScript compile + ESLint pass after each Phase commit.

#### Phase 1.3 — `schema.schema.test.ts`

Test coverage targets (~50-70 cases):

- schemaKindSchema: 5 valid + 1 invalid (lowercase rejection)
- archetypeFamilySchema: 9 valid + 1 invalid
- archetypeNameSchema: 34 valid (loop) + 1 invalid
- trailingConnectorSchema: form=`then` без roundsCount valid; form=`then_n_rounds` с roundsCount=3 valid; form=`then_n_rounds` без roundsCount reject; form=`then` с roundsCount reject (XOR refine)
- archetypeParamsSchema: each of 34 variants happy + 1 unknown archetype reject; emptyParamsSchema strict (rejects extra keys); cross-variant param mismatch reject (e.g., `archetype:"n-rounds"` с `params:{durationMin:10}` rejected)
- schemaSchema (with invariants): top-level happy (parentSchemaId=null + kind=NESTED valid); sub-schema happy (parentSchemaId set + kind=ATOMIC valid); sub-schema HEADERLESS valid (per domain §1.4 invariant); sub-schema NESTED reject (parentSchemaId set + kind=NESTED rejected per invariant); sub-schema NAMED reject; sub-schema COMPOSITE reject
- createSchemaSchema / updateSchemaSchema: basic happy paths + partial update
- reorderSchemasSchema: duplicates reject + empty array reject

#### Phase 1.4 — `schema.types.ts`

```typescript
import { type z } from "zod";

import {
  type archetypeParamsSchema,
  type createSchemaSchema,
  type reorderSchemasSchema,
  type schemaSchema,
  type trailingConnectorSchema,
  type updateSchemaSchema,
} from "./schema.schema";

export type Schema = z.infer<typeof schemaSchema>;
export type CreateSchemaData = z.infer<typeof createSchemaSchema>;
export type UpdateSchemaData = z.infer<typeof updateSchemaSchema>;
export type ReorderSchemasData = z.infer<typeof reorderSchemasSchema>;
export type ArchetypeParams = z.infer<typeof archetypeParamsSchema>;
export type TrailingConnector = z.infer<typeof trailingConnectorSchema>;

// Recursive type per types.ts:653-657 — Schema body
export type SchemaWithBody = {
  schema: Schema;
  rows: import("../schema-row").SchemaRow[];
  subSchemas: SchemaWithBody[];
};
```

#### Phase 1.5 — `schema-api.schema.ts`

```typescript
import { z } from "zod";

import { idParamSchema } from "../../../common";

import {
  createSchemaSchema,
  schemaSchema,
  updateSchemaSchema,
  reorderSchemasSchema,
} from "./schema.schema";

export const getSchemasResponseSchema = z.array(schemaSchema);
export const getSchemaByIdParamsSchema = idParamSchema;
export const createSchemaRequestSchema = createSchemaSchema;
export const updateSchemaParamsSchema = idParamSchema;
export const updateSchemaRequestSchema = updateSchemaSchema;
export const deleteSchemaParamsSchema = idParamSchema;
export const reorderSchemasRequestSchema = reorderSchemasSchema;
export const reorderSchemasResponseSchema = z.object({
  schemas: getSchemasResponseSchema,
});
```

#### Phase 1.6 — `schema-api.schema.test.ts` (~15 cases)

Mirror block-api.schema.test.ts pattern: response array shape, idParamSchema params validation, request body forwarding to underlying form schemas.

#### Phase 1.7 — `schema-api.types.ts`

```typescript
import { type z } from "zod";

import {
  type createSchemaRequestSchema,
  type deleteSchemaParamsSchema,
  type getSchemaByIdParamsSchema,
  type getSchemasResponseSchema,
  type reorderSchemasRequestSchema,
  type reorderSchemasResponseSchema,
  type updateSchemaParamsSchema,
  type updateSchemaRequestSchema,
} from "./schema-api.schema";

export type GetSchemasResponse = z.infer<typeof getSchemasResponseSchema>;
export type GetSchemaByIdParams = z.infer<typeof getSchemaByIdParamsSchema>;
export type CreateSchemaRequest = z.infer<typeof createSchemaRequestSchema>;
export type UpdateSchemaParams = z.infer<typeof updateSchemaParamsSchema>;
export type UpdateSchemaRequest = z.infer<typeof updateSchemaRequestSchema>;
export type DeleteSchemaParams = z.infer<typeof deleteSchemaParamsSchema>;
export type ReorderSchemasRequest = z.infer<typeof reorderSchemasRequestSchema>;
export type ReorderSchemasResponse = z.infer<typeof reorderSchemasResponseSchema>;
```

#### Phase 1.8 — `schema/index.ts`

```typescript
export * from "./schema.constants";
export * from "./schema.schema";
export * from "./schema.types";
export * from "./schema-api.schema";
export * from "./schema-api.types";
```

---

### Phase 2 — `lms/schema-row/` entity slice (8 files)

#### Phase 2.1 — `schema-row.constants.ts`

```typescript
export const SCHEMA_ROW_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;

// 9 row kinds — CONNECTOR DROPPED per D12 (was 10)
export const ROW_KINDS = [
  "EXERCISE",
  "REST",
  "FOOTNOTE",
  "STANDALONE_LOAD",
  "STANDALONE_URL",
  "PLACEHOLDER",
  "INNER_LADDER_MARKER",
  "REP_DEFINITION",
  "REST_SLOT",
] as const;
export type RowKind = (typeof ROW_KINDS)[number];

export const POSITIONS = [
  "NEUTRAL_GRIP",
  "FROM_SOFA",
  "FROM_BOX",
  "FROM_BOX_OR_SOFA",
  "FROM_SOFA_BOX",
  "WITHOUT_BENCH",
  "WITHOUT_JUMP",
  "HOLD_FARM_CARRY",
  "HAND_ON_DB",
  "HANDS_ON_DB",
  "HAND_ON_DB_NEUTRAL_GRIP",
] as const;
export type Position = (typeof POSITIONS)[number];

export const URL_APPLIES_TO = ["previous_exercise_row", "whole_schema"] as const;
export type UrlAppliesTo = (typeof URL_APPLIES_TO)[number];

export const FOOTNOTE_MARKERS = ["*", "**"] as const;
export type FootnoteMarker = (typeof FOOTNOTE_MARKERS)[number];
```

#### Phase 2.2 — `schema-row.schema.ts`

```typescript
import { z } from "zod";

import {
  compoundRepDefinitionSchema,
  compoundRowSchema,
  exerciseFormSchema,
  footnoteTargetSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  perLimbDistributionSchema,
  placeholderPayloadSchema,
  repNotationSchema,
  restSpecSchema,
  sequenceIndicatorSchema,
  standaloneLoadScopeSchema,
  tempoModifierSchema,
} from "../_shared";

import {
  FOOTNOTE_MARKERS,
  POSITIONS,
  ROW_KINDS,
  SCHEMA_ROW_CONSTANTS,
  URL_APPLIES_TO,
} from "./schema-row.constants";

export const rowKindSchema = z.enum(ROW_KINDS);
export const positionSchema = z.enum(POSITIONS);
export const urlAppliesToSchema = z.enum(URL_APPLIES_TO);
export const footnoteMarkerSchema = z.enum(FOOTNOTE_MARKERS);

// 9-variant rowPayload union (CONNECTOR DROPPED per D12)
export const schemaRowPayloadSchema = z.discriminatedUnion("rowKind", [
  z.object({
    rowKind: z.literal("EXERCISE"),
    exercise: exerciseFormSchema,
  }),
  z.object({
    rowKind: z.literal("REST"),
    raw: z.string().min(1),
    parsed: restSpecSchema,
  }),
  z.object({
    rowKind: z.literal("FOOTNOTE"),
    marker: footnoteMarkerSchema,
    target: footnoteTargetSchema,
    content: compoundRowSchema,
    typeLabel: z.string().min(1).optional(),
  }),
  z.object({
    rowKind: z.literal("STANDALONE_LOAD"),
    load: loadSchema,
    scope: standaloneLoadScopeSchema,
  }),
  z.object({
    rowKind: z.literal("STANDALONE_URL"),
    url: z.string().url(),
    wrapped: z.boolean(),
    appliesTo: urlAppliesToSchema,
  }),
  z.object({
    rowKind: z.literal("PLACEHOLDER"),
    placeholder: placeholderPayloadSchema,
  }),
  z.object({
    rowKind: z.literal("INNER_LADDER_MARKER"),
    steps: z.array(z.number().int().positive()).min(1),
  }),
  z.object({
    rowKind: z.literal("REP_DEFINITION"),
    equality: z.object({
      form: z.literal("inline_equality"),
      totalReps: z.number().int().positive(),
      composition: z
        .array(
          z.object({
            exerciseId: z.string().cuid(),
            count: z.number().int().positive(),
          }),
        )
        .min(1),
    }),
  }),
  z.object({ rowKind: z.literal("REST_SLOT") }),
]);

// schemaRowSchema (top-level row entity)
export const schemaRowSchema = z.object({
  id: z.string().cuid(),
  schemaId: z.string().cuid(),
  order: z.number().int().positive(),
  rowKind: rowKindSchema,
  rowPayload: schemaRowPayloadSchema,
  load: loadSchema.nullable(),
  reps: repNotationSchema.nullable(),
  side: perLimbDistributionSchema.nullable(),
  tempo: tempoModifierSchema.nullable(),
  position: positionSchema.nullable(),
  sequence: sequenceIndicatorSchema.nullable(),
  intensity: intensitySchema.nullable(),
  media: mediaReferenceSchema.nullable(),
  compoundRep: compoundRepDefinitionSchema.nullable(),
  notes: z.string().max(SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemaRowSchema = z.object({
  schemaId: z.string().cuid(),
  rowKind: rowKindSchema,
  rowPayload: schemaRowPayloadSchema,
  load: loadSchema.nullable().optional(),
  reps: repNotationSchema.nullable().optional(),
  side: perLimbDistributionSchema.nullable().optional(),
  tempo: tempoModifierSchema.nullable().optional(),
  position: positionSchema.nullable().optional(),
  sequence: sequenceIndicatorSchema.nullable().optional(),
  intensity: intensitySchema.nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  compoundRep: compoundRepDefinitionSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const updateSchemaRowSchema = createSchemaRowSchema.partial();

export const reorderSchemaRowsSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
```

**Note**: `discriminatedUnion("rowKind", [9 variants])` — pure ZodObject variants only (no inner `.refine()` per Step 8.0a D-1). All 9 variants are top-level z.object без cross-field invariants requiring refine. If invariants surface — add outer `.superRefine()` per D-1 pattern.

#### Phase 2.3 — `schema-row.schema.test.ts`

Test coverage (~50-60 cases):

- rowKindSchema: 9 valid + **«REJECTS CONNECTOR» regression test** per ratified OQ-4 (`rowKindSchema.safeParse("CONNECTOR").success === false`)
- positionSchema: 11 valid + 1 invalid
- urlAppliesToSchema / footnoteMarkerSchema: enum sanity
- schemaRowPayloadSchema: each of 9 variants happy + 1 invalid kind reject + **«REJECTS rowKind: CONNECTOR» regression test**
- schemaRowSchema: full row happy + nullable fields пустые
- createSchemaRowSchema / updateSchemaRowSchema: basic happy paths
- reorderSchemaRowsSchema: duplicates + empty rejection

#### Phase 2.4 — `schema-row.types.ts`

```typescript
import { type z } from "zod";

import {
  type createSchemaRowSchema,
  type reorderSchemaRowsSchema,
  type schemaRowSchema,
  type schemaRowPayloadSchema,
  type updateSchemaRowSchema,
} from "./schema-row.schema";

export type SchemaRow = z.infer<typeof schemaRowSchema>;
export type SchemaRowPayload = z.infer<typeof schemaRowPayloadSchema>;
export type CreateSchemaRowData = z.infer<typeof createSchemaRowSchema>;
export type UpdateSchemaRowData = z.infer<typeof updateSchemaRowSchema>;
export type ReorderSchemaRowsData = z.infer<typeof reorderSchemaRowsSchema>;
```

#### Phase 2.5 — `schema-row-api.schema.ts`

Mirror Phase 1.5 pattern: getSchemaRowsResponseSchema (array), getById/update/delete params, request body schemas, reorder response (`{ schemaRows: getSchemaRowsResponseSchema }`).

#### Phase 2.6 — `schema-row-api.schema.test.ts` (~10 cases)

#### Phase 2.7 — `schema-row-api.types.ts`

#### Phase 2.8 — `schema-row/index.ts`

```typescript
export * from "./schema-row.constants";
export * from "./schema-row.schema";
export * from "./schema-row.types";
export * from "./schema-row-api.schema";
export * from "./schema-row-api.types";
```

---

### Phase 3 — `lms/schema-pairing/` entity slice (8 files)

#### Phase 3.1 — `schema-pairing.constants.ts`

```typescript
export const SCHEMA_PAIRING_RELATIONS = ["ALTERNATING_SETS"] as const;
export type SchemaPairingRelation = (typeof SCHEMA_PAIRING_RELATIONS)[number];
```

#### Phase 3.2 — `schema-pairing.schema.ts`

```typescript
import { z } from "zod";

import { SCHEMA_PAIRING_RELATIONS } from "./schema-pairing.constants";

export const schemaPairingRelationSchema = z.enum(SCHEMA_PAIRING_RELATIONS);

export const schemaPairingSchema = z.object({
  id: z.string().cuid(),
  schemaAId: z.string().cuid(),
  schemaBId: z.string().cuid(),
  relationKind: schemaPairingRelationSchema,
});

export const createSchemaPairingSchema = z
  .object({
    schemaAId: z.string().cuid(),
    schemaBId: z.string().cuid(),
    relationKind: schemaPairingRelationSchema,
  })
  .refine((p) => p.schemaAId !== p.schemaBId, {
    message: "schemaAId and schemaBId must be different",
  });
```

#### Phase 3.3 — `schema-pairing.schema.test.ts` (~10 cases)

- schemaPairingRelationSchema: ALTERNATING_SETS valid; unknown rejected
- schemaPairingSchema: full happy; missing field rejected
- createSchemaPairingSchema: distinct schemaA/B valid; same id reject

#### Phase 3.4 — `schema-pairing.types.ts`

#### Phase 3.5 — `schema-pairing-api.schema.ts`

```typescript
import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createSchemaPairingSchema, schemaPairingSchema } from "./schema-pairing.schema";

export const getSchemaPairingsResponseSchema = z.array(schemaPairingSchema);
export const createSchemaPairingRequestSchema = createSchemaPairingSchema;
export const deleteSchemaPairingParamsSchema = idParamSchema;
```

#### Phase 3.6 — `schema-pairing-api.schema.test.ts` (~5 cases)

#### Phase 3.7 — `schema-pairing-api.types.ts`

#### Phase 3.8 — `schema-pairing/index.ts`

---

### Phase 4 — `lms/archetype/` entity slice (8 files; READ-ONLY per D4 — no admin CRUD)

#### Phase 4.1 — `archetype.constants.ts`

```typescript
export const ARCHETYPE_CONSTANTS = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;
```

#### Phase 4.2 — `archetype.schema.ts`

```typescript
import { z } from "zod";

import {
  archetypeFamilySchema,
  archetypeNameSchema,
  schemaKindSchema,
} from "../schema/schema.schema";

import { ARCHETYPE_CONSTANTS } from "./archetype.constants";

export const archetypeSchema = z.object({
  id: z.string().cuid(),
  name: archetypeNameSchema,
  kind: schemaKindSchema,
  family: archetypeFamilySchema,
  headerPatternDescription: z.string().max(ARCHETYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH),
  bodyLayoutDescription: z.string().max(ARCHETYPE_CONSTANTS.MAX_DESCRIPTION_LENGTH),
  archetypeParamsSchema: z.unknown(),
  relatedArchetypes: z.unknown(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

**Note**: `archetypeParamsSchema` field (the JSON column on Archetype model) is informational metadata; opaque shape per domain §1.9 «список parameter names». Use `z.unknown()` — caller responsible if introspection needed. `relatedArchetypes` similarly opaque (graph of relation descriptors).

#### Phase 4.3 — `archetype.schema.test.ts` (~10 cases)

- archetypeSchema happy с 34 archetype names loop
- field length max enforcement

#### Phase 4.4 — `archetype.types.ts`

#### Phase 4.5 — `archetype-api.schema.ts`

```typescript
import { z } from "zod";

import { archetypeSchema } from "./archetype.schema";

export const getArchetypesResponseSchema = z.array(archetypeSchema);
```

**No CRUD endpoints** — Archetype = configuration per D4 (no admin UI). Single read endpoint.

#### Phase 4.6 — `archetype-api.schema.test.ts` (~3 cases)

#### Phase 4.7 — `archetype-api.types.ts`

#### Phase 4.8 — `archetype/index.ts`

---

### Phase 5 — Top-level barrel update

`packages/contracts/src/entities/lms/index.ts`:

```typescript
export * from "./_shared";
export * from "./archetype";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./schema";
export * from "./schema-pairing";
export * from "./schema-row";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

13 exports total (9 baseline + 4 new). Strict alphabetic.

---

### Phase 6 — Drop `RowKind.CONNECTOR` value в `packages/api-server/prisma/schema.prisma`

Per D12 ratified. Edit `enum RowKind { ... }` at lines 543-554:

Before:

```prisma
enum RowKind {
  EXERCISE
  REST
  FOOTNOTE
  STANDALONE_LOAD
  STANDALONE_URL
  PLACEHOLDER
  INNER_LADDER_MARKER
  REP_DEFINITION
  CONNECTOR
  REST_SLOT
}
```

After:

```prisma
enum RowKind {
  EXERCISE
  REST
  FOOTNOTE
  STANDALONE_LOAD
  STANDALONE_URL
  PLACEHOLDER
  INNER_LADDER_MARKER
  REP_DEFINITION
  REST_SLOT
}
```

**db:reset note для executor**: после Prisma schema edit run `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed` per ADR-0019 + `[[discipline-program-db-non-prod]]`. **Verify zero existing CONNECTOR rows в DB перед drop** через `SELECT count(*) FROM ... WHERE row_kind = 'CONNECTOR'` (or equivalent) — should be 0 (Schema/SchemaRow ещё не shipped в runtime).

---

### Phase 7 — Analysis-artifacts sync (separate commit per OQ-5)

7 files в `analysis/artifacts/`:

#### Phase 7.1 — `06-formalization/schema.prisma` (mirror prisma drop)

Edit `enum RowKind { ... }` — same drop как Phase 6.

#### Phase 7.2 — `06-formalization/types.ts` lines 374-378 (drop CONNECTOR variant from SchemaRowPayload)

Before:

```typescript
| {
    rowKind: "CONNECTOR";
    form: ConnectorForm;
    roundsCount?: number;
  }
```

After: variant removed; SchemaRowPayload union goes from 10 variants → 9.

**Note**: types.ts also has `TrailingConnector` type at lines 641-644 — keep как есть (это для Schema.trailingConnector field; not для row payload).

#### Phase 7.3 — `06-formalization/er-final.md`

Likely zero edit (RowKind drop = enum value, не relation/cardinality change). Verify за prompt-execution time; if any relation diagram references CONNECTOR row → update.

#### Phase 7.4 — `05-synthesis/domain-model.md §1.6.9 ConnectorRow paragraph` (reframe per D12)

Read current §1.6.9 paragraph at execution time. Reframe:

Before (existing per § 0.3 quote):

```
#### 1.6.9 ConnectorRow
- `kind = "connector"`.
- `form` — `then:` | `...then...:` | `...then_N_rounds`.
- `rounds_count` — integer (если form = `...then_N_rounds`).

**Note**: per Phase 2.1, connector хранится в конце body предыдущей schema. Альтернативная trabajo: вместо отдельной row — это `Schema.trailing_connector` field. **Решение Phase 5**: ConnectorRow — explicit row на хвосте body...
```

After (D12 ratified — drop ConnectorRow; field canonical):

```
#### 1.6.9 ~~ConnectorRow~~ (dropped per D12, 2026-05-18)

Per D12 ratify 2026-05-18: `Schema.trailingConnector` field on the Schema entity is canonical persistence для трейлинг-коннектора (`then:` / `...then...:` / `...then N rounds:`). The earlier Phase 5 ratification of «ConnectorRow as explicit row at body tail» — **OVERRIDDEN**. Rationale (coach POV): "then 3 rounds" — модификатор на schema-to-schema transition (meta), не content tail of body; cleaner data shape; render logic не фильтрует CONNECTOR row из body iteration.

**Persistence**: `Schema.trailingConnector Json?` field stores `{ form: ConnectorForm, roundsCount?: number }` shape per `types.ts:641-644` `TrailingConnector` type. `ConnectorForm` enum (`then` / `then_dots` / `then_n_rounds`) survives в `_shared/enums.ts` shipped Step 8.0a. `RowKind.CONNECTOR` enum value DROPPED from Prisma schema + 06-formalization mirror + types.ts SchemaRowPayload variant Step 8.0b.

**SchemaRow discriminator count post-D12**: 9 row kinds (was 10).
```

#### Phase 7.5 — `06-formalization/implementation-notes.md` § new addendum (post-D12)

Append at end (or в existing § «Step 8.0b — RowKind.CONNECTOR dropped per D12») 1-paragraph record:

```markdown
### §4.8 Step 8.0b — RowKind.CONNECTOR dropped per D12 (2026-05-18)

Per D12 ratify 2026-05-18 (planning thesis cycle Step 8 top-level): `Schema.trailingConnector Json?` field on the Schema entity is canonical persistence для трейлинг-коннектора. The earlier Phase 5 ratification of «ConnectorRow as explicit row at body tail» (domain-model.md §1.6.9 pre-D12) was overridden. `RowKind.CONNECTOR` enum value dropped from Prisma schema + 06-formalization/schema.prisma mirror + 06-formalization/types.ts SchemaRowPayload variant. Resulting `RowKind` enum = 9 values (was 10). `ConnectorForm` enum (`then`/`then_dots`/`then_n_rounds`) survives в `_shared/enums.ts` shipped Step 8.0a — consumed by `Schema.trailingConnector` field via `trailingConnectorSchema` (XOR refine: `form === "then_n_rounds"` requires `roundsCount`; else `roundsCount` forbidden). Per coach POV: "then 3 rounds" = modifier на schema-to-schema transition (meta), not content tail body; cleaner data shape; render logic не фильтрует CONNECTOR row из body iteration.
```

---

## § 4 — Acceptance criteria (40-item self-check)

### A. Files & structure

1. [ ] 4 new entity directories в `lms/`: schema/ + schema-row/ + schema-pairing/ + archetype/.
2. [ ] Each directory has 7-8 files mirror block/ + exercise/ pattern.
3. [ ] `lms/index.ts` updated к 13 strict-alphabetic exports.
4. [ ] Zero modifications к existing `lms/{_shared,block,day,exercise,label,plan-enrollment,session,training-plan,week}/` files.
5. [ ] All new files have zero comments в коде.
6. [ ] All const tuples use `as const` + UPPER_SNAKE_CASE.
7. [ ] All Zod schemas use `camelCaseSchema` naming.
8. [ ] All types via `z.infer<typeof xxxSchema>` (PascalCase).

### B. Dep-cruiser compliance

9. [ ] Zero `import from "@prisma/client"` в any new file.
10. [ ] Zero `z.nativeEnum` usage.
11. [ ] Imports от `lms/_shared/` only (not от sibling entity slices) for `lms/schema/`, `lms/schema-row/`, `lms/schema-pairing/`. `lms/archetype/` imports от `lms/schema/` (для archetypeName/family/kind enums) — semantically OK (archetype = config that references Schema discriminators).
12. [ ] `pnpm dep:check` 0 violations.

### C. Schema entity completeness

13. [ ] schemaSchema через z.lazy() + explicit `Schema` type annotation.
14. [ ] Sub-schema invariant via superRefine: `parentSchemaId !== null → kind ∈ {ATOMIC, HEADERLESS}`.
15. [ ] trailingConnectorSchema XOR refine (form=then_n_rounds ↔ roundsCount).
16. [ ] archetypeParamsSchema flat 34-variant discriminated union (all 34 ArchetypeName values covered).
17. [ ] 7 archetypes с empty params use `z.object({}).strict()` (rejects extra keys).
18. [ ] createSchemaSchema / updateSchemaSchema (partial) / reorderSchemasSchema shipped.
19. [ ] schemaApi pair (schema-api.schema.ts + schema-api.types.ts).
20. [ ] SchemaWithBody recursive type в schema.types.ts.

### D. SchemaRow entity completeness

21. [ ] rowKindSchema = 9 values (CONNECTOR DROPPED).
22. [ ] schemaRowPayloadSchema = 9-variant discriminated union.
23. [ ] **Regression test «schemaRowPayloadSchema rejects rowKind: CONNECTOR»** present.
24. [ ] schemaRowSchema с all nullable VO fields (load/reps/side/tempo/position/sequence/intensity/media/compoundRep).
25. [ ] create/update/reorder schemas + API pair shipped.

### E. SchemaPairing entity completeness

26. [ ] schemaPairingRelationSchema = ALTERNATING_SETS (1 value).
27. [ ] schemaPairingSchema + createSchemaPairingSchema (с distinct schemaA/B refine).
28. [ ] Minimal API pair (no update — pairings are immutable, delete + recreate).

### F. Archetype entity completeness

29. [ ] archetypeSchema read-only shape (no createArchetypeSchema — D4 «no admin CRUD»).
30. [ ] getArchetypesResponseSchema array.
31. [ ] archetypeParamsSchema/relatedArchetypes fields opaque (z.unknown()).

### G. Prisma + analysis-sync

32. [ ] `packages/api-server/prisma/schema.prisma` RowKind enum loses CONNECTOR.
33. [ ] `analysis/artifacts/06-formalization/schema.prisma` mirror drop.
34. [ ] `analysis/artifacts/06-formalization/types.ts` SchemaRowPayload variant CONNECTOR removed (lines 374-378).
35. [ ] `analysis/artifacts/05-synthesis/domain-model.md §1.6.9` reframed к D12 wording.
36. [ ] `analysis/artifacts/06-formalization/implementation-notes.md` §4.8 addendum.

### H. Verifications all-green

37. [ ] `pnpm check-types` 16/16 + `pnpm lint` 16/16 (0 warnings).
38. [ ] `pnpm test` baseline + ~150-200 new = ~1450-1500 passed.
39. [ ] `pnpm --filter @repo/contracts test` 508 baseline + ~150-200 new = ~660-710 passed.
40. [ ] Husky pre-commit + commit-msg clean all commits без `--no-verify`.

---

## § 5 — Adversarial pass (9 flavours)

### (a) [[scope-via-existing-patterns]]

Mirror `lms/block/` 8-file structure + `lms/exercise/` 7-file structure + Step 8.0a `_shared/` patterns. Read at execution time; quote any drift.

### (b) [[coach-pov-first]]

Cited verbatim per domain §1.4/1.5/1.6/1.9 + §3 archetype family mapping. Coach-OQs ratified в thesis (swap behavior allowed; expandable inline sub-schemas; SchemaPairing auto-with-archetype).

### (c) [[planner-verbatim-registration]]

Per § 0 quote sections + § 0.A grep enumeration; executor MUST Read all registration files at execution time.

### (d) [[planner-adversarial-review]]

- Concurrent / TOCTOU: N/A (no DB mutations).
- Partial inputs: cover в tests (empty body, missing fields, duplicates, extra keys).
- Malformed: cover (cross-variant param mismatch, sub-schema invalid kind, XOR refine violations).
- Boundary: 34 archetype variants (Zod discriminatedUnion limit acceptable per intensity/load Step 8.0a precedent), recursive SchemaWithBody depth (single-level per §1.5 invariant — Zod z.lazy() bounded).
- Static analysis surfaces: ESLint, TS strict (`noUncheckedIndexedAccess` для array access), dep-cruiser (covered).
- Library type-system: Zod 3 z.lazy() recursive — explicit type annotation; discriminatedUnion с pure ZodObject variants only (no inner refines per D-1 Step 8.0a lesson).

### (e) [[husky-cross-package-squash]]

Per § 0.B verified safe — Phase 6 prisma drop pre-condition: zero `RowKind.CONNECTOR` references в downstream (verified pre-prompt via § 0.A grep 4 + 5). Per-layer atomic OK; no squash.

### (f) [[planner-consumer-pattern-read]]

N/A для 8.0b — no consumers within step. Downstream consumers materialize Step 8.1+ (lmsSchemaApi, lmsSchemaRowApi).

### (g) [[planner-read-surface-trace]]

N/A — no UI step.

### (h) [[planner-mutation-invariant-trace]]

N/A — no DB mutations (Phase 6 = enum drop only).

### (i) [[planner-lint-impact-trace]]

Zod schemas = no JSX (no react/no-multi-comp). Library type-system: z.lazy() + discriminatedUnion patterns canonical per Step 8.0a precedent. Linter может surface import-order autofix per lint-staged (accept per Step 7.5 D-1).

---

## § 6 — Commit strategy

**4 commits total**.

### Commit 1: code (Phases 1-5 atomic — entity slices + barrel)

```
feat(contracts): add entity slices for schema row pairing archetype

Foundation entity contracts for step 8 schema-vertical.
Adds 4 new directories under lms/ each mirroring block/exercise
pattern: schema schema-row schema-pairing archetype.

Schema uses self-reference parentSchemaId plus recursive
schemawithbody type per d10. Subschema invariant kind atomic
or headerless via outer superRefine on schemaschema.

archetypeparamsschema is flat 34-variant discriminated union
per types ts canonical. archetypes with empty params use
strict empty object schema rejecting extra keys.

schemarowpayloadschema is 9-variant union connector dropped
per d12. regression test guards against rowkind connector
acceptance for future safety.

schemapairing has minimal create plus list contracts plus
distinct schemaa schemab refine ui deferred per d11.

archetype is read only per d4 no admin crud single list
response schema only.
```

Subject 60 chars lowercase ✓. Body lines ≤100 chars ✓.

### Commit 2: prisma (Phase 6)

```
feat(api-server): drop rowkind connector enum value per d12

trailingconnector field on schema entity is canonical
persistence for trailing connector marker per d12. rowkind
connector enum value dropped from prisma schema.

connectorform enum survives in lms shared enums shipped
step 8 0a consumed by schema trailingconnector field via
trailingconnectorschema xor refine.

verified zero references to rowkind connector across
api-server and apps before drop.
```

### Commit 3: analysis (Phase 7)

```
docs(analysis): sync artifacts after rowkind connector drop

mirror prisma schema drop in 06-formalization plus drop
connector variant from types ts schemarowpayload union
9 variants now instead of 10.

reframe domain-model 1 6 9 connectorrow paragraph to
schema trailingconnector field canonical per d12 ratify
2026-05-18.

add implementation-notes 4 8 addendum recording the
rowkind connector drop and the ratification trail.
```

### Commit 4: docs (output report)

```
docs(step-08.0b): write executor output report
```

---

## § 7 — Verifications cheatsheet

| Check                                                                      | Expected outcome                                 |
| -------------------------------------------------------------------------- | ------------------------------------------------ |
| `pnpm check-types`                                                         | 16/16 packages pass                              |
| `pnpm lint`                                                                | 16/16 pass, 0 warnings                           |
| `pnpm test`                                                                | baseline 1306 + ~150-200 new = ~1450-1500 passed |
| `pnpm --filter @repo/contracts test`                                       | 508 baseline + ~150-200 new = ~660-710 passed    |
| `pnpm dep:check`                                                           | 0 violations                                     |
| `git log --oneline`                                                        | 4 new commits                                    |
| `find packages/contracts/src/entities/lms -type d -mindepth 1 -maxdepth 1` | 9 baseline + 4 new = 13 directories              |
| `wc -l packages/contracts/src/entities/lms/index.ts`                       | 13                                               |
| `grep "CONNECTOR" packages/api-server/prisma/schema.prisma`                | 0 matches                                        |
| `grep -c '"CONNECTOR"' analysis/artifacts/06-formalization/types.ts`       | 0 matches                                        |

Run per-package commands first (`pnpm --filter @repo/contracts {check-types, lint, test}`) для faster feedback; root commands per-commit-final.

---

## § 8 — Smoke test status

**N/A** — contract-only step + read-only Prisma enum drop. No runtime / api-server / route / UI surface. First downstream consumer = Step 8.1a `lmsSchemaApi` (server endpoints).

---

## § 9 — Execution mode

Wrap в `/feature small` per ratified OQ-7. Seventh `/feature small` invocation формально в workflow (Step 8.0a went direct per carve-out, but 8.0b doesn't qualify — touches prisma + analysis files).

**Branch-cut override**: do NOT cut new branch. Ship on `feat/training-domain`. Confirm `git rev-parse --abbrev-ref HEAD == feat/training-domain` before any commit.

`/feature small` minimum contract: `.feature-dev/<ts>/{research.md, tasks.md}` thin pointers к authoritative content в этом prompt.

---

## § 10 — Output template (`output.md` format)

`implementation/step-08.0b/output.md` per WORKFLOW.md § "output.md format":

```markdown
## Что сделано

[bulleted summary of code shipped]

## Изменённые/созданные файлы

[paths grouped by phase]

## Принятые решения

[D-numbered justifications for any spec deviations]

## Возникшие вопросы и как решены

[Q-numbered items: surface через AskUserQuestion if encountered, ratify, document]

## Что отложено

[carry-forwards introduced; if zero, state explicitly]

## Ссылка на `.feature-dev/<ts>/`

[.feature-dev/<ts>/research.md or thin-pointer note]

## Сценарий смоук-теста

N/A — contracts-only step + read-only Prisma enum drop (Step 7.0 + Step 8.0a precedent).

## Verification notes

[exact outputs of pnpm check-types / lint / test / dep:check]

## Acceptance criteria self-check

[40-item checklist from § 4, mark each ✓ or ✗ with justification]
```

---

## § 11 — Process notes (lessons absorbed)

- **Streak baseline**: Step 7.5 → Step 8.0a — two cleanest runs в ряд. 8.0b aims for continuation (third).
- **D-1 Step 8.0a lesson absorbed**: inner refines в discriminatedUnion produce ZodEffects → use outer superRefine pattern. Применено везде где cross-field invariants внутри discriminatedUnion variants (trailingConnectorSchema на простой z.object — inner refine OK; archetypeParamsSchema variants — pure objects без cross-field refine — OK).
- **D-2 Step 8.0a lesson**: `/feature small` carve-out для thin-additive contracts-only single-package steps. 8.0b touches prisma + analysis files = NOT single-package additive; carve-out не applies; `/feature small` wrapper mandatory.
- **Q-1 Step 8.0a lesson**: copy verbatim from current HEAD at prompt-write time. Этот prompt § 0 quotes attempt verbatim (where possible) с line-range references for executor Read verification.
- **Q-2/Q-3 Step 8.0a lessons**: test count + dep:check counts conservative; surface variance in output.md без blocker.
- **9 planner-discipline flavours**: all 9 applied at planning time per § 5. (i) extended with Zod 3 library type-system axis per Step 8.0a D-1 absorption.
- **34-variant discriminated union**: scale risk — TypeScript tsc compile time + ESLint check time. Mitigation: separate `archetypeParamsSchema` definition by archetype family logically grouped (planner ordered by family in § 0.5 reference), and accept compile cost vs runtime correctness trade-off.
- **z.lazy() recursive types**: explicit type annotation mandatory (`schemaSchema: z.ZodType<Schema> = z.lazy(...)`). Executor surfaces drift if TS infers `unknown`.
- **Future refactor flags**:
  - If z.lazy() runtime cost noticed in profiling — alternative: structural recursive type via separate `subSchemaSchema` (parentSchemaId required + kind = ATOMIC|HEADERLESS) + top-level `schemaSchema` (parentSchemaId === null). Trade-off: lose recursive type unity; gain Zod-flat shapes.
  - If 34-variant discriminatedUnion bottleneck в tsc — alternative: namespace per ArchetypeFamily (9 sub-unions × 2-5 variants each). Trade-off: dispatcher complexity at consumption site.

---

## End of prompt.
