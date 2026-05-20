# Implementation notes (Phase 6, Task 5)

JSON shape examples + Zod validation samples + resolution algorithms + migration considerations.

Дополняет `schema.prisma` и `types.ts`. Используется при имплементации API / parser / UI layer.

---

## §0. Phase 7 — Integration Ratifications (2026-05-12)

Четыре ratifications (D1-D4) согласуют training-domain срез с уже существующим app schema (`packages/api-server/prisma/schema.prisma`, содержит `User`, `CoachProfile`, `AthleteProfile`, `TrainingPlan`, `PlanEnrollment`, `CoachAthleteAssignment`). Закрывают OPEN items §5 ("Calendar / Week / Plan", "Athlete.profileAttributes.hrMax finalization", "Dual-value resolver") — см. inline annotations ниже по тексту.

### §0.1 D1 — Calendar Week as entity

Между `TrainingPlan` (app-level) и `Day` (этот срез) добавлен явный `Week` entity:

- `Week { id, planId, startDate Date, notes?, createdAt, updatedAt }` с `@@unique([planId, startDate])` + `@@index([planId, startDate])`.
- `startDate` = понедельник ISO-недели (Mon-Sun). Week — **календарный слот**, не «week 1 of 12» относительной программы. План — «поезд», который катится вперёд: тренер программирует очередную календарную неделю, атлет подключается/уходит в любой момент. Финал плана не зашит.
- `Day.order` удалён; заменён на `(weekId String, dayOfWeek DayOfWeek)` с unique. Новый enum `DayOfWeek { MONDAY..SUNDAY }`.
- Derived (не stored): week-end date (`startDate + 6 days`), ISO year+week number, per-day calendar date. Живут в app layer.

Coach-facing смысл: атомарные week-level операции (add/remove/clone/clear), per-week notes ("deload", "competition prep", "vacation skip"), естественная ось навигации в plan-editor UI.

### §0.2 D2 — Athlete = User + AthleteProfile; `profileAttributes` dropped

Standalone `Athlete` модель убрана. В этом срезе:

- `OneRMRecord.athleteId` → **`userId`**; relation `athlete Athlete` → `user User`. Stub `User` живёт в конце `schema.prisma`.
- `PerformedSession.athleteId` → **`userId`**; relation аналогично.
- `Athlete.profileAttributes` (Phase 6 placeholder для dual-value resolver, sex, level, RX-SC tier) **полностью удалён**. Это был placeholder без чёткого UX-shape; держать jsonb-багги «на потом» — анти-pattern.
- Будущие athlete-attribute поля (level, modalityTier, hrMax, sex для dual-value) лягут как **explicit enum / scalar columns на `AthleteProfile`** в app-level schema, **не** как jsonb.

Импликации в этом файле: pseudocode в §3.5 (`resolveDualValue`) и §3.8 (`resolveHrZoneToBpm`) — обращаются к `athlete.profileAttributes.*`. Они помечены RATIFIED OUT ниже; rewrite — Phase 8+ когда AthleteProfile получит соответствующие explicit columns.

### §0.3 D3 — Full-scope port at Step 2

Этот документ остаётся документом. Step 2 (отдельная итерация workflow) портирует **весь** ratified set entities — catalogue (Exercise, Label, Archetype), plan-content (Week, Day, Session, Block, BlockLabelAssignment, Schema, SchemaPairing, SchemaRow), athlete-facing (OneRMRecord, PerformedSession, PerformedExerciseInstance) — в `packages/api-server/prisma/schema.prisma`, даже если athlete-flow UI/API остаются вне scope первой volna. Альтернатива (порт только coach-fas) потребует второго schema-wave mid-workflow.

### §0.4 D4 — Library vs Configuration split

Два разных режима жизненного цикла для catalog entities:

- **Library** — `Exercise`, `Label`. Coach создаёт / редактирует через admin UI. **Не seedится системой.** Используется для future analytics (per-exercise volume, label-based filtering). 149 canonical exercises из Phase 3.2 — reference content (CSV / starter pack), но не автоматический seed; coach при онбординге заполняет либо вручную, либо через bulk-import. См. inline-аннотацию у §4.6.
- **Configuration** — `Archetype`. **Часть** доменной модели: 34 канонические записи (Phase 1-6: 33 + super-set Phase 7) — **обязательный** seed при Step 2. **Нет admin CRUD**: archetype-каталог менять через UI невозможно без синхронного апдейта parser/renderer. `archetypeParamsSchema Json` остаётся колонкой Prisma (не enum), чтобы расширять каталог без code redeploy при необходимости.

Implication для §4.5 (Archetype seed): остаётся обязательным mandatory step. Для §4.6 (Catalog seed scope): 149-список становится starter content, не auto-seed (см. RATIFIED note ниже).

### §0.5 D5 — defaultDemoUrls as Postgres native array (2026-05-13)

`Exercise.defaultDemoUrl String?` → `defaultDemoUrls String[]`. Native PG array over Json for type-safety and to avoid JSON parsing overhead. Coach attaches multiple demo videos per exercise without limit. Ratified prior to Step 3 (Admin Exercise CRUD) implementation.

---

## §1. JSON shape examples per embedded VO

Все примеры — concrete fixtures для типичных sample occurrences.

### §1.1 Load (5 variants)

```json
// 1. Absolute single (block-077 standalone row)
{ "kind": "absolute", "weight": { "variant": "single", "valueKg": 15 } }

// 2. Absolute dual (canonical: 157 occurrences)
{ "kind": "absolute", "weight": { "variant": "dual", "valueKg": 15 } }

// 3. Absolute single_arm (block-033)
{ "kind": "absolute", "weight": { "variant": "single_arm", "valueKg": 15 } }

// 4. Absolute compound_device (block-008 Bulgarian)
{ "kind": "absolute", "weight": { "variant": "compound_device", "equipment": "DUMBBELL", "count": 2, "valueKg": 15 } }

// 5. Absolute split_tier (block-119 single arm row)
{
  "kind": "absolute",
  "weight": {
    "variant": "split_tier",
    "stages": [
      { "reps": 5, "equipment": "KETTLEBELL", "valueKg": 24 },
      { "reps": 10, "equipment": "DUMBBELL", "valueKg": 15 }
    ]
  }
}

// 6. Absolute dual_value (block-003 singleton)
{
  "kind": "absolute",
  "weight": {
    "variant": "dual_value",
    "first": 50,
    "second": 30,
    "resolver": "athlete_profile"
  }
}

// 7. Absolute with_asymmetric_arm (block-123)
{
  "kind": "absolute",
  "weight": {
    "variant": "with_asymmetric_arm",
    "valueKg": 15,
    "workingArm": "left",
    "passiveArmAction": "hold_in_up"
  }
}

// 8. Absolute with_depth_modifier (block-189)
{
  "kind": "absolute",
  "weight": { "variant": "with_depth_modifier", "valueKg": 24, "depth": "to_parallel" }
}

// 9. Percentage with self reference
{
  "kind": "percentage",
  "value": 60,
  "reference": { "scope": "self" }
}

// 10. Percentage range + cross-movement
{
  "kind": "percentage",
  "value": 60,
  "rangeMax": 70,
  "reference": { "scope": "other_exercise", "targetExerciseId": "clu123..." }
}

// 11. Bodyweight
{ "kind": "bodyweight" }

// 12. Without weight (drop-set stage)
{ "kind": "without_weight", "context": "drop_set_stage" }

// 13. Unspecified
{ "kind": "unspecified" }
```

### §1.2 Intensity

```json
// block-055 (block-level)
{ "effortPercent": { "value": 70 }, "pace": "easy" }

// block-078 / schema-1 (schema-level)
{ "effortPercent": { "range": { "min": 75, "max": 80 } } }

// future RPE example
{ "rpe": { "value": 8 } }

// Phase 7 — HR zone (Ext 1, Q16)
{ "hrZone": { "zone": "Z2" } }

// Phase 7 — numeric pace, run (Ext 2, Q17)
{ "numericPace": { "value": "4:30", "distanceUnit": "km", "paceType": "min_per_distance" } }

// Phase 7 — numeric pace, row (split per 500m)
{ "numericPace": { "value": "1:50", "distanceUnit": "m", "paceType": "min_per_distance" } }

// Phase 7 — numeric pace, swim (distance per minute)
{ "numericPace": { "value": "50", "distanceUnit": "m", "paceType": "distance_per_min" } }

// combo (e.g., Z2 endurance run with target pace ceiling)
{
  "hrZone": { "zone": "Z2" },
  "numericPace": { "value": "5:30", "distanceUnit": "km", "paceType": "min_per_distance" }
}
```

### §1.3 RepNotation

```json
// count
{ "kind": "count", "value": 10 }

// range
{ "kind": "range", "min": 10, "max": 15 }

// unit_bound (km)
{ "kind": "unit_bound", "unit": "km", "value": 5 }

// unit_bound range
{ "kind": "unit_bound", "unit": "km", "range": { "min": 5, "max": 7 } }

// max bare
{ "kind": "max", "subForm": "bare" }

// max progressive
{ "kind": "max", "subForm": "progressive", "progressiveSeed": "1-2-3-4-5 etc." }

// max in_remaining_time
{ "kind": "max", "subForm": "in_remaining_time", "targetExerciseId": "clu..." }

// implicit
{ "kind": "implicit" }

// total_flag
{ "kind": "total_flag", "value": 30 }
```

### §1.4 SchemaRow.row_payload (per rowKind)

```json
// EXERCISE atomic
{ "rowKind": "EXERCISE", "exercise": { "form": "atomic", "exerciseId": "clu..." } }

// EXERCISE compound (block-129)
{
  "rowKind": "EXERCISE",
  "exercise": {
    "form": "compound",
    "compound": {
      "elements": [
        { "exerciseId": "db_bench_press_id", "reps": { "kind": "count", "value": 5 } },
        { "exerciseId": "plyo_push_ups_id", "reps": { "kind": "count", "value": 10 } },
        { "exerciseId": "db_bench_press_id", "reps": { "kind": "count", "value": 5 } }
      ],
      "sharedModifiers": {
        "load": { "kind": "absolute", "weight": { "variant": "dual", "valueKg": 15 } }
      }
    }
  }
}

// EXERCISE cyclical (block-047)
{
  "rowKind": "EXERCISE",
  "exercise": {
    "form": "cyclical",
    "cyclical": {
      "primaryExerciseId": "traverses_id",
      "secondaryExerciseId": "bar_dips_id",
      "cycles": [
        { "secondaryReps": 8 },
        { "secondaryReps": 7 }
      ]
    }
  }
}

// REST
{
  "rowKind": "REST",
  "raw": "- 90 sec rest in between sets -",
  "parsed": {
    "duration": { "value": 90, "unit": "sec" },
    "scope": "between_sets"
  }
}

// FOOTNOTE (block-093)
{
  "rowKind": "FOOTNOTE",
  "marker": "*",
  "target": "each_typed_round",
  "typeLabel": "GYMNASTICS",
  "content": {
    "elements": [
      { "exerciseId": "plank_id", "reps": { "kind": "unit_bound", "unit": "sec", "value": 30 } },
      { "exerciseId": "left_side_plank_id", "reps": { "kind": "unit_bound", "unit": "sec", "value": 30 } },
      { "exerciseId": "right_side_plank_id", "reps": { "kind": "unit_bound", "unit": "sec", "value": 30 } }
    ]
  }
}

// STANDALONE_LOAD (block-077)
{
  "rowKind": "STANDALONE_LOAD",
  "load": { "kind": "absolute", "weight": { "variant": "dual", "valueKg": 15 } },
  "scope": "applies_to_all_preceding_rows"
}

// STANDALONE_URL
{
  "rowKind": "STANDALONE_URL",
  "url": "https://www.youtube.com/watch?v=...",
  "wrapped": true,
  "appliesTo": "previous_exercise_row"
}

// PLACEHOLDER
{
  "rowKind": "PLACEHOLDER",
  "placeholder": {
    "placeholderKind": "muscle_group_reference",
    "text": "biceps / triceps"
  }
}

// PLACEHOLDER with per-set substitution (block-020)
{
  "rowKind": "PLACEHOLDER",
  "placeholder": {
    "placeholderKind": "coach_choice_slot",
    "text": "*DB exercise",
    "perSetAssignments": {
      "placeholderName": "*DB exercise",
      "assignments": [
        { "setIndex": 1, "exerciseId": "hang_squat_cleans_id" },
        { "setIndex": 2, "exerciseId": "hang_power_cleans_id" },
        { "setIndex": 3, "exerciseId": "front_squats_id" }
      ]
    }
  }
}

// INNER_LADDER_MARKER (block-037)
{ "rowKind": "INNER_LADDER_MARKER", "steps": [36, 28, 20] }

// REP_DEFINITION (block-043 singleton)
{
  "rowKind": "REP_DEFINITION",
  "equality": {
    "form": "inline_equality",
    "totalReps": 5,
    "composition": [
      { "exerciseId": "hs_walk_id", "count": 1 },
      { "exerciseId": "strict_hspu_id", "count": 2 }
    ]
  }
}

// CONNECTOR
{ "rowKind": "CONNECTOR", "form": "then_n_rounds", "roundsCount": 2 }

// REST_SLOT (block-080 / sub-4)
{ "rowKind": "REST_SLOT" }
```

### §1.5 MediaReference

```json
{
  "appliesTo": "drop_stage",
  "label": "EXPLODE",
  "position": "standalone_row",
  "url": "https://www.youtube.com/watch?v=7kQHaxvZgIc"
}
```

### §1.6 StagedProgram (Q19, ex-DropSetProgram)

`StagedProgram` — generalization бывшего `DropSetProgram`. Discriminator `programKind ∈ {drop_set, wave, cluster}`. Stages, restBetweenStages, legacy `setsCount/stageCountPerSet/separatorForm/mediaPerStage` сохраняются.

#### §1.6.1 programKind = "drop_set" (block-008 Bulgarian, legacy)

```json
{
  "programKind": "drop_set",
  "separatorForm": "...then...",
  "setsCount": 3,
  "stageCountPerSet": 3,
  "stages": [
    {
      "load": {
        "kind": "absolute",
        "weight": {
          "count": 2,
          "equipment": "DUMBBELL",
          "valueKg": 15,
          "variant": "compound_device"
        }
      },
      "reps": 5
    },
    {
      "load": {
        "kind": "absolute",
        "weight": {
          "count": 1,
          "equipment": "DUMBBELL",
          "valueKg": 15,
          "variant": "compound_device"
        }
      },
      "reps": 5
    },
    {
      "indicator": "explode",
      "label": "EXPLODE",
      "load": { "context": "drop_set_stage", "kind": "without_weight" },
      "media": {
        "appliesTo": "drop_stage",
        "label": "EXPLODE",
        "position": "standalone_row",
        "url": "https://www.youtube.com/watch?v=7kQHaxvZgIc"
      },
      "reps": 5
    }
  ]
}
```

#### §1.6.2 programKind = "wave" (snatch 3×3 @ 70/80/90%)

```json
{
  "programKind": "wave",
  "restBetweenStages": { "duration": { "unit": "min", "value": 2 }, "scope": "between_intervals" },
  "stages": [
    { "load": { "kind": "percentage", "reference": { "scope": "self" }, "value": 70 }, "reps": 3 },
    { "load": { "kind": "percentage", "reference": { "scope": "self" }, "value": 80 }, "reps": 3 },
    { "load": { "kind": "percentage", "reference": { "scope": "self" }, "value": 90 }, "reps": 3 }
  ]
}
```

#### §1.6.3 programKind = "cluster" (strict pull-ups 5×[3+3+3])

```json
{
  "programKind": "cluster",
  "restBetweenStages": { "duration": { "unit": "sec", "value": 15 }, "scope": "between_intervals" },
  "setsCount": 5,
  "stageCountPerSet": 3,
  "stages": [
    { "load": { "kind": "bodyweight" }, "reps": 3 },
    { "load": { "kind": "bodyweight" }, "reps": 3 },
    { "load": { "kind": "bodyweight" }, "reps": 3 }
  ]
}
```

### §1.6a TempoModifier full tempo (Ext 3, Q18)

```json
// Phase 6 tempo modifiers (legacy, unchanged)
{ "pauseInUp": { "durationSec": 2, "position": "up" } }
{ "slowEccentric": { "durationSec": 2 } }
{ "holdAfterLast": { "durationSec": 15 } }

// Phase 7 — full 4-digit Olympic / accessory tempo notation "3-1-2-0"
{ "fullTempo": { "eccentric": 3, "pauseBottom": 1, "concentric": 2, "pauseTop": 0 } }

// "X" eXplosive notation → 0 seconds (e.g., "3-0-X-0" → pauseTop=0)
{ "fullTempo": { "eccentric": 3, "pauseBottom": 0, "concentric": 0, "pauseTop": 0 } }
```

### §1.7 ArchetypeParams (per archetype, sample)

```json
// n-rounds
{ "archetype": "n-rounds", "params": { "countForm": "range", "countRange": { "min": 3, "max": 5 } } }

// parallel-ladders-descending (block-037)
{
  "archetype": "parallel-ladders-descending",
  "params": {
    "ladders": [
      { "steps": [36, 28, 20], "pairedWithInnerRowId": "row-2-id" },
      { "steps": [18, 14, 10], "pairedWithInnerRowId": "row-4-id" },
      { "steps": [4, 3, 2], "pairedWithInnerRowId": "row-6-id" }
    ]
  }
}

// composite-rounds-with-rest
{
  "archetype": "composite-rounds-with-rest",
  "params": {
    "count": 3,
    "rest": { "duration": { "value": 3, "unit": "min" }, "scope": "between_rounds" }
  }
}

// emom-nested-per-minute
{ "archetype": "emom-nested-per-minute", "params": { "durationMin": 16, "rounds": 4 } }

// emom-sub-minute-slot grouped
{ "archetype": "emom-sub-minute-slot", "params": { "slot": { "kind": "grouped", "minutes": [1, 2] } } }

// time-window-outer
{ "archetype": "time-window-outer", "params": { "window": { "startHhMm": "0:00", "endHhMm": "10:00" } } }

// named-exercise-program (block-008)
{
  "archetype": "named-exercise-program",
  "params": { "exerciseId": "db_bulgarian_split_squats_id", "program": { ...StagedProgram } }
}

// super-set (Phase 7, Ext 5, Q20)
{
  "archetype": "super-set",
  "params": {
    "rounds": 3,
    "pairs": [
      { "label": "A1", "schemaRows": ["row-1-id"] },
      { "label": "A2", "schemaRows": ["row-2-id"] }
    ],
    "restBetweenPairs": { "duration": { "value": 60, "unit": "sec" }, "scope": "between_rounds" }
  }
}
```

---

## §2. Zod schemas (critical VOs)

Validation на API boundary. Используется в API handlers (request body) и при импорте (parser output). Sample для 7 critical VOs.

```typescript
import { z } from "zod";

// 2.1 Weight (8 sub-variants)
const WeightSchema = z.discriminatedUnion("variant", [
  z.object({ variant: z.literal("single"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("dual"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("single_arm"), valueKg: z.number().positive() }),
  z.object({
    variant: z.literal("compound_device"),
    equipment: z.enum([
      "BODYWEIGHT",
      "DUMBBELL",
      "KETTLEBELL",
      "BARBELL",
      "BAND",
      "PARALLEL_BARS",
      "RINGS",
      "BOX",
      "SOFA",
      "BOX_OR_SOFA",
      "MIXED",
      "UNKNOWN",
    ]),
    count: z.union([z.literal(1), z.literal(2)]),
    valueKg: z.number().positive(),
  }),
  z.object({
    variant: z.literal("split_tier"),
    stages: z
      .array(
        z.object({
          reps: z.number().int().positive(),
          equipment: z.enum(["DUMBBELL", "KETTLEBELL", "BARBELL", "MIXED"]),
          valueKg: z.number().positive(),
        }),
      )
      .min(2),
  }),
  z.object({
    variant: z.literal("dual_value"),
    first: z.number().positive(),
    second: z.number().positive(),
    resolver: z.literal("athlete_profile"),
  }),
  z.object({
    variant: z.literal("with_asymmetric_arm"),
    valueKg: z.number().positive(),
    workingArm: z.enum(["left", "right"]),
    passiveArmAction: z.enum(["hold_in_up", "hold_static", "hold_with_extra_weight"]),
    passiveExtraWeight: z
      .object({
        equipment: z.enum(["DUMBBELL", "KETTLEBELL"]),
        valueKg: z.number().positive(),
      })
      .optional(),
  }),
  z.object({
    variant: z.literal("with_depth_modifier"),
    valueKg: z.number().positive(),
    depth: z.enum(["to_parallel", "full_rom", "partial"]),
  }),
]);

// 2.2 Load (5 variants)
const PercentageReferenceSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("self") }),
  z.object({ scope: z.literal("movement_family"), movementFamily: z.string().min(1) }),
  z.object({ scope: z.literal("other_exercise"), targetExerciseId: z.string().cuid() }),
]);

const LoadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("absolute"), weight: WeightSchema }),
  z.object({
    kind: z.literal("percentage"),
    value: z.number().min(0).max(200),
    rangeMax: z.number().min(0).max(200).optional(),
    reference: PercentageReferenceSchema,
  }),
  z.object({ kind: z.literal("bodyweight") }),
  z.object({ kind: z.literal("without_weight"), context: z.literal("drop_set_stage") }),
  z.object({ kind: z.literal("unspecified") }),
]);

// 2.3 Intensity (struct optional fields; Phase 7 — hrZone + numericPace)
const EffortPercentSchema = z.union([
  z.object({ value: z.number().min(0).max(100) }),
  z.object({
    range: z
      .object({ min: z.number(), max: z.number() })
      .refine((r) => r.min < r.max, "range min < max"),
  }),
]);

const HrZoneSchema = z.object({
  zone: z.enum(["Z1", "Z2", "Z3", "Z4", "Z5"]),
});

const NumericPaceSchema = z.object({
  value: z.string().regex(/^\d{1,2}:[0-5]\d$|^\d{1,3}$/, "value must be MM:SS or seconds-only"),
  distanceUnit: z.enum(["km", "mi", "m", "yd", "lap"]),
  paceType: z.enum(["min_per_distance", "distance_per_min"]),
});

const IntensitySchema = z
  .object({
    effortPercent: EffortPercentSchema.optional(),
    rpe: z.object({ value: z.number().min(1).max(10) }).optional(),
    pace: z.enum(["easy", "moderate", "hard", "recovery"]).optional(),
    hrZone: HrZoneSchema.optional(),
    numericPace: NumericPaceSchema.optional(),
  })
  .refine(
    (i) => i.effortPercent || i.rpe || i.pace || i.hrZone || i.numericPace,
    "Intensity must have at least one field set",
  );

// 2.4 RepNotation
const RepNotationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("count"), value: z.number().int().positive() }),
  z
    .object({
      kind: z.literal("range"),
      min: z.number().int().positive(),
      max: z.number().int().positive(),
    })
    .refine((r) => r.min < r.max, "range min < max"),
  z
    .object({
      kind: z.literal("unit_bound"),
      unit: z.enum(["sec", "min", "km"]),
      value: z.number().positive().optional(),
      range: z.object({ min: z.number(), max: z.number() }).optional(),
    })
    .refine(
      (r) => r.value !== undefined || r.range !== undefined,
      "unit_bound needs value or range",
    ),
  z.object({
    kind: z.literal("max"),
    subForm: z.enum(["bare", "progressive", "in_remaining_time"]),
    progressiveSeed: z.string().optional(),
    targetExerciseId: z.string().cuid().optional(),
  }),
  z.object({ kind: z.literal("implicit") }),
  z.object({ kind: z.literal("total_flag"), value: z.number().int().positive() }),
  z.object({ kind: z.literal("compound_rep_unit") }),
]);

// 2.5 MediaReference
const MediaReferenceSchema = z.object({
  url: z.string().url(),
  position: z.enum(["inline", "standalone_row", "bare"]),
  label: z.string().optional(),
  appliesTo: z.enum(["previous_row", "current_row", "whole_schema", "drop_stage"]),
});

// 2.6 TimeCap (block-146)
const TimeCapSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive().optional(),
    unit: z.enum(["min", "sec"]),
  })
  .refine((t) => t.max === undefined || t.min < t.max, "max must exceed min");

// 2.7 ApplicableLevels (Label)
const ApplicableLevelsSchema = z
  .array(z.enum(["day", "session", "block"]))
  .min(1, "applicable_levels must not be empty")
  .refine((arr) => new Set(arr).size === arr.length, "applicable_levels must be unique");

// 2.8 TempoModifier (Phase 7 — fullTempo)
const FullTempoSchema = z.object({
  eccentric: z.number().int().min(0).max(60),
  pauseBottom: z.number().int().min(0).max(60),
  concentric: z.number().int().min(0).max(60),
  pauseTop: z.number().int().min(0).max(60),
});

const TempoModifierSchema = z
  .object({
    pauseInUp: z
      .object({
        durationSec: z.number().positive(),
        position: z.literal("up").optional(),
      })
      .optional(),
    perNthRepPause: z
      .object({
        everyN: z.number().int().positive(),
        pauseSec: z.number().positive(),
      })
      .optional(),
    slowEccentric: z.object({ durationSec: z.number().positive() }).optional(),
    holdAfterLast: z.object({ durationSec: z.number().positive() }).optional(),
    fullTempo: FullTempoSchema.optional(),
  })
  .refine(
    (t) => t.pauseInUp || t.perNthRepPause || t.slowEccentric || t.holdAfterLast || t.fullTempo,
    "TempoModifier must have at least one field set",
  );

// 2.9 StagedProgram (Phase 7 — rename DropSetProgram, +programKind, +restBetweenStages)
const StageSchema = z.object({
  reps: z.union([z.number().int().positive(), RepNotationSchema]),
  load: LoadSchema.optional(),
  indicator: z.enum(["explode", "without_weight"]).optional(),
  label: z.string().optional(),
  media: MediaReferenceSchema.optional(),
});

const RestSpecSchema = z.object({
  duration: z.object({
    value: z.number().positive(),
    unit: z.enum(["sec", "min", "range_sec", "range_min"]),
    rangeMax: z.number().positive().optional(),
  }),
  scope: z.enum(["between_sets", "between_rounds", "between_intervals", "after_specific_set"]),
  qualifier: z.enum(["until_recovery", "fixed", "range"]).optional(),
  setIndex: z.number().int().positive().optional(),
});

const StagedProgramSchema = z
  .object({
    programKind: z.enum(["drop_set", "wave", "cluster"]),
    stages: z.array(StageSchema).min(1, "StagedProgram requires at least 1 stage"),
    setsCount: z.number().int().positive().optional(),
    stageCountPerSet: z.number().int().positive().optional(),
    separatorForm: z.literal("...then...").optional(),
    mediaPerStage: z.record(z.string(), MediaReferenceSchema).optional(),
    restBetweenStages: RestSpecSchema.optional(),
  })
  .refine(
    (p) =>
      p.programKind !== "cluster" ||
      (p.setsCount !== undefined && p.stageCountPerSet !== undefined),
    "cluster programKind requires setsCount and stageCountPerSet",
  );

// 2.10 SuperSet (Phase 7 — Ext 5, Q20)
const SuperSetPairSchema = z.object({
  label: z.string().min(1, "pair label required"),
  schemaRows: z.array(z.string().cuid()).min(2, "super-set pair needs 2+ sequential rows"),
});

const ArchetypeSuperSetParamsSchema = z.object({
  pairs: z.array(SuperSetPairSchema).min(1, "super-set requires at least 1 pair"),
  restBetweenPairs: RestSpecSchema.optional(),
  rounds: z.number().int().positive(),
});

export {
  WeightSchema,
  LoadSchema,
  IntensitySchema,
  RepNotationSchema,
  MediaReferenceSchema,
  TimeCapSchema,
  ApplicableLevelsSchema,
  HrZoneSchema,
  NumericPaceSchema,
  FullTempoSchema,
  TempoModifierSchema,
  StageSchema,
  RestSpecSchema,
  StagedProgramSchema,
  SuperSetPairSchema,
  ArchetypeSuperSetParamsSchema,
};
```

---

## §3. Resolution algorithms (pseudocode)

### §3.1 Compound trailing weight (DP4 a+c hybrid)

Применяется при render / validate compound row с trailing `[ weight ]` annotation.

```typescript
function resolveCompoundElementLoad(
  element: CompoundRowElement,
  compound: CompoundRow,
  exercise: Exercise,
): Load {
  // 1. Per-element inline overrides shared.
  if (element.load !== undefined) {
    return element.load;
  }

  // 2. Bodyweight exercises skip trailing weight (per DP4 a).
  const bodyweightEquipment: Equipment[] = ["BODYWEIGHT", "BAND", "PARALLEL_BARS", "RINGS"];
  if (bodyweightEquipment.includes(exercise.primaryEquipment)) {
    return { kind: "bodyweight" };
  }

  // 3. Loaded element gets shared trailing weight.
  if (compound.sharedModifiers?.load) {
    return compound.sharedModifiers.load;
  }

  // 4. Fallback chain: Exercise.defaultLoad → unspecified.
  if (exercise.defaultLoad) {
    return exercise.defaultLoad;
  }
  return { kind: "unspecified" };
}
```

### §3.2 Intensity partial overlay (Q3)

Per-field independent inheritance row → schema → block.

```typescript
function effectiveIntensity(row: SchemaRow, schema: Schema, block: Block): Intensity | null {
  const rowI = row.intensity as Intensity | null;
  const schemaI = schema.intensity as Intensity | null;
  const blockI = block.intensity as Intensity | null;

  const effortPercent = rowI?.effortPercent ?? schemaI?.effortPercent ?? blockI?.effortPercent;
  const rpe = rowI?.rpe ?? schemaI?.rpe ?? blockI?.rpe;
  const pace = rowI?.pace ?? schemaI?.pace ?? blockI?.pace;

  if (!effortPercent && !rpe && !pace) return null;
  return { effortPercent, rpe, pace };
}
```

### §3.3 1RM lookup (DP1 c hybrid)

Per-exercise primary; movement_family soft fallback.

```typescript
async function lookupOneRM(
  userId: string,
  exercise: Exercise,
): Promise<{ valueKg: number; source: "direct" | "family_fallback" } | null> {
  // 1. Direct per-exercise.
  const direct = await db.oneRMRecord.findUnique({
    where: { userId_exerciseId: { userId, exerciseId: exercise.id } },
  });
  if (direct) return { valueKg: Number(direct.valueKg), source: "direct" };

  // 2. Family fallback (Q DP1 c).
  if (exercise.movementFamily) {
    const familyRecords = await db.oneRMRecord.findMany({
      where: {
        userId,
        exercise: { movementFamily: exercise.movementFamily },
      },
      orderBy: { recordedAt: "desc" },
    });
    if (familyRecords.length > 0) {
      const median = familyRecords[Math.floor(familyRecords.length / 2)];
      return { valueKg: Number(median.valueKg) * 0.9, source: "family_fallback" };
    }
  }

  // 3. No record — coach UX prompts.
  return null;
}
```

### §3.4 Live formula resolution (DP2 b + Q10)

Применяется при render / actual_load capture.

```typescript
async function resolveSessionLoads(session: Session, userId: string): Promise<ResolvedSession> {
  const blocks = await db.block.findMany({
    where: { sessionId: session.id },
    include: { schemas: true },
  });

  for (const block of blocks) {
    for (const schema of block.schemas) {
      const rows = await db.schemaRow.findMany({ where: { schemaId: schema.id } });
      for (const row of rows) {
        const load = row.load as Load | null;
        if (load?.kind === "percentage") {
          if (session.freezeLoadsAtCreation) {
            continue;
          }
          const exerciseRef = extractExerciseId(row);
          if (!exerciseRef) continue;
          const exercise = await db.exercise.findUnique({ where: { id: exerciseRef } });
          if (!exercise) continue;
          const oneRm = await lookupOneRM(userId, exercise);
          if (oneRm) {
            const percentage = load.value / 100;
            const resolvedKg = oneRm.valueKg * percentage;
            row.load = { kind: "absolute", weight: { variant: "single", valueKg: resolvedKg } };
          }
        }
      }
    }
  }
  return { session, blocks };
}
```

При `freezeLoadsAtCreation = true` Session creation hook резолвит все percentage loads в absolute kg и пишет в DB (через Prisma update). После этого all reads возвращают frozen values.

### §3.5 Dual-value resolver (deferred placeholder)

> **RATIFIED OUT 2026-05-12** per D2 — `Athlete` and `Athlete.profileAttributes` removed. The pseudocode below is preserved for historical context; future implementation reads `tier` / `sex` from **explicit columns on `AthleteProfile`** (app-level schema), not from a jsonb bag. Concrete column shapes land in Phase 8+ when the dual-value UX is designed.

```typescript
function resolveDualValue(weight: Weight, athlete: Athlete): Weight {
  if (weight.variant !== "dual_value") return weight;

  const profile = athlete.profileAttributes as ProfileAttributes;
  const tier = profile?.tier;
  const sex = profile?.sex;

  const useFirst = tier === "RX" || sex === "male";
  const valueKg = useFirst ? weight.first : weight.second;

  return { variant: "single", valueKg };
}
```

### §3.6 Label decomposition (Phase 4 Rules 1-3 + Q8 pace correction)

Preprocessor для inventory composite-string → final Block shape.

```typescript
function decomposeCompositeLabel(input: string): {
  labels: string[];
  intensity?: Intensity;
  timeCap?: TimeCap;
  schemaHeaderPrefix?: string;
} {
  let remaining = input;
  let intensity: Intensity | undefined;
  let timeCap: TimeCap | undefined;
  let schemaHeaderPrefix: string | undefined;

  const bracketMatch = remaining.match(/\[\s*([^\]]+)\s*\]/);
  if (bracketMatch) {
    const content = bracketMatch[1];
    const effortMatch = content.match(/^(\d+)(?:-(\d+))?%\s*Effort$/i);
    const timeCapMatch = content.match(/^(\d+)(?:-(\d+))?\s*(min|sec)$/i);
    if (effortMatch) {
      const value = parseInt(effortMatch[1], 10);
      const maxValue = effortMatch[2] ? parseInt(effortMatch[2], 10) : undefined;
      intensity = {
        effortPercent: maxValue ? { range: { min: value, max: maxValue } } : { value },
      };
      remaining = remaining.replace(bracketMatch[0], "").trim();
    } else if (timeCapMatch) {
      const min = parseInt(timeCapMatch[1], 10);
      const max = timeCapMatch[2] ? parseInt(timeCapMatch[2], 10) : undefined;
      const unit = timeCapMatch[3].toLowerCase() as "min" | "sec";
      timeCap = { min, max, unit };
      remaining = remaining.replace(bracketMatch[0], "").trim();
    }
  }

  const paceMatch = remaining.match(/\b(EASY|MODERATE|HARD|RECOVERY)\s+PACE\b/i);
  if (paceMatch) {
    intensity = { ...intensity, pace: paceMatch[1].toLowerCase() as PaceValue };
    remaining = remaining
      .replace(paceMatch[0], "")
      .replace(/\|\s*$/, "")
      .replace(/^\s*\|/, "")
      .trim();
  }

  const schemaHeaderMatch = remaining.match(/(\d+(?:-\d+)?)\s+(sets|rounds)\b/i);
  if (schemaHeaderMatch) {
    schemaHeaderPrefix = `${schemaHeaderMatch[1]} ${schemaHeaderMatch[2].toLowerCase()}:`;
    remaining = remaining
      .replace(schemaHeaderMatch[0], "")
      .replace(/\|\s*$/, "")
      .replace(/^\s*\|/, "")
      .trim();
  }

  const labels = remaining
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return { labels, intensity, timeCap, schemaHeaderPrefix };
}
```

### §3.7 Trailing connector extraction (Phase 2.1 case-then-connector)

При парсинге body — `then:` / `...then...:` / `...then N rounds:` хранится:

- Если внутри composite-archetype body (block-019) — это `RowKind.CONNECTOR` row в конце body.
- Если на хвосте отдельной schema (block-006 — single-line + then) — это `Schema.trailingConnector` field (либо ConnectorRow в body предыдущей schema).

Phase 5 ratified explicit row (ConnectorRow); Phase 6 хранит и в `Schema.trailingConnector` (для UX rendering хвостовой строки без iteration body). Synchronization rule: parser populates both fields при ingest; updates сначала пишут в `trailingConnector`, body row auto-updates через trigger / app hook.

### §3.8 HR zone resolution (Ext 1, Q16)

> **RATIFIED OUT 2026-05-12** per D2 — `Athlete.profileAttributes.hrMax` removed. Future implementation reads `hrMaxBpm` (или аналогичное explicit field) **из `AthleteProfile`** (app-level schema), не jsonb. Concrete column shape — Phase 8+ когда athlete-profile UI получит HR-max input. The Z1..Z5 percent table below остаётся canonical.

Categorical `hrZone.zone` → athlete-specific BPM range. Phase 7 model не хранит абсолютные BPM — только zone enum. Resolution = derived view (по будущему `AthleteProfile.hrMaxBpm`).

```typescript
type HrZone = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

const HR_ZONE_PERCENT_TABLE: Record<HrZone, { minPct: number; maxPct: number }> = {
  Z1: { minPct: 50, maxPct: 60 },
  Z2: { minPct: 60, maxPct: 70 },
  Z3: { minPct: 70, maxPct: 80 },
  Z4: { minPct: 80, maxPct: 90 },
  Z5: { minPct: 90, maxPct: 100 },
};

function resolveHrZoneToBpm(
  zone: HrZone,
  athlete: Athlete,
): { minBpm: number; maxBpm: number } | null {
  const profile = athlete.profileAttributes as ProfileAttributes;
  const hrMax = profile?.hrMax;
  if (typeof hrMax !== "number" || hrMax <= 0) return null;

  const { minPct, maxPct } = HR_ZONE_PERCENT_TABLE[zone];
  return {
    minBpm: Math.round(hrMax * (minPct / 100)),
    maxBpm: Math.round(hrMax * (maxPct / 100)),
  };
}
```

Zone enum остаётся canonical в prescription. Если `AthleteProfile.hrMaxBpm` отсутствует → UI prompts coach "set athlete HR max to display BPM ranges".

### §3.9 Numeric pace interpretation (Ext 2, Q17)

`numericPace.paceType` discriminator:

- `min_per_distance` (default): value = MM:SS / unit (running, rowing standard). Lower = faster.
- `distance_per_min`: value = numeric distance per minute (swim laps/min, occasional cycling cadence). Higher = faster.

```typescript
type NumericPace = {
  value: string;
  distanceUnit: "km" | "mi" | "m" | "yd" | "lap";
  paceType: "min_per_distance" | "distance_per_min";
};

function parseMinSec(value: string): number | null {
  const mmSs = value.match(/^(\d{1,2}):([0-5]\d)$/);
  if (mmSs) {
    return parseInt(mmSs[1], 10) * 60 + parseInt(mmSs[2], 10);
  }
  const secOnly = value.match(/^\d{1,3}$/);
  if (secOnly) return parseInt(value, 10);
  return null;
}

function describeNumericPace(p: NumericPace): string {
  if (p.paceType === "min_per_distance") {
    const sec = parseMinSec(p.value);
    if (sec === null) return `${p.value} / ${p.distanceUnit}`;
    return `${p.value} per ${p.distanceUnit}`;
  }
  return `${p.value} ${p.distanceUnit} / min`;
}
```

Examples:

- Run 5K target: `{ value: "4:30", distanceUnit: "km", paceType: "min_per_distance" }` → "4:30 per km".
- Row 500m split: `{ value: "1:50", distanceUnit: "m", paceType: "min_per_distance" }` → "1:50 per m" (interpreted per ROW_ERG-conventional 500m split — UI rendering can append "/500m" canonical decoration).
- Swim 50m laps/min: `{ value: "1.5", distanceUnit: "lap", paceType: "distance_per_min" }` → "1.5 lap / min".

UI / parser layer applies modality-specific conventions для display, model хранит canonical shape.

### §3.10 Full tempo parser (Ext 3, Q18)

4-digit notation `"3-1-2-0"` → `FullTempo { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 }`. `"X"` (eXplosive) sub-position = 0 seconds.

```typescript
function parseFullTempo(input: string): FullTempo | null {
  const cleaned = input.trim().toUpperCase().replace(/X/g, "0");
  const match = cleaned.match(/^(\d+)[-\s]+(\d+)[-\s]+(\d+)[-\s]+(\d+)$/);
  if (!match) return null;
  return {
    eccentric: parseInt(match[1], 10),
    pauseBottom: parseInt(match[2], 10),
    concentric: parseInt(match[3], 10),
    pauseTop: parseInt(match[4], 10),
  };
}

function renderFullTempo(t: FullTempo): string {
  const render = (n: number) => (n === 0 ? "X" : String(n));
  return [t.eccentric, t.pauseBottom, t.concentric, t.pauseTop].map(render).join("-");
}
```

Convention: тренер вводит `"3-1-2-0"` или `"3-1-X-0"`; parser нормализует, model хранит 4 integers. При render UI восстанавливает `X` notation для нулевых верхних пауз (concentric/pauseTop) ради читаемости.

### §3.11 StagedProgram execution flow (Ext 4, Q19)

Три programKind variants — caller iterates по-разному.

```typescript
function* iterateStagedProgram(
  program: StagedProgram,
): Generator<{ setIndex: number; stageIndex: number; stage: Stage }> {
  if (program.programKind === "drop_set" || program.programKind === "cluster") {
    const setsCount = program.setsCount ?? 1;
    for (let setIndex = 1; setIndex <= setsCount; setIndex++) {
      for (let stageIndex = 0; stageIndex < program.stages.length; stageIndex++) {
        yield { setIndex, stageIndex, stage: program.stages[stageIndex] };
      }
    }
    return;
  }

  // programKind === "wave"
  // Каждый stage = independent set, no outer sets repetition.
  for (let stageIndex = 0; stageIndex < program.stages.length; stageIndex++) {
    yield { setIndex: stageIndex + 1, stageIndex, stage: program.stages[stageIndex] };
  }
}
```

Semantic per kind:

- `drop_set`: outer N sets × inner stage progression (e.g., Bulgarian 3 sets × [stage1 stage2 stage3]).
- `wave`: stages = sequential sets с разной нагрузкой (e.g., 3 sets snatch @ 70 / 80 / 90%). No outer repetition.
- `cluster`: outer N sets × mini-stages (cluster reps) с intra-cluster rest (`restBetweenStages`).

Validation rule (Zod refine, см. §2.9): `cluster` требует `setsCount` + `stageCountPerSet`. `wave` typically не использует `setsCount` (каждый stage = own set). `drop_set` matches Phase 5 ratified shape.

### §3.12 Super-set execution flow (Ext 5, Q20)

Outer loop = `rounds`, inner = pairs последовательно, внутри pair — rows последовательно. Между pairs опционально `restBetweenPairs`.

```typescript
function* iterateSuperSet(
  params: ArchetypeSuperSetParams,
  rowsById: Map<SchemaRowRef, SchemaRow>,
): Generator<{ round: number; pairLabel: string; row: SchemaRow }> {
  for (let round = 1; round <= params.rounds; round++) {
    for (const pair of params.pairs) {
      for (const rowId of pair.schemaRows) {
        const row = rowsById.get(rowId);
        if (!row) {
          throw new Error(`super-set pair "${pair.label}" references missing row ${rowId}`);
        }
        yield { round, pairLabel: pair.label, row };
      }
    }
  }
}
```

Validation:

- Каждый `SchemaRowRef` в `pairs[].schemaRows` должен резолвиться в существующий `SchemaRow` той же schemы (FK check на app layer).
- `pairs.length >= 1`; `pairs[i].schemaRows.length >= 2` (super-set по definition — 2+ rows последовательно).
- `pair.label` unique внутри params (`A1`, `A2`, `B1`, ...) — soft warning if duplicate.

Family = `ROUNDS_SETS` (не отдельный family). Differentiation от `n-rounds`: explicit ordered pair grouping + per-pair rest scheme. От `alternating-sets`: super-set — single schema; alternating-sets — 2..N schemas, объединённые в `AlternatingGroup` (block-scoped N-ary grouping entity, см. §4.9 / D14).

---

### §3.13 Named-program header rendering (Q11 Phase 7.1)

Schema `kind = NAMED` + archetype `named-exercise-program` — header может быть либо bare display name (без equipment prefix, как в sample: `Bulgarian split squats:`), либо неявным fallback'ом из canonical exercise. `Schema.header String?` — single source of truth для override; null = render from archetype context.

```typescript
function renderNamedProgramHeader(schema: Schema, exercise: Exercise): string {
  return schema.header ?? `${exercise.canonicalName}:`;
}
```

Fallback semantic:

- `schema.header = "Bulgarian split squats:"` (bare display) + `exerciseId → DB Bulgarian split squats` → UI рендерит `"Bulgarian split squats:"` (override wins). Per-stage Load (StagedProgram.stages) overrides intrinsic equipment exercise'а — stage 1 = DB 2x15, stage 2 = DB 1x15, stage 3 = bodyweight (programKind=drop_set).
- `schema.header = null` + `exerciseId → DB Bulgarian split squats` → UI рендерит `"DB Bulgarian split squats:"` (canonical name + colon).

**FK target rule**: Любой Exercise — valid FK target для `archetypeParams.exerciseId`. Catalog не содержит abstract entries (no equipment-stripped duplicates). 149 canonical exercises (Phase 3.2) остаются единственным источником.

**Use cases**:

- Тренер хочет sample-style display (bare display name, hides equipment) — выбирает concrete sibling FK + override `Schema.header`.
- Тренер хочет explicit display (показать equipment) — выбирает concrete FK без override.

Validation:

- `exerciseId` — FK на existing Exercise (любой). No special-case lookup.
- `schema.header` — optional string, no parse / no validation beyond max length.
- UI builder подсказывает override placeholder = `exercise.canonicalName + ":"` (так юзер видит fallback и может оставить пустым).

---

## §4. Migration considerations

### §4.1 Order field defaults (Q6)

Sparse integer increments — 10, 20, 30, ... per default.

```sql
-- Migration helper: assign order при initial seed.
INSERT INTO "Day" (id, "order", "labelId")
SELECT
  cuid_generate(),
  10 * row_number() OVER (PARTITION BY week_id ORDER BY position),
  label_id
FROM inventory_day_source;
```

UI / API contract: при insert между existing items, use midpoint. При `prev.order=10` и `next.order=20` — new item gets `order=15`. Если midpoint = existing — trigger renumber within `(prev, next)` range (rare).

### §4.2 Label.applicableLevels defaults

При migration из inventory:

- Day labels (`REST DAY`) → `applicableLevels: ["day"]`.
- Session labels (`1ST SESSION`) → `applicableLevels: ["session"]`.
- Block labels (17 canonical) → `applicableLevels: ["block"]`.

Q2 mutation policy: при change `applicableLevels`, existing assignments **keep**. UI shows warning при mutation если есть assignments вне нового set.

Migration warning sample:

```
Label "YOGA TIME" changing applicable_levels from [block] to [session].
Existing assignments: 4 blocks reference this label.
These assignments will remain valid but will display warning in UI.
Proceed?
```

### §4.3 Exercise.defaultLoad nullable

Для 149 canonical exercises:

- Bodyweight equipment → `defaultLoad: { kind: "bodyweight" }` если ≥80% occurrences без annotation.
- Weighted с stable load → `defaultLoad: { kind: "absolute", weight: { ... } }` per Phase 3.3 §2 stability (e.g., DB bench presses → `{ variant: "dual", valueKg: 15 }`).
- Variable / weighted-implicit → `defaultLoad: null` (UI prompts coach).

### §4.4 Pace label removal (Q8)

Migration script для `EASY PACE` (если present в legacy data):

```typescript
const easyPaceLabel = await db.label.findUnique({ where: { nameLower: "easy pace" } });
if (easyPaceLabel) {
  const assignments = await db.blockLabelAssignment.findMany({
    where: { labelId: easyPaceLabel.id },
    include: { block: true },
  });

  for (const assignment of assignments) {
    const block = assignment.block;
    const existingIntensity = (block.intensity as Intensity | null) ?? {};
    const newIntensity: Intensity = { ...existingIntensity, pace: "easy" };
    await db.block.update({
      where: { id: block.id },
      data: { intensity: newIntensity },
    });
  }

  await db.blockLabelAssignment.deleteMany({ where: { labelId: easyPaceLabel.id } });
  await db.label.delete({ where: { id: easyPaceLabel.id } });
}
```

### §4.5 Archetype seed

После Phase 7 — **34** archetypes (33 Phase 1-6 + super-set Phase 7) — seed на startup. `name` unique, kebab-case identifier. Sample seed entries:

```typescript
await db.archetype.upsert({
  where: { name: "parallel-ladders-descending" },
  create: {
    name: "parallel-ladders-descending",
    kind: "HEADERLESS",
    family: "LADDER",
    headerPatternDescription: "no header; body содержит multiple `N-M-K:` ladder markers",
    bodyLayoutDescription: "alternating InnerLadderMarkerRow + ExerciseRow pairs",
    archetypeParamsSchema: { required: ["ladders"], properties: { ladders: { type: "array" } } },
    relatedArchetypes: [
      { kind: "specialization_of", target: "ladder-descending" },
      { kind: "paired_with", target: "parallel-ladders-mixed-direction" },
      { kind: "paired_with", target: "parallel-pyramids" },
      { kind: "extension_of", target: "nested-rounds-over-parallel-ladder" },
    ],
  },
  update: {},
});

// Phase 7 — super-set archetype (Ext 5, Q20)
await db.archetype.upsert({
  where: { name: "super-set" },
  create: {
    name: "super-set",
    kind: "ATOMIC",
    family: "ROUNDS_SETS",
    headerPatternDescription: "Super-set <label> | <N> rounds:",
    bodyLayoutDescription: "ordered SchemaRows referenced by SuperSetPair[].schemaRows",
    archetypeParamsSchema: {
      required: ["pairs", "rounds"],
      properties: {
        pairs: { type: "array", items: { type: "object", required: ["label", "schemaRows"] } },
        rounds: { type: "integer", minimum: 1 },
        restBetweenPairs: { type: "object", nullable: true },
      },
    },
    relatedArchetypes: [
      { kind: "paired_with", target: "alternating-sets" },
      { kind: "specialization_of", target: "n-rounds" },
    ],
  },
  update: {},
});
```

### §4.6 Catalog seed scope (Q11 Phase 7.1)

> **RATIFIED 2026-05-12 (D4)** — `Exercise` и `Label` объявлены **libraries** (admin-managed, **не** auto-seeded). 149-список Phase 3.2 остаётся reference content / starter pack (например, CSV-import при онбординге), но не выполняется автоматически при `db:reset`. Coach при первом запуске admin UI заполняет catalog сам. См. §0.4.

Exercise catalog seed = **149 canonical exercises** (Phase 3.2 list, no special abstract entries). Не вводить equipment-stripped duplicate ("Bulgarian split squats" abstract) — это не масштабируется (каждый named-program movement требовал бы отдельной abstract entry, шум в search/library).

Resolution для named-exercise-program archetype:

- `archetypeParams.exerciseId` — FK на **любой** existing Exercise (concrete sibling из 149-list).
- `Schema.header String?` — optional display override. Algorithm: `displayHeader = schema.header ?? (exercise.canonicalName + ":")` (см. §3.13).
- Block-008 sample-case: `exerciseId → DB Bulgarian split squats`, `Schema.header = "Bulgarian split squats:"` (override для bare display).

### §4.7 Step 7.3.6 — Block (sessionId, order) composite uniqueness constraint

Added 2026-05-18 per Step 7.3.6 (closes Step 7.1 Stage 6 QA-001 carry-forward). Prisma `@@unique([sessionId, order])` on Block model enforces composite uniqueness at the DB layer. Pre-existing `lmsBlockApi.create` flow (`_max(order) + 10` inside `Serializable` transaction wrapped in `retryOnP2034`) was previously protected only by Postgres SSI false-positive detection — under SSI predicate-lock granularity edge cases, concurrent creates on the same session could silently insert duplicate `(sessionId, order)` rows. Constraint addition eliminates the silent-corruption surface; P2002 surface on the loser propagates as `ConflictError` via existing `handlePrismaError`. Future enhancement (deferred carry-forward QA-001b): wrap `retryOnP2034` (or new variant) to also retry P2002 на `_max+N` insert pattern, preserving prior concurrent UX where two simultaneous creates often produced fulfilledCount=2. Out of QA-001 closure scope.

Reorder fix (scope-expansion ratified at execution time after intermediate-state P2002 surfaced in the `reorder` happy-path swap test — planner adversarial pass had only considered concurrent reorder+create): `lmsBlockApi.reorder` now uses a two-pass `UPDATE` pattern within a single `prisma.$transaction([...])` batch — Pass 1 shifts every target row to a negative-order placeholder (`-1, -2, -3, ...`) to clear unique-constraint collisions on stateful swap patterns (e.g., `[c, a, b]` from initial `[a:10, b:20, c:30]`); Pass 2 assigns the final sparse orders (`10, 20, 30, ...`). Atomic via Prisma batch transaction. Required because Postgres unique constraints are NOT `DEFERRABLE` by default — they fire at statement boundary, so direct UPDATEs that swap orders collide intra-transaction. Pure app-layer fix; the constraint itself stays in Prisma DSL per § 0.9 convention (no SQL outside `apply-sql-checks.ts`).

### §4.8 Step 8.0b — RowKind.CONNECTOR dropped per D12 (2026-05-18)

Per D12 ratify 2026-05-18 (planning thesis cycle Step 8 top-level): `Schema.trailingConnector Json?` field on the Schema entity is canonical persistence для трейлинг-коннектора. The earlier Phase 5 ratification of «ConnectorRow as explicit row at body tail» (domain-model.md §1.6.9 pre-D12) was overridden. `RowKind.CONNECTOR` enum value dropped from Prisma schema + 06-formalization/schema.prisma mirror + 06-formalization/types.ts SchemaRowPayload variant. Resulting `RowKind` enum = 9 values (was 10). `ConnectorForm` enum (`then` / `then_dots` / `then_n_rounds`) survives в `_shared/enums.ts` shipped Step 8.0a — consumed by `Schema.trailingConnector` field via `trailingConnectorSchema` (XOR refine: `form === "then_n_rounds"` requires `roundsCount`; else `roundsCount` forbidden). Per coach POV: "then 3 rounds" = modifier на schema-to-schema transition (meta), not content tail body; cleaner data shape; render logic не фильтрует CONNECTOR row из body iteration.

### §4.9 Step 8.1c — SchemaPairing → AlternatingGroup redesign per D14 (2026-05-20)

Per D14 ratify 2026-05-20 (planner-user thesis cycle): the `SchemaPairing` 2-FK pair table is replaced by `AlternatingGroup`, a block-scoped N-ary grouping entity.

Rationale: `alternating-sets` is an **N-ary** relation — a coach links 2..N schemas into one alternating cycle with no upper bound (sets 1·4·7 / 2·5·8 / 3·6·9 cycled in turn). `SchemaPairing` carried exactly two FKs (`schemaAId` + `schemaBId`, `@@unique([schemaAId, schemaBId])`) and could not express N>2. The analysis modelled "pair" from a single cardinality-2 sample (block-009, 2 schemas) and `05-synthesis/edge-cases.md` §1.2 explicitly flagged that as provisional ("если block-singleton appears в новом блоке → cardinality растёт") — D14 is the anticipated correction, not a contradiction of the analysis. Escalated and ratified per the WORKFLOW.md "Domain-model change protocol" before any code.

Model change:

- **Dropped**: `enum SchemaPairingRelation`, `model SchemaPairing`.
- **Added**: `enum AlternatingGroupRelation { ALTERNATING_SETS }` (extensible; mirrors the old enum); `model AlternatingGroup { id, blockId, relationKind, createdAt, updatedAt }`.
- **Membership**: single nullable FK `Schema.alternatingGroupId` (`String?`) + `@@index([alternatingGroupId])`. A schema belongs to at most one group — single FK is structurally sufficient, no junction table. `Schema.pairingsA`/`pairingsB` relation fields removed; `Block` gains the `alternatingGroups` back-relation.
- **`onDelete`**: `AlternatingGroup.block` → `Cascade` (deleting a Block deletes its groups); `Schema.alternatingGroup` → `SetNull` (deleting a group leaves the member schemas alive and ungrouped — "delete = unlink, schemas survive"). `SetNull` is valid only because `alternatingGroupId` is nullable.
- **Timestamps** — yes. Unlike the bare `SchemaPairing` join row, `AlternatingGroup` is a managed mutable entity (members added/removed), so it carries `createdAt`/`updatedAt` (mirrors the `Schema`/`SchemaRow` convention, departs from `BlockLabelAssignment`).
- **No member-order column** (C-A1): the set sequence is already in each member's `setEnumeration` (`[1,4,7]` vs `[2,5,8]` vs `[3,6,9]`); card order on screen = `Schema.order`. The group only records membership. The contract `schemaIds` array is therefore an unordered set.
- **Archetype params**: the `alternating-sets` archetype params lose the superseded `pairedWithSchemaId` field (`ArchetypeAlternatingSetsParams` = `{ setEnumeration }` only). Membership is read via a future `AlternatingGroup` embed (D-A2), not via `archetypeParams`.

block-009 stays exactly as-is in cardinality — 2 schemas — but its representation changes from a `SchemaPairing` row to a 2-member `AlternatingGroup`; the model now supports any N≥2. Step 8.1c is the schema-change sub-step (definition layer only — no api endpoint, no mapper, no guard); `lmsAlternatingGroupApi` + `verifyAlternatingGroupOwnership` + `mapToAlternatingGroup` follow in Step 8.1d.

---

## §5. Open items / future work

| Item                                                                          | Status                      | Future phase                                                                                                                         |
| ----------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Dual-value resolver (athlete profile attribute name)                          | **DROPPED 2026-05-12 (D2)** | Resolver-input fields переезжают на `AthleteProfile` как explicit columns (sex, tier, ...) когда дизайн UX будет готов               |
| RPE-based notation parsing                                                    | model-ready                 | parser extension при появлении gym-context sample                                                                                    |
| MovementFamily entity upgrade                                                 | string field                | если families > 15 — extract в entity                                                                                                |
| MediaReference library entity                                                 | embedded VO                 | extract для URL dedup при росте catalog                                                                                              |
| Calendar / Week / Plan entities                                               | **CLOSED 2026-05-12 (D1)**  | `Week` ratified как calendar slot (Mon-Sun) с FK на `TrainingPlan` (app-level). `Day.order` → `(weekId, dayOfWeek)`. См. §0.1.       |
| Template / cloning model                                                      | out-of-scope                | uplevel когда templating feature designed                                                                                            |
| `Athlete.profileAttributes.hrMax` finalization                                | **DROPPED 2026-05-12 (D2)** | `hrMaxBpm` (или эквивалент) лягут explicit column на `AthleteProfile` (app-level) при появлении athlete-profile UI. См. §0.2 / §3.8. |
| Modality-specific NumericPace decorations (e.g., "/500m" canonical row split) | UI layer                    | parser выдаёт canonical shape; UI добавляет per-modality conventions                                                                 |

---

## §6. Implementation order recommendation

1. **Library entities first**: Label, Archetype, Exercise — seed + CRUD. Эти library tables не зависят от others, можно реализовать isolated.
2. **Day/Session/Block hierarchy**: container CRUD, label assignment (BlockLabelAssignment + UI).
3. **Schema + SchemaRow**: archetype-aware ingest, JSON validation через Zod.
4. **AlternatingGroup**: alternating-sets N-ary grouping (см. §4.9 / D14).
5. **Athlete / OneRMRecord**: для percentage resolution.
6. **PerformedSession / PerformedExerciseInstance**: после planned session работает.
7. **Resolution algorithms**: parse-time + render-time. Cover all DPs (1-4) + Q10 freeze.
8. **Migration scripts**: bring legacy / inventory data → Phase 6 schema (label preprocessor, exercise canonical seeding).

Critical path estimation: 4-6 sprints для production-ready foundation (без template / calendar / gym features).
