# Step 8.0a — VO infrastructure для Schema-vertical foundation

> Self-contained executor prompt. **Read § 0 first.** Wrapper: `/feature small`. Branch: existing `feat/training-domain` — branch-cut override mandatory per [[training-domain-workflow]].

---

## § 0 — Hard execution triggers (READ FIRST, BEFORE ANY WRITE)

### § 0.0 — Branch-cut override

Ship on the existing long-lived `feat/training-domain` branch. Do NOT cut a new branch under `/feature small`. Confirm before any commit:

```bash
git rev-parse --abbrev-ref HEAD   # must print: feat/training-domain
```

If `/feature small` skill prompts you to cut a branch, decline and proceed on `feat/training-domain`. Per [[training-domain-workflow]] + [[always-via-feature-skill]] precedent.

### § 0.0.A — Verbatim source discipline

Before writing ANY code OR modifying ANY file, you MUST:

1. Read **verbatim** each source listed in § 2 + each § 0.X quote section.
2. Run **verbatim** each grep listed in § 0.A; reconcile actual outputs against expected.
3. Confirm `.husky/{pre-commit,pre-push}` + `turbo.json` + commitlint config per § 0.B + § 0.C.
4. If actual file content drifts from a § 0.X quote — STOP and escalate via `AskUserQuestion`.

This is `[[planner-verbatim-registration]]` flavour enforcement. Per Step 6.0 CONTEXT-001 / Step 6.2 CONTEXT-001 / Step 7.3.5 D-1 precedent: silent drift = silent regression. ESCALATE on any quote-vs-actual diff.

### § 0.0.B — Dep-cruiser `contracts-no-prisma` compliance (CRITICAL)

The dep-cruiser rule `contracts-no-prisma` (`.dependency-cruiser.cjs:26-32`) forbids `@repo/contracts` from importing `@prisma/client`. **DO NOT** use `z.nativeEnum(SomePrismaEnum)` or `import { Equipment } from "@prisma/client"`. Self-define all enum values mirroring Prisma enums via `as const` tuple + `z.enum(TUPLE)` per existing `packages/contracts/src/entities/lms/exercise/exercise.constants.ts:9-58` pattern.

### § 0.0.C — Adversarial pass discipline

Before locking § 3 write ops, mentally simulate per § 5 axes (9 flavours). Surface unexpected risk via `AskUserQuestion`. Per Step 7.3.5 D-1 + 7.3.6 D-2 + 7.4 D-1 precedent — three escalation streak ended at Step 7.5; Step 8.0a inherits zero-escalation baseline.

---

### § 0.1 — Verbatim quote: domain-model.md §2 catalog summary (lines 889-913)

```
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
```

**Executor MUST also Read at execution time** (per [[planner-verbatim-registration]]) — full per-VO sections in `analysis/artifacts/05-synthesis/domain-model.md`:

- §2.1 Load (478-528) — 5 variants enumerated
- §2.2 Weight (531-575) — 8 sub-variants enumerated с примерами
- §2.3 Intensity (579-611) — partial overlay per-field inheritance pattern (block→schema→row independent per field, NOT full override)
- §2.4 RepNotation (614-659) — 7 variants enumerated с sample counts
- §2.5 CompoundRepDefinition (662-676) — curly_brace + inline_equality
- §2.6 PerLimbDistribution (680-695) — each_leg / each_arm / explicit_split, optional fields
- §2.7 TempoModifier (699-711) — 5 optional fields including fullTempo
- §2.8 PositionEquipmentModifier (715-721) — 11 closed enum values
- §2.9 SequenceIndicator (725-737) — 6 variants
- §2.10 StagedProgram (742-772) — 3 program kinds (drop_set / wave / cluster)
- §2.11 PerSetSubstitution (776-785)
- §2.12 OrAlternative (789-801)
- §2.13 MediaReference (805-816) — position/appliesTo discriminators
- §2.14 TimeCap (820-834) — ALREADY SHIPPED в `_shared/time-cap.ts`, do not duplicate
- §2.15 CyclicalCompound (838-852)
- §2.16 SandwichCompound (856-867)
- §2.17 CompoundRow (871-885)

---

### § 0.2 — Verbatim quote: types.ts canonical TS shapes (lines 57-336 + 381-385)

```typescript
export type PaceValue = "easy" | "moderate" | "hard" | "recovery";

export type EffortPercent = { value: number } | { range: { min: number; max: number } };

export type HrZone = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";

export type NumericPaceDistanceUnit = "km" | "mi" | "m" | "yd" | "lap";

export type NumericPaceType = "min_per_distance" | "distance_per_min";

export interface NumericPace {
  value: string;
  distanceUnit: NumericPaceDistanceUnit;
  paceType: NumericPaceType;
}

export interface Intensity {
  effortPercent?: EffortPercent;
  rpe?: { value: number };
  pace?: PaceValue;
  hrZone?: { zone: HrZone };
  numericPace?: NumericPace;
}

export type Weight =
  | { variant: "single"; valueKg: number }
  | { variant: "dual"; valueKg: number }
  | { variant: "single_arm"; valueKg: number }
  | {
      variant: "compound_device";
      equipment: Equipment;
      count: 1 | 2;
      valueKg: number;
    }
  | {
      variant: "split_tier";
      stages: { reps: number; equipment: Equipment; valueKg: number }[];
    }
  | {
      variant: "dual_value";
      first: number;
      second: number;
      resolver: "athlete_profile";
    }
  | {
      variant: "with_asymmetric_arm";
      valueKg: number;
      workingArm: "left" | "right";
      passiveArmAction: "hold_in_up" | "hold_static" | "hold_with_extra_weight";
      passiveExtraWeight?: { equipment: Equipment; valueKg: number };
    }
  | {
      variant: "with_depth_modifier";
      valueKg: number;
      depth: "to_parallel" | "full_rom" | "partial";
    };

export type PercentageReference =
  | { scope: "self" }
  | { scope: "movement_family"; movementFamily: string }
  | { scope: "other_exercise"; targetExerciseId: string };

export type Load =
  | { kind: "absolute"; weight: Weight }
  | {
      kind: "percentage";
      value: number;
      rangeMax?: number;
      reference: PercentageReference;
    }
  | { kind: "bodyweight" }
  | { kind: "without_weight"; context: "drop_set_stage" }
  | { kind: "unspecified" };

export type RepUnit = "sec" | "min" | "km";

export type RepNotation =
  | { kind: "count"; value: number }
  | { kind: "range"; min: number; max: number }
  | {
      kind: "unit_bound";
      unit: RepUnit;
      value?: number;
      range?: { min: number; max: number };
    }
  | {
      kind: "max";
      subForm: "bare" | "progressive" | "in_remaining_time";
      progressiveSeed?: string;
      targetExerciseId?: string;
    }
  | { kind: "implicit" }
  | { kind: "total_flag"; value: number }
  | { kind: "compound_rep_unit" };

export type CompoundRepDefinition =
  | {
      form: "curly_brace";
      composition: { exerciseId: string; count: number }[];
    }
  | {
      form: "inline_equality";
      totalReps: number;
      composition: { exerciseId: string; count: number }[];
    };

export type PerLimbDistribution =
  | { kind: "each_leg"; countPerLimb?: number }
  | { kind: "each_arm"; countPerLimb?: number }
  | {
      kind: "explicit_split";
      side: "left" | "right";
      pairedRowId?: string;
    }
  | { kind: "alternating"; sourceAnnotation?: string };

export interface FullTempo {
  eccentric: number;
  pauseBottom: number;
  concentric: number;
  pauseTop: number;
}

export interface TempoModifier {
  pauseInUp?: { durationSec: number; position?: "up" };
  perNthRepPause?: { everyN: number; pauseSec: number };
  slowEccentric?: { durationSec: number };
  holdAfterLast?: { durationSec: number };
  fullTempo?: FullTempo;
}

export type SequenceIndicator =
  | { kind: "before_named"; targetLabel: string }
  | { kind: "after_named"; targetLabel: string }
  | {
      kind: "before_named_after_named_composite";
      beforeLabel: string;
      afterLabel: string;
    }
  | { kind: "only_once_before"; targetLabel: string }
  | { kind: "after_each_round" }
  | { kind: "after_each_typed_round"; type: string };

export type StageIndicator = "explode" | "without_weight";

export type StagedProgramKind = "drop_set" | "wave" | "cluster";

export interface Stage {
  reps: number | RepNotation;
  load?: Load;
  indicator?: StageIndicator;
  label?: string;
  media?: MediaReference;
}

export interface StagedProgram {
  programKind: StagedProgramKind;
  stages: Stage[];
  setsCount?: number;
  stageCountPerSet?: number;
  separatorForm?: "...then...";
  mediaPerStage?: Record<number, MediaReference>;
  restBetweenStages?: RestSpec;
}

export interface PerSetSubstitutionAssignment {
  setIndex: number;
  exerciseId?: string;
  inlineCompound?: CompoundRow;
}

export interface PerSetSubstitution {
  placeholderName: string;
  assignments: PerSetSubstitutionAssignment[];
}

export type OrAlternativePurpose = "scale_down" | "equipment_substitute" | "coach_choice";

export interface OrAlternative {
  primaryExerciseId: string;
  primaryReps: RepNotation;
  alternativeExerciseId: string;
  alternativeReps: RepNotation;
  purpose: OrAlternativePurpose;
}

export type MediaPosition = "inline" | "standalone_row" | "bare";
export type MediaAppliesTo = "previous_row" | "current_row" | "whole_schema" | "drop_stage";

export interface MediaReference {
  url: string;
  position: MediaPosition;
  label?: string;
  appliesTo: MediaAppliesTo;
}

export interface CyclicalCompoundCycle {
  primaryReps?: number;
  secondaryReps: number;
}

export interface CyclicalCompound {
  primaryExerciseId: string;
  secondaryExerciseId: string;
  cycles: CyclicalCompoundCycle[];
  optionalRotationStepExerciseId?: string;
}

export interface SandwichCompoundElement {
  exerciseId: string;
  reps: RepNotation;
  load?: Load;
}

export interface SandwichCompound {
  opening: SandwichCompoundElement;
  middle: SandwichCompoundElement;
  closing: SandwichCompoundElement;
  sharedModifiers?: {
    tempo?: TempoModifier;
    load?: Load;
  };
}

export interface CompoundRowElement {
  exerciseId: string;
  reps: RepNotation;
  load?: Load;
  side?: PerLimbDistribution;
}

export interface CompoundRow {
  elements: CompoundRowElement[];
  sharedModifiers?: {
    load?: Load;
    tempo?: TempoModifier;
  };
}

export type PlaceholderKind = "muscle_group_reference" | "purpose_category" | "coach_choice_slot";

export interface PlaceholderPayload {
  placeholderKind: PlaceholderKind;
  text: string;
  perSetAssignments?: PerSetSubstitution;
  pairedConcreteRowId?: string;
}

export type ExerciseForm =
  | { form: "atomic"; exerciseId: string }
  | { form: "compound"; compound: CompoundRow }
  | { form: "cyclical"; cyclical: CyclicalCompound }
  | { form: "sandwich"; sandwich: SandwichCompound }
  | { form: "or_alternative"; orAlternative: OrAlternative }
  | { form: "placeholder_ref"; placeholderExerciseId: string };

export type RestScope =
  | "between_sets"
  | "between_rounds"
  | "between_intervals"
  | "after_specific_set";

export type RestQualifier = "until_recovery" | "fixed" | "range";

export interface RestSpec {
  duration: {
    value: number;
    unit: "sec" | "min" | "range_sec" | "range_min";
    rangeMax?: number;
  };
  scope: RestScope;
  qualifier?: RestQualifier;
  setIndex?: number;
}

export type SlotSpec = { kind: "single"; minute: number } | { kind: "grouped"; minutes: number[] };
```

**Note**: `Equipment` references in Weight = `import type { Equipment } from "@prisma/client"`. **Executor MUST replace** with self-defined narrow tuples per § 0.3 implementation-notes §2 canonical shapes (compound_device subset = 12 values, split_tier subset = 4 values). **NO `@prisma/client` imports allowed** в `@repo/contracts` per § 0.0.B.

---

### § 0.3 — Verbatim quote: implementation-notes.md §2 Zod canonical shapes (lines 496-770)

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
```

**Note**: These are the canonical Zod target shapes для 8.0a § 3 phases. Adapt naming к project convention (`*Schema` lowercase first char, exported as `loadSchema` / `weightSchema` etc per `intensitySchema` / `timeCapSchema` precedent — NOT PascalCase `LoadSchema`). Move const tuples (e.g., `WEIGHT_COMPOUND_DEVICE_EQUIPMENT`) to module-scope `as const` per `EXERCISE_EQUIPMENT` (§ 0.8) pattern.

---

### § 0.4 — Verbatim quote: `packages/contracts/src/entities/lms/_shared/intensity.ts` (canonical primitive pattern)

```typescript
import { z } from "zod";

export const HR_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
export const NUMERIC_PACE_DISTANCE_UNITS = ["km", "mi", "m", "yd", "lap"] as const;
export const NUMERIC_PACE_TYPES = ["min_per_distance", "distance_per_min"] as const;
export const PACE_VALUES = ["easy", "moderate", "hard", "recovery"] as const;

export const effortPercentSchema = z.union([
  z.object({ value: z.number().positive().max(100) }),
  z.object({
    range: z
      .object({
        min: z.number().positive().max(100),
        max: z.number().positive().max(100),
      })
      .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
  }),
]);

export const rpeSchema = z.object({ value: z.number().positive().max(10) });

export const hrZoneSchema = z.object({
  zone: z.enum(HR_ZONES),
});

export const numericPaceSchema = z.object({
  value: z.string().min(1),
  distanceUnit: z.enum(NUMERIC_PACE_DISTANCE_UNITS),
  paceType: z.enum(NUMERIC_PACE_TYPES),
});

export const paceSchema = z.enum(PACE_VALUES);

export const intensitySchema = z
  .object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  })
  .refine(
    (v) =>
      v.effortPercent !== undefined ||
      v.rpe !== undefined ||
      v.pace !== undefined ||
      v.hrZone !== undefined ||
      v.numericPace !== undefined,
    { message: "intensity must set at least one dimension" },
  );

export type Intensity = z.infer<typeof intensitySchema>;
export type EffortPercent = z.infer<typeof effortPercentSchema>;
export type HrZoneIntensity = z.infer<typeof hrZoneSchema>;
export type NumericPaceIntensity = z.infer<typeof numericPaceSchema>;
export type PaceValue = z.infer<typeof paceSchema>;
export type RpeIntensity = z.infer<typeof rpeSchema>;
```

**Conventions to mirror**:

- Module-scope `const FOO = [...] as const` tuples for enum values (UPPER_SNAKE_CASE).
- `camelCaseSchema` Zod schemas exported alongside.
- Inline `.refine()` for cross-field invariants (range min<max, at-least-one).
- Type exports via `z.infer<typeof xxxSchema>` (PascalCase types from camelCase schemas).
- ZERO comments in code (per project convention).
- Use `z.union` for non-discriminated alternatives (`effortPercentSchema` uses union of `{value}` OR `{range}` — no tag field).
- Use `z.discriminatedUnion("tag", [...])` for explicitly tagged variants (Load/Weight/RepNotation/SchemaRowPayload — all have `kind`/`variant` discriminator).

---

### § 0.5 — Verbatim quote: `packages/contracts/src/entities/lms/_shared/time-cap.ts`

```typescript
import { z } from "zod";

export const TIME_CAP_UNITS = ["min", "sec"] as const;

export const timeCapSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive().optional(),
    unit: z.enum(TIME_CAP_UNITS),
  })
  .refine((v) => v.max === undefined || v.min < v.max, {
    message: "timeCap.max must be > min when set",
  });

export type TimeCap = z.infer<typeof timeCapSchema>;
export type TimeCapUnit = (typeof TIME_CAP_UNITS)[number];
```

---

### § 0.6 — Verbatim quote: `packages/contracts/src/entities/lms/_shared/intensity.test.ts` (canonical test pattern)

```typescript
import { describe, expect, it } from "vitest";

import { intensitySchema } from "./intensity";

describe("intensitySchema", () => {
  it("accepts effortPercent.value alone", () => {
    const result = intensitySchema.safeParse({ effortPercent: { value: 75 } });

    expect(result.success).toBe(true);
  });

  it("accepts effortPercent.range alone (min < max)", () => {
    const result = intensitySchema.safeParse({
      effortPercent: { range: { min: 60, max: 80 } },
    });

    expect(result.success).toBe(true);
  });

  it("rejects effortPercent.range when min >= max", () => {
    expect(
      intensitySchema.safeParse({ effortPercent: { range: { min: 80, max: 80 } } }).success,
    ).toBe(false);
    expect(
      intensitySchema.safeParse({ effortPercent: { range: { min: 80, max: 60 } } }).success,
    ).toBe(false);
  });

  it("accepts rpe alone", () => {
    const result = intensitySchema.safeParse({ rpe: { value: 7 } });

    expect(result.success).toBe(true);
  });

  it("accepts pace alone (any of 4 enum values)", () => {
    for (const value of ["easy", "moderate", "hard", "recovery"] as const) {
      expect(intensitySchema.safeParse({ pace: value }).success).toBe(true);
    }
  });

  it("accepts hrZone alone (any of Z1-Z5)", () => {
    for (const zone of ["Z1", "Z2", "Z3", "Z4", "Z5"] as const) {
      expect(intensitySchema.safeParse({ hrZone: { zone } }).success).toBe(true);
    }
  });

  it("accepts numericPace alone", () => {
    const result = intensitySchema.safeParse({
      numericPace: { value: "4:30", distanceUnit: "km", paceType: "min_per_distance" },
    });

    expect(result.success).toBe(true);
  });

  it("accepts multiple dimensions together (effort + pace)", () => {
    const result = intensitySchema.safeParse({
      effortPercent: { value: 75 },
      pace: "moderate",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty object {} (refine at-least-one)", () => {
    const result = intensitySchema.safeParse({});

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("intensity must set at least one dimension");
    }
  });

  it("rejects an object with only an unknown key (refine-driven, not strict)", () => {
    const result = intensitySchema.safeParse({ unknown: 1 });

    expect(result.success).toBe(false);
  });

  it("strips unknown keys when a known dimension is present (Zod default passthrough)", () => {
    const result = intensitySchema.safeParse({ rpe: { value: 7 }, unknown: 1 });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({ rpe: { value: 7 } });
    }
  });

  it("rejects effortPercent.value > 100", () => {
    expect(intensitySchema.safeParse({ effortPercent: { value: 101 } }).success).toBe(false);
  });

  it("rejects rpe.value > 10", () => {
    expect(intensitySchema.safeParse({ rpe: { value: 11 } }).success).toBe(false);
  });

  it("rejects hrZone.zone not in Z1-Z5", () => {
    expect(intensitySchema.safeParse({ hrZone: { zone: "Z6" } }).success).toBe(false);
  });

  it("rejects numericPace with empty value string", () => {
    expect(
      intensitySchema.safeParse({
        numericPace: { value: "", distanceUnit: "km", paceType: "min_per_distance" },
      }).success,
    ).toBe(false);
  });

  it("rejects lowercase HrZone (z1)", () => {
    expect(intensitySchema.safeParse({ hrZone: { zone: "z1" } }).success).toBe(false);
  });
});
```

**Conventions to mirror**:

- `describe("<schemaName>")` outer block (no nesting required).
- `it("accepts {valid case}")` / `it("rejects {invalid case}")` naming pattern.
- `safeParse(...)` + `.success` boolean assertion.
- Conditional `if (result.success)` / `if (!result.success)` blocks для type-narrow inspection.
- Loop over enum values inside single `it` for tuple coverage (`for (const x of TUPLE as const) { ... }`).
- Coverage target: each happy variant + key invalid cases per refine/validation rule.

---

### § 0.7 — Verbatim quote: `packages/contracts/src/entities/lms/_shared/index.ts` (current barrel state)

```typescript
export * from "./day-of-week";
export * from "./intensity";
export * from "./time-cap";
```

**8.0a target barrel state**:

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

Strict alphabetic. 14 exports total (3 existing + 11 new).

---

### § 0.8 — Verbatim quote: `packages/contracts/src/entities/lms/exercise/exercise.constants.ts` (full canonical enum-mirror pattern)

```typescript
export const EXERCISE_CONSTANTS = {
  MAX_CANONICAL_NAME_LENGTH: 200,
  MAX_MOVEMENT_FAMILY_LENGTH: 100,
  MAX_URL_LENGTH: 2048,
  MAX_NOTES_LENGTH: 10_000,
  MAX_ARRAY_LENGTH: 20,
} as const;

export const EXERCISE_EQUIPMENT = [
  "ASSAULT_BIKE",
  "ATLAS_STONE",
  "BAND",
  "BARBELL",
  "BODYWEIGHT",
  "BOX",
  "BOX_OR_SOFA",
  "DUMBBELL",
  "JUMP_ROPE",
  "KETTLEBELL",
  "MIXED",
  "PARALLEL_BARS",
  "RINGS",
  "ROW_ERG",
  "SKI_ERG",
  "SLED",
  "SOFA",
  "UNKNOWN",
  "YOKE",
] as const;
export type ExerciseEquipment = (typeof EXERCISE_EQUIPMENT)[number];

export const EXERCISE_MOVEMENT_TYPE = [
  "SQUAT",
  "HINGE",
  "PRESS",
  "PULL",
  "LUNGE",
  "CARRY",
  "LOCOMOTION",
  "STATIC_HOLD",
  "ROTATIONAL",
  "CARDIO_FLOW",
  "CORE",
  "COMBINED_OLYMPIC",
  "RAISE",
  "EXTENSION",
  "UNKNOWN",
] as const;
export type ExerciseMovementType = (typeof EXERCISE_MOVEMENT_TYPE)[number];

export const EXERCISE_CANONICAL_COMPOUND_TYPE = [
  "ATOMIC",
  "COMPOUND_PLUS",
  "COMPOSITE_NAMED",
  "PLACEHOLDER",
  "ALTERNATIVE_OR",
] as const;
export type ExerciseCanonicalCompoundType = (typeof EXERCISE_CANONICAL_COMPOUND_TYPE)[number];
```

**Note about EXERCISE_EQUIPMENT reuse**: `weight.ts` `compound_device.equipment` uses subset 12 of 19 (per § 0.3 implementation-notes §2 spec), `split_tier.equipment` uses subset 4 of 19, `with_asymmetric_arm.passiveExtraWeight.equipment` uses subset 2 of 19. **DO NOT reuse EXERCISE_EQUIPMENT** (different semantic — full coach Exercise catalog enum); **self-define narrow tuples** в `weight.ts`:

- `WEIGHT_COMPOUND_DEVICE_EQUIPMENT` (12 values)
- `WEIGHT_SPLIT_TIER_EQUIPMENT` (4 values)
- `WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT` (2 values)

Direction reasoning: `_shared/` is the leaf in the import graph (verified via `block.schema.ts:1-6` — `block.schema` imports `_shared` + sibling entity, never reverse). `_shared/weight.ts` importing from `lms/exercise/exercise.constants` would reverse the convention. Future hoist of `EXERCISE_EQUIPMENT` to `_shared/` would unify, but that is out-of-scope for 8.0a.

---

### § 0.9 — Verbatim quote: `packages/contracts/src/entities/lms/block/block.schema.ts` (downstream pattern reference — for 8.0b awareness only)

```typescript
import { z } from "zod";

import { intensitySchema, timeCapSchema } from "../_shared";
import { labelSchema } from "../label";

import { BLOCK_CONSTANTS } from "./block.constants";

export const blockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().positive(),
  intensity: intensitySchema.nullable(),
  timeCap: timeCapSchema.nullable(),
  notes: z.string().nullable(),
  labels: z.array(labelSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlockSchema = z.object({
  intensity: intensitySchema.nullable().optional(),
  timeCap: timeCapSchema.nullable().optional(),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    })
    .optional(),
});

export const updateBlockSchema = createBlockSchema;

export const reorderBlocksSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});

export const assignBlockLabelsSchema = z.object({
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    }),
});
```

**8.0a does NOT touch this file.** Shown for downstream consumer-pattern awareness only — 8.0b will introduce `schemaSchema` that consumes 8.0a's `loadSchema`, `repNotationSchema`, etc. via `import from "../_shared"`.

---

### § 0.10 — Verbatim quote: `.dependency-cruiser.cjs` lms-relevant rules (key lines 26-110)

```javascript
{
  name: "contracts-no-prisma",
  severity: "error",
  comment:
    "@repo/contracts is a pure Zod schema package. It must not import Prisma types — " +
    "contracts is the API contract, Prisma is the DB reality, and they can drift. " +
    "Convert Prisma enums to literal string unions via z.enum().",
  from: { path: "^packages/contracts/" },
  to: { path: "^@prisma/client$" },
},
{
  name: "contracts-iam-is-leaf",
  ...
  from: { path: "^packages/contracts/src/entities/iam/" },
  to: { path: "^packages/contracts/src/entities/(cms|lms|coaching|billing)/" },
},
{
  name: "contracts-lms-no-coaching-cms-billing",
  ...
  from: { path: "^packages/contracts/src/entities/lms/" },
  to: { path: "^packages/contracts/src/entities/(coaching|cms|billing)/" },
},
```

**Implications для 8.0a**:

- `_shared/` is part of `lms/` — same rules apply.
- ZERO `import from "@prisma/client"` allowed anywhere in new files.
- ZERO imports from `lms/coaching/`, `lms/cms/`, `lms/billing/` allowed — these don't exist in `lms/` namespace anyway, so this is moot (preventive rule).
- Imports from sibling `lms/exercise/` or `lms/label/` allowed but NOT used in 8.0a — `_shared/` is the leaf direction.

Run grep at execution time:

```bash
grep -n "from \"@prisma/client\"" packages/contracts/src/entities/lms/_shared/*.ts
# expect: 0 matches
```

---

### § 0.A — Grep enumeration (run verbatim at execution time)

Each grep below has an expected outcome documented. If actual differs — STOP and `AskUserQuestion`.

```bash
# 1. Confirm no Prisma imports in contracts package
grep -rn "from \"@prisma/client\"" packages/contracts/src/ 2>/dev/null
# expect: 0 matches

# 2. Confirm no z.nativeEnum in lms/_shared/ (pattern compliance)
grep -rn "z\.nativeEnum" packages/contracts/src/entities/lms/_shared/ 2>/dev/null
# expect: 0 matches

# 3. Enumerate current _shared/ file inventory
find packages/contracts/src/entities/lms/_shared/ -type f -name "*.ts" | sort
# expect exactly 7 files: day-of-week.ts + day-of-week.test.ts + index.ts + intensity.ts + intensity.test.ts + time-cap.ts + time-cap.test.ts

# 4. Confirm existing barrel content
cat packages/contracts/src/entities/lms/_shared/index.ts
# expect 3 export lines (day-of-week / intensity / time-cap)

# 5. Confirm EXERCISE_EQUIPMENT shape unchanged (sister-package canonical mirror reference)
grep -A 20 "EXERCISE_EQUIPMENT = \[" packages/contracts/src/entities/lms/exercise/exercise.constants.ts
# expect: 19 string literals + ] as const

# 6. Confirm intensity.ts shape unchanged (D-2 Step 7.0 pre-shipped affordance — 8.0a builds on top, no edits)
wc -l packages/contracts/src/entities/lms/_shared/intensity.ts
# expect: 57 lines

# 7. Confirm no rowKind CONNECTOR usage in any contracts (D12 — DROP at 8.0b, not 8.0a; 8.0a is additive only)
grep -rn "RowKind\|rowKind\|\"CONNECTOR\"" packages/contracts/src/entities/lms/ 2>/dev/null
# expect: 0 matches (no existing reference — RowKind enum lands in 8.0b)

# 8. Confirm no downstream consumers exist yet for 8.0a VO modules
grep -rn "from \"../_shared/load\"\|from \"../_shared/weight\"\|loadSchema\|weightSchema" packages/contracts/src/entities/lms/ packages/api-server/src/ 2>/dev/null
# expect: 0 matches (8.0a is additive foundation; 8.0b is first consumer)

# 9. Confirm test runner setup (vitest in contracts package)
cat packages/contracts/package.json | grep '"test"'
# expect: a vitest invocation line
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

**Implications**:

- `check-secrets`: 8.0a adds zero secret-like patterns; pass-through.
- `lint-staged`: ESLint `--max-warnings 0` runs on all touched files. Mirror existing platform style; accept any autofix (curly brace insertions, padding-line, import-order) per Step 7.5 D-1 precedent.
- `turbo check-types --filter="...[HEAD]"`: types-checks `@repo/contracts` + ALL downstream packages that depend on it (transitive). For 8.0a — single commit of 11 new VO modules + tests + barrel update; no consumers consume yet → downstream check-types passes trivially.
- `dep:check`: dependency-cruiser runs; expect ZERO new violations (additive intra-package).
- `pnpm turbo run lint`: same as above.

**Commit strategy verified safe**: 2 commits total (1 code + 1 docs), no cross-package broken intermediate trees possible. Single-package additive scope. Per [[husky-cross-package-squash]] flavour (e) — squash NOT required.

### § 0.C — Commitlint verification

Subject: lowercase only (no acronyms), ≤100 chars.

Body lines: ≤100 chars safety margin per Step 7.4 Q-4 + Step 7.5 D-1 precedent (statutory `body-max-line-length:150` exists but commitlint conservatively treats trailing `Word: value` patterns as footers with 100-char cap).

Avoid em-dashes (`—`) near 100-char boundary + avoid `Word: value` patterns at body end.

Per [[husky-cross-package-squash]] commit-strategy correctness flavour (e).

---

## § 1 — Goal

Ship Value Object (VO) infrastructure в `packages/contracts/src/entities/lms/_shared/` как foundation для Step 8.0b entity contracts (Schema + Archetype + SchemaPairing + SchemaRow). 11 new Zod schema modules (weight, load, reps, cap-spec, tempo, side, sequence, media, staged-program, compounds, enums) + paired test files + barrel update. Zero runtime / api-server / route / UI changes. Zero new dep-cruiser rules.

Acceptance: all 11 modules typecheck strict, ~150-220 test cases pass, baseline checks all-green per per-step verifications cheatsheet (§ 7). Smoke-test N/A (contracts-only step; Step 7.0 precedent).

Per Step 8 top-level thesis D9 split policy — 8.0a = first sub-step. Per `[[always-via-feature-skill]]` rule — wrap в `/feature small`. Per `[[training-domain-workflow]]` — ship on `feat/training-domain` без branch-cut.

---

## § 2 — Inputs (verbatim sources MUST be read at execution time)

| Source                                                                                                                                      | Lines               | Purpose                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analysis/artifacts/05-synthesis/domain-model.md`                                                                                           | 478-913 (§2.1-2.18) | per-VO domain semantics + sample evidence + invariants                                                                                                        |
| `analysis/artifacts/06-formalization/types.ts`                                                                                              | 57-336 + 381-385    | canonical TS shapes for each VO (Equipment refs replace with self-defined tuples)                                                                             |
| `analysis/artifacts/06-formalization/implementation-notes.md`                                                                               | 54-437 (§1.1-1.6a)  | JSON sample shapes per VO (edge cases, real coach data)                                                                                                       |
| `analysis/artifacts/06-formalization/implementation-notes.md`                                                                               | 496-770 (§2)        | canonical Zod schema reference (Weight + Load + RepNotation + MediaReference + TempoModifier + StagedProgram + RestSpec + ApplicableLevels)                   |
| `packages/contracts/src/entities/lms/_shared/{intensity, intensity.test, time-cap, time-cap.test, index, day-of-week, day-of-week.test}.ts` | full                | canonical primitive Zod + test patterns                                                                                                                       |
| `packages/contracts/src/entities/lms/exercise/exercise.{constants, schema, types, schema.test, api.schema, api.types, index}.ts`            | full                | canonical entity-slice pattern + EXERCISE_EQUIPMENT / EXERCISE_MOVEMENT_TYPE existing const tuples (reference only — do NOT import от exercise into \_shared) |
| `packages/contracts/src/entities/lms/block/block.{schema, types, constants, schema.test, index}.ts`                                         | full                | downstream consumer pattern (для awareness)                                                                                                                   |
| `packages/contracts/package.json`                                                                                                           | full                | confirm vitest config + test commands                                                                                                                         |
| `.dependency-cruiser.cjs`                                                                                                                   | 26-110              | confirm contracts-no-prisma + contracts-lms boundary rules                                                                                                    |
| `.husky/{pre-commit, pre-push}`                                                                                                             | full                | confirm commit-strategy gates per § 0.B                                                                                                                       |
| `turbo.json`                                                                                                                                | full                | confirm task pipelines                                                                                                                                        |
| `commitlint.config.{js,cjs,mjs,ts}` (whichever exists)                                                                                      | full                | confirm subject/body length caps + lowercase rule                                                                                                             |

---

## § 3 — Implementation phases

Single atomic code commit shipping all 11 VO modules + 11 test files + barrel update. Per OQ-a11 hypothesis + [[husky-cross-package-squash]] verified safe (single-package additive). Phase structure ниже = mental ordering only, not commit boundaries.

### Phase 1 — Foundation VO modules (no within-scope dependencies)

8 new files schema + 8 new test files. No imports between them (all leaf relative к 8.0a scope).

#### Phase 1.1 — `_shared/weight.ts`

Self-define enum tuples + Zod discriminated union per types.ts:81-112 + implementation-notes.md §2 lines 503-562.

```typescript
import { z } from "zod";

export const WEIGHT_VARIANTS = [
  "single",
  "dual",
  "single_arm",
  "compound_device",
  "split_tier",
  "dual_value",
  "with_asymmetric_arm",
  "with_depth_modifier",
] as const;

export const WEIGHT_COMPOUND_DEVICE_EQUIPMENT = [
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
] as const;

export const WEIGHT_SPLIT_TIER_EQUIPMENT = ["DUMBBELL", "KETTLEBELL", "BARBELL", "MIXED"] as const;

export const WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT = ["DUMBBELL", "KETTLEBELL"] as const;

export const WEIGHT_WORKING_ARMS = ["left", "right"] as const;

export const WEIGHT_PASSIVE_ARM_ACTIONS = [
  "hold_in_up",
  "hold_static",
  "hold_with_extra_weight",
] as const;

export const WEIGHT_DEPTH_MODIFIERS = ["to_parallel", "full_rom", "partial"] as const;

export const weightSchema = z.discriminatedUnion("variant", [
  z.object({ variant: z.literal("single"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("dual"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("single_arm"), valueKg: z.number().positive() }),
  z.object({
    variant: z.literal("compound_device"),
    equipment: z.enum(WEIGHT_COMPOUND_DEVICE_EQUIPMENT),
    count: z.union([z.literal(1), z.literal(2)]),
    valueKg: z.number().positive(),
  }),
  z.object({
    variant: z.literal("split_tier"),
    stages: z
      .array(
        z.object({
          reps: z.number().int().positive(),
          equipment: z.enum(WEIGHT_SPLIT_TIER_EQUIPMENT),
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
    workingArm: z.enum(WEIGHT_WORKING_ARMS),
    passiveArmAction: z.enum(WEIGHT_PASSIVE_ARM_ACTIONS),
    passiveExtraWeight: z
      .object({
        equipment: z.enum(WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT),
        valueKg: z.number().positive(),
      })
      .optional(),
  }),
  z.object({
    variant: z.literal("with_depth_modifier"),
    valueKg: z.number().positive(),
    depth: z.enum(WEIGHT_DEPTH_MODIFIERS),
  }),
]);

export type Weight = z.infer<typeof weightSchema>;
export type WeightVariant = (typeof WEIGHT_VARIANTS)[number];
export type WeightCompoundDeviceEquipment = (typeof WEIGHT_COMPOUND_DEVICE_EQUIPMENT)[number];
export type WeightSplitTierEquipment = (typeof WEIGHT_SPLIT_TIER_EQUIPMENT)[number];
export type WeightWorkingArm = (typeof WEIGHT_WORKING_ARMS)[number];
export type WeightPassiveArmAction = (typeof WEIGHT_PASSIVE_ARM_ACTIONS)[number];
export type WeightDepthModifier = (typeof WEIGHT_DEPTH_MODIFIERS)[number];
```

#### Phase 1.1.t — `_shared/weight.test.ts`

Coverage: each of 8 variants happy + key edge cases. Target ~25-30 cases.

Required cases:

- single: accepts `{variant:"single", valueKg: 15}`; rejects `valueKg: -5`; rejects `valueKg: 0` (positive)
- dual: accepts `{variant:"dual", valueKg: 15}`
- single_arm: accepts `{variant:"single_arm", valueKg: 15}`
- compound_device: accepts `{variant:"compound_device", equipment:"DUMBBELL", count:2, valueKg:15}`; rejects equipment not в WEIGHT_COMPOUND_DEVICE_EQUIPMENT; rejects count:3; loop через 12 valid equipment values
- split_tier: accepts 2-stage minimum; rejects 1-stage (.min(2)); rejects equipment not в WEIGHT_SPLIT_TIER_EQUIPMENT (e.g., BODYWEIGHT)
- dual_value: accepts `{first:50, second:30, resolver:"athlete_profile"}`; rejects other resolver values
- with_asymmetric_arm: accepts с `workingArm:"left"`; loop через 3 passiveArmAction values; passiveExtraWeight optional пасс through
- with_depth_modifier: loop через 3 depth values
- rejects unknown variant (discriminator mismatch)
- rejects empty `stages: []` для split_tier

#### Phase 1.2 — `_shared/reps.ts`

Per types.ts:131-150 + implementation-notes.md §2 lines 617-647. Includes REP_UNITS const + repNotationSchema discriminated union + compoundRepDefinitionSchema.

```typescript
import { z } from "zod";

export const REP_UNITS = ["sec", "min", "km"] as const;

export const REP_NOTATION_KINDS = [
  "count",
  "range",
  "unit_bound",
  "max",
  "implicit",
  "total_flag",
  "compound_rep_unit",
] as const;

export const MAX_SUB_FORMS = ["bare", "progressive", "in_remaining_time"] as const;

export const COMPOUND_REP_DEFINITION_FORMS = ["curly_brace", "inline_equality"] as const;

export const repNotationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("count"), value: z.number().int().positive() }),
  z
    .object({
      kind: z.literal("range"),
      min: z.number().int().positive(),
      max: z.number().int().positive(),
    })
    .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
  z
    .object({
      kind: z.literal("unit_bound"),
      unit: z.enum(REP_UNITS),
      value: z.number().positive().optional(),
      range: z
        .object({
          min: z.number().positive(),
          max: z.number().positive(),
        })
        .refine((r) => r.min < r.max, { message: "range.min must be < range.max" })
        .optional(),
    })
    .refine((r) => r.value !== undefined || r.range !== undefined, {
      message: "unit_bound needs value or range",
    })
    .refine((r) => !(r.value !== undefined && r.range !== undefined), {
      message: "unit_bound cannot have both value and range",
    }),
  z.object({
    kind: z.literal("max"),
    subForm: z.enum(MAX_SUB_FORMS),
    progressiveSeed: z.string().min(1).optional(),
    targetExerciseId: z.string().cuid().optional(),
  }),
  z.object({ kind: z.literal("implicit") }),
  z.object({ kind: z.literal("total_flag"), value: z.number().int().positive() }),
  z.object({ kind: z.literal("compound_rep_unit") }),
]);

export const compoundRepDefinitionSchema = z.discriminatedUnion("form", [
  z.object({
    form: z.literal("curly_brace"),
    composition: z
      .array(
        z.object({
          exerciseId: z.string().cuid(),
          count: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
  z.object({
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
]);

export type RepNotation = z.infer<typeof repNotationSchema>;
export type RepNotationKind = (typeof REP_NOTATION_KINDS)[number];
export type RepUnit = (typeof REP_UNITS)[number];
export type CompoundRepDefinition = z.infer<typeof compoundRepDefinitionSchema>;
export type MaxSubForm = (typeof MAX_SUB_FORMS)[number];
export type CompoundRepDefinitionForm = (typeof COMPOUND_REP_DEFINITION_FORMS)[number];
```

**Note**: My addition of explicit `unit_bound cannot have both value AND range` refine — per [[planner-adversarial-review]] axis. Implementation-notes spec lines 627-637 only requires one-or-other; explicit anti-conjunction tightens shape (otherwise both could be set producing ambiguous semantics). Surface к user as Q if executor disagrees.

#### Phase 1.2.t — `_shared/reps.test.ts`

Coverage: 7 RepNotation variants + 2 CompoundRepDefinition forms. Target ~25-30 cases.

Required cases:

- repNotationSchema: count happy + negative; range happy (1,5) + min==max + min>max + zero; unit_bound с value only / range only / both → reject / neither → reject; loop через 3 REP_UNITS; max accepts 3 subForms + progressive с progressiveSeed; implicit happy + spurious field strip; total_flag happy; compound_rep_unit happy
- compoundRepDefinitionSchema: curly_brace с 1-element composition; inline_equality с totalReps + composition; rejects empty composition; rejects non-cuid exerciseId

#### Phase 1.3 — `_shared/cap-spec.ts`

RestSpec + SlotSpec per types.ts:319-336 + 381 + implementation-notes.md §2 lines 712-721.

```typescript
import { z } from "zod";

export const REST_SCOPES = [
  "between_sets",
  "between_rounds",
  "between_intervals",
  "after_specific_set",
] as const;

export const REST_QUALIFIERS = ["until_recovery", "fixed", "range"] as const;

export const REST_DURATION_UNITS = ["sec", "min", "range_sec", "range_min"] as const;

export const SLOT_SPEC_KINDS = ["single", "grouped"] as const;

export const restSpecSchema = z.object({
  duration: z
    .object({
      value: z.number().positive(),
      unit: z.enum(REST_DURATION_UNITS),
      rangeMax: z.number().positive().optional(),
    })
    .refine(
      (d) => {
        const isRange = d.unit === "range_sec" || d.unit === "range_min";

        if (isRange) {
          return d.rangeMax !== undefined && d.rangeMax > d.value;
        }

        return d.rangeMax === undefined;
      },
      { message: "rangeMax required when unit is range_*, must be > value; forbidden otherwise" },
    ),
  scope: z.enum(REST_SCOPES),
  qualifier: z.enum(REST_QUALIFIERS).optional(),
  setIndex: z.number().int().positive().optional(),
});

export const slotSpecSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("single"), minute: z.number().int().positive() }),
  z.object({
    kind: z.literal("grouped"),
    minutes: z.array(z.number().int().positive()).min(2),
  }),
]);

export type RestSpec = z.infer<typeof restSpecSchema>;
export type RestScope = (typeof REST_SCOPES)[number];
export type RestQualifier = (typeof REST_QUALIFIERS)[number];
export type RestDurationUnit = (typeof REST_DURATION_UNITS)[number];
export type SlotSpec = z.infer<typeof slotSpecSchema>;
export type SlotSpecKind = (typeof SLOT_SPEC_KINDS)[number];
```

**Note**: My addition of duration.unit ↔ rangeMax conditional refine tightens semantic (per [[planner-adversarial-review]] axis). Implementation-notes spec не показывает explicit; per coach POV "range_sec" implies must have rangeMax; "sec" implies fixed (no rangeMax). Per OQ-a5 hypothesis ratified — surface к user if disagreement.

#### Phase 1.3.t — `_shared/cap-spec.test.ts`

Target ~15-20 cases.

Required cases:

- restSpecSchema: duration с value:60 + unit:"sec" (fixed); duration с value:30 + unit:"range_sec" + rangeMax:60 (range); reject range_sec without rangeMax; reject fixed sec WITH rangeMax; loop через 4 REST_SCOPES; loop через 3 REST_QUALIFIERS; optional qualifier accepts undefined; setIndex optional positive int
- slotSpecSchema: single с minute:1; grouped с minutes:[1,2]; reject grouped с single-element minutes:[1] (.min(2)); reject grouped с empty minutes

#### Phase 1.4 — `_shared/tempo.ts`

Per types.ts:173-186 + implementation-notes.md §2 lines 673-701.

```typescript
import { z } from "zod";

export const TEMPO_PAUSE_POSITIONS = ["up"] as const;

export const fullTempoSchema = z.object({
  eccentric: z.number().int().min(0).max(60),
  pauseBottom: z.number().int().min(0).max(60),
  concentric: z.number().int().min(0).max(60),
  pauseTop: z.number().int().min(0).max(60),
});

export const tempoModifierSchema = z
  .object({
    pauseInUp: z
      .object({
        durationSec: z.number().positive(),
        position: z.enum(TEMPO_PAUSE_POSITIONS).optional(),
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
    fullTempo: fullTempoSchema.optional(),
  })
  .refine(
    (t) =>
      t.pauseInUp !== undefined ||
      t.perNthRepPause !== undefined ||
      t.slowEccentric !== undefined ||
      t.holdAfterLast !== undefined ||
      t.fullTempo !== undefined,
    { message: "tempoModifier must set at least one field" },
  );

export type TempoModifier = z.infer<typeof tempoModifierSchema>;
export type FullTempo = z.infer<typeof fullTempoSchema>;
```

#### Phase 1.4.t — `_shared/tempo.test.ts`

Target ~12-15 cases.

Required cases:

- fullTempoSchema: 3-1-2-0 accepts; X (0-explosive) accepts as eccentric:0; rejects 61+; rejects negative; rejects non-integer
- tempoModifierSchema: each field alone accepts; pauseInUp без position accepts (optional); rejects empty object (refine at-least-one); combines multiple fields accepts; durationSec negative rejects

#### Phase 1.5 — `_shared/side.ts`

PerLimbDistribution per types.ts:163-171 + domain §2.6 (with `alternating` 4th variant per types.ts canonical).

```typescript
import { z } from "zod";

export const PER_LIMB_KINDS = ["each_leg", "each_arm", "explicit_split", "alternating"] as const;

export const EXPLICIT_SPLIT_SIDES = ["left", "right"] as const;

export const perLimbDistributionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("each_leg"),
    countPerLimb: z.number().int().positive().optional(),
  }),
  z.object({
    kind: z.literal("each_arm"),
    countPerLimb: z.number().int().positive().optional(),
  }),
  z.object({
    kind: z.literal("explicit_split"),
    side: z.enum(EXPLICIT_SPLIT_SIDES),
    pairedRowId: z.string().cuid().optional(),
  }),
  z.object({
    kind: z.literal("alternating"),
    sourceAnnotation: z.string().min(1).optional(),
  }),
]);

export type PerLimbDistribution = z.infer<typeof perLimbDistributionSchema>;
export type PerLimbKind = (typeof PER_LIMB_KINDS)[number];
export type ExplicitSplitSide = (typeof EXPLICIT_SPLIT_SIDES)[number];
```

#### Phase 1.5.t — `_shared/side.test.ts`

Target ~10 cases.

Required cases:

- each_leg happy + countPerLimb undefined; each_arm similar
- explicit_split: side:"left"/"right" happy; pairedRowId optional cuid; reject side:"middle"
- alternating: sourceAnnotation optional string; happy без annotation
- reject unknown kind

#### Phase 1.6 — `_shared/sequence.ts`

SequenceIndicator per types.ts:188-198 + domain §2.9 (6 variants).

```typescript
import { z } from "zod";

export const SEQUENCE_INDICATOR_KINDS = [
  "before_named",
  "after_named",
  "before_named_after_named_composite",
  "only_once_before",
  "after_each_round",
  "after_each_typed_round",
] as const;

export const sequenceIndicatorSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("before_named"), targetLabel: z.string().min(1) }),
  z.object({ kind: z.literal("after_named"), targetLabel: z.string().min(1) }),
  z.object({
    kind: z.literal("before_named_after_named_composite"),
    beforeLabel: z.string().min(1),
    afterLabel: z.string().min(1),
  }),
  z.object({ kind: z.literal("only_once_before"), targetLabel: z.string().min(1) }),
  z.object({ kind: z.literal("after_each_round") }),
  z.object({ kind: z.literal("after_each_typed_round"), type: z.string().min(1) }),
]);

export type SequenceIndicator = z.infer<typeof sequenceIndicatorSchema>;
export type SequenceIndicatorKind = (typeof SEQUENCE_INDICATOR_KINDS)[number];
```

#### Phase 1.6.t — `_shared/sequence.test.ts`

Target ~10 cases.

Required: each of 6 variants happy + empty label / type rejection + unknown kind reject.

#### Phase 1.7 — `_shared/media.ts`

MediaReference per types.ts:243-251 + Position enum per types.ts:22 + domain §2.13 (374 references; coach-critical).

```typescript
import { z } from "zod";

export const MEDIA_POSITIONS = ["inline", "standalone_row", "bare"] as const;

export const MEDIA_APPLIES_TO = [
  "previous_row",
  "current_row",
  "whole_schema",
  "drop_stage",
] as const;

export const POSITION_EQUIPMENT_MODIFIERS = [
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

export const mediaReferenceSchema = z.object({
  url: z.string().url(),
  position: z.enum(MEDIA_POSITIONS),
  label: z.string().min(1).optional(),
  appliesTo: z.enum(MEDIA_APPLIES_TO),
});

export const positionEquipmentModifierSchema = z.enum(POSITION_EQUIPMENT_MODIFIERS);

export type MediaReference = z.infer<typeof mediaReferenceSchema>;
export type MediaPosition = (typeof MEDIA_POSITIONS)[number];
export type MediaAppliesTo = (typeof MEDIA_APPLIES_TO)[number];
export type PositionEquipmentModifier = (typeof POSITION_EQUIPMENT_MODIFIERS)[number];
```

#### Phase 1.7.t — `_shared/media.test.ts`

Target ~12-15 cases.

Required: mediaReferenceSchema с valid URL + loop через 3 MEDIA_POSITIONS + loop через 4 MEDIA_APPLIES_TO + reject invalid URL + label optional; positionEquipmentModifierSchema loop через 11 POSITION_EQUIPMENT_MODIFIERS + reject lowercase / unknown.

#### Phase 1.8 — `_shared/enums.ts`

Aggregated non-Prisma domain enums consumed by 8.0b SchemaRowPayload и related. ConnectorForm specifically retained (D12: drop `RowKind.CONNECTOR` enum value but keep `ConnectorForm` для Schema.trailingConnector field).

```typescript
import { z } from "zod";

export const FOOTNOTE_TARGETS = ["each_round", "each_set", "each_typed_round"] as const;

export const STANDALONE_LOAD_SCOPES = ["applies_to_all_preceding_rows"] as const;

export const CONNECTOR_FORMS = ["then", "then_dots", "then_n_rounds"] as const;

export const COUNT_FORMS = ["exact", "range", "count_times_reps"] as const;

export const STAGE_INDICATORS = ["explode", "without_weight"] as const;

export const STAGED_PROGRAM_KINDS = ["drop_set", "wave", "cluster"] as const;

export const OR_ALTERNATIVE_PURPOSES = [
  "scale_down",
  "equipment_substitute",
  "coach_choice",
] as const;

export const PLACEHOLDER_KINDS = [
  "muscle_group_reference",
  "purpose_category",
  "coach_choice_slot",
] as const;

export const footnoteTargetSchema = z.enum(FOOTNOTE_TARGETS);
export const standaloneLoadScopeSchema = z.enum(STANDALONE_LOAD_SCOPES);
export const connectorFormSchema = z.enum(CONNECTOR_FORMS);
export const countFormSchema = z.enum(COUNT_FORMS);
export const stageIndicatorSchema = z.enum(STAGE_INDICATORS);
export const stagedProgramKindSchema = z.enum(STAGED_PROGRAM_KINDS);
export const orAlternativePurposeSchema = z.enum(OR_ALTERNATIVE_PURPOSES);
export const placeholderKindSchema = z.enum(PLACEHOLDER_KINDS);

export type FootnoteTarget = (typeof FOOTNOTE_TARGETS)[number];
export type StandaloneLoadScope = (typeof STANDALONE_LOAD_SCOPES)[number];
export type ConnectorForm = (typeof CONNECTOR_FORMS)[number];
export type CountForm = (typeof COUNT_FORMS)[number];
export type StageIndicator = (typeof STAGE_INDICATORS)[number];
export type StagedProgramKind = (typeof STAGED_PROGRAM_KINDS)[number];
export type OrAlternativePurpose = (typeof OR_ALTERNATIVE_PURPOSES)[number];
export type PlaceholderKind = (typeof PLACEHOLDER_KINDS)[number];
```

#### Phase 1.8.t — `_shared/enums.test.ts`

Target ~10-12 cases. Sanity-check each enum schema accepts canonical values + rejects unknown.

---

### Phase 2 — Layer 2 VO modules (depend on Phase 1)

#### Phase 2.1 — `_shared/load.ts`

Per types.ts:114-130 + implementation-notes.md §2 lines 564-582. Depends on `weight.ts` (Phase 1.1).

```typescript
import { z } from "zod";

import { weightSchema } from "./weight";

export const LOAD_KINDS = [
  "absolute",
  "percentage",
  "bodyweight",
  "without_weight",
  "unspecified",
] as const;

export const PERCENTAGE_REFERENCE_SCOPES = ["self", "movement_family", "other_exercise"] as const;

export const WITHOUT_WEIGHT_CONTEXTS = ["drop_set_stage"] as const;

export const percentageReferenceSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("self") }),
  z.object({ scope: z.literal("movement_family"), movementFamily: z.string().min(1) }),
  z.object({ scope: z.literal("other_exercise"), targetExerciseId: z.string().cuid() }),
]);

export const loadSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("absolute"), weight: weightSchema }),
  z
    .object({
      kind: z.literal("percentage"),
      value: z.number().min(0).max(200),
      rangeMax: z.number().min(0).max(200).optional(),
      reference: percentageReferenceSchema,
    })
    .refine((p) => p.rangeMax === undefined || p.rangeMax > p.value, {
      message: "percentage.rangeMax must be > value when set",
    }),
  z.object({ kind: z.literal("bodyweight") }),
  z.object({ kind: z.literal("without_weight"), context: z.enum(WITHOUT_WEIGHT_CONTEXTS) }),
  z.object({ kind: z.literal("unspecified") }),
]);

export type Load = z.infer<typeof loadSchema>;
export type LoadKind = (typeof LOAD_KINDS)[number];
export type PercentageReference = z.infer<typeof percentageReferenceSchema>;
export type PercentageReferenceScope = (typeof PERCENTAGE_REFERENCE_SCOPES)[number];
export type WithoutWeightContext = (typeof WITHOUT_WEIGHT_CONTEXTS)[number];
```

#### Phase 2.1.t — `_shared/load.test.ts`

Target ~20-25 cases.

Required: each of 5 variants happy; absolute с nested Weight variant (e.g., compound_device); percentage с reference scope each; percentage rangeMax > value accepts, rangeMax <= value rejects; bodyweight no extras; without_weight с context:"drop_set_stage" only; unspecified empty extras; reject unknown kind / unknown reference.scope.

#### Phase 2.2 — `_shared/staged-program.ts`

Per types.ts:202-220 + implementation-notes.md §2 lines 703-738. Depends on `reps.ts` (Phase 1.2), `load.ts` (Phase 2.1), `media.ts` (Phase 1.7), `cap-spec.ts` (Phase 1.3), `enums.ts` (Phase 1.8 for STAGED_PROGRAM_KINDS + STAGE_INDICATORS).

```typescript
import { z } from "zod";

import { restSpecSchema } from "./cap-spec";
import { stageIndicatorSchema, stagedProgramKindSchema } from "./enums";
import { loadSchema } from "./load";
import { mediaReferenceSchema } from "./media";
import { repNotationSchema } from "./reps";

export const stageSchema = z.object({
  reps: z.union([z.number().int().positive(), repNotationSchema]),
  load: loadSchema.optional(),
  indicator: stageIndicatorSchema.optional(),
  label: z.string().min(1).optional(),
  media: mediaReferenceSchema.optional(),
});

export const stagedProgramSchema = z
  .object({
    programKind: stagedProgramKindSchema,
    stages: z.array(stageSchema).min(1),
    setsCount: z.number().int().positive().optional(),
    stageCountPerSet: z.number().int().positive().optional(),
    separatorForm: z.literal("...then...").optional(),
    mediaPerStage: z.record(z.string(), mediaReferenceSchema).optional(),
    restBetweenStages: restSpecSchema.optional(),
  })
  .refine(
    (p) =>
      p.programKind !== "cluster" ||
      (p.setsCount !== undefined && p.stageCountPerSet !== undefined),
    { message: "cluster programKind requires setsCount and stageCountPerSet" },
  );

export type Stage = z.infer<typeof stageSchema>;
export type StagedProgram = z.infer<typeof stagedProgramSchema>;
```

#### Phase 2.2.t — `_shared/staged-program.test.ts`

Target ~15-20 cases.

Required: stageSchema с reps:5 (number); reps:RepNotation; load optional; indicator один из 2; label optional min(1); media optional; stagedProgramSchema с 3 programKinds happy; cluster requires setsCount + stageCountPerSet (reject if missing); empty stages rejects (.min(1)); mediaPerStage record with string keys; restBetweenStages optional.

---

### Phase 3 — Layer 3 VO module + barrel update

#### Phase 3.1 — `_shared/compounds.ts`

Largest module — wraps CompoundRow + CyclicalCompound + SandwichCompound + OrAlternative + ExerciseForm + PlaceholderPayload + PerSetSubstitution. Per types.ts:222-317 + domain §2.11-2.17.

Depends on: `reps.ts` (RepNotation), `load.ts` (Load), `side.ts` (PerLimbDistribution), `tempo.ts` (TempoModifier), `enums.ts` (OR_ALTERNATIVE_PURPOSES + PLACEHOLDER_KINDS).

```typescript
import { z } from "zod";

import { orAlternativePurposeSchema, placeholderKindSchema } from "./enums";
import { loadSchema } from "./load";
import { repNotationSchema } from "./reps";
import { perLimbDistributionSchema } from "./side";
import { tempoModifierSchema } from "./tempo";

export const EXERCISE_FORMS = [
  "atomic",
  "compound",
  "cyclical",
  "sandwich",
  "or_alternative",
  "placeholder_ref",
] as const;

export const compoundRowElementSchema = z.object({
  exerciseId: z.string().cuid(),
  reps: repNotationSchema,
  load: loadSchema.optional(),
  side: perLimbDistributionSchema.optional(),
});

export const compoundRowSchema = z.object({
  elements: z.array(compoundRowElementSchema).min(2),
  sharedModifiers: z
    .object({
      load: loadSchema.optional(),
      tempo: tempoModifierSchema.optional(),
    })
    .optional(),
});

export const cyclicalCompoundCycleSchema = z.object({
  primaryReps: z.number().int().positive().optional(),
  secondaryReps: z.number().int().positive(),
});

export const cyclicalCompoundSchema = z.object({
  primaryExerciseId: z.string().cuid(),
  secondaryExerciseId: z.string().cuid(),
  cycles: z.array(cyclicalCompoundCycleSchema).min(1),
  optionalRotationStepExerciseId: z.string().cuid().optional(),
});

export const sandwichCompoundElementSchema = z.object({
  exerciseId: z.string().cuid(),
  reps: repNotationSchema,
  load: loadSchema.optional(),
});

export const sandwichCompoundSchema = z.object({
  opening: sandwichCompoundElementSchema,
  middle: sandwichCompoundElementSchema,
  closing: sandwichCompoundElementSchema,
  sharedModifiers: z
    .object({
      tempo: tempoModifierSchema.optional(),
      load: loadSchema.optional(),
    })
    .optional(),
});

export const orAlternativeSchema = z.object({
  primaryExerciseId: z.string().cuid(),
  primaryReps: repNotationSchema,
  alternativeExerciseId: z.string().cuid(),
  alternativeReps: repNotationSchema,
  purpose: orAlternativePurposeSchema,
});

export const perSetSubstitutionAssignmentSchema = z
  .object({
    setIndex: z.number().int().positive(),
    exerciseId: z.string().cuid().optional(),
    inlineCompound: compoundRowSchema.optional(),
  })
  .refine((a) => (a.exerciseId !== undefined) !== (a.inlineCompound !== undefined), {
    message: "perSetSubstitutionAssignment requires exactly one of exerciseId or inlineCompound",
  });

export const perSetSubstitutionSchema = z.object({
  placeholderName: z.string().min(1),
  assignments: z.array(perSetSubstitutionAssignmentSchema).min(1),
});

export const placeholderPayloadSchema = z.object({
  placeholderKind: placeholderKindSchema,
  text: z.string().min(1),
  perSetAssignments: perSetSubstitutionSchema.optional(),
  pairedConcreteRowId: z.string().cuid().optional(),
});

export const exerciseFormSchema = z.discriminatedUnion("form", [
  z.object({ form: z.literal("atomic"), exerciseId: z.string().cuid() }),
  z.object({ form: z.literal("compound"), compound: compoundRowSchema }),
  z.object({ form: z.literal("cyclical"), cyclical: cyclicalCompoundSchema }),
  z.object({ form: z.literal("sandwich"), sandwich: sandwichCompoundSchema }),
  z.object({ form: z.literal("or_alternative"), orAlternative: orAlternativeSchema }),
  z.object({
    form: z.literal("placeholder_ref"),
    placeholderExerciseId: z.string().cuid(),
  }),
]);

export type ExerciseForm = z.infer<typeof exerciseFormSchema>;
export type ExerciseFormKind = (typeof EXERCISE_FORMS)[number];
export type CompoundRow = z.infer<typeof compoundRowSchema>;
export type CompoundRowElement = z.infer<typeof compoundRowElementSchema>;
export type CyclicalCompound = z.infer<typeof cyclicalCompoundSchema>;
export type CyclicalCompoundCycle = z.infer<typeof cyclicalCompoundCycleSchema>;
export type SandwichCompound = z.infer<typeof sandwichCompoundSchema>;
export type SandwichCompoundElement = z.infer<typeof sandwichCompoundElementSchema>;
export type OrAlternative = z.infer<typeof orAlternativeSchema>;
export type PlaceholderPayload = z.infer<typeof placeholderPayloadSchema>;
export type PerSetSubstitution = z.infer<typeof perSetSubstitutionSchema>;
export type PerSetSubstitutionAssignment = z.infer<typeof perSetSubstitutionAssignmentSchema>;
```

**Notes**:

- `compoundRowSchema.elements.min(2)` — semantic — single-element compound = atomic, not compound.
- `perSetSubstitutionAssignmentSchema` XOR refine on `exerciseId | inlineCompound` — per [[planner-adversarial-review]] axis. Per types.ts:222-226 — both fields optional; this XOR tightens shape per coach POV "you assign per-set substitution either as exercise OR as inline compound, not both / neither".
- Surface к user if disagreement w/ either above (executor escalates через `AskUserQuestion`).

#### Phase 3.1.t — `_shared/compounds.test.ts`

Target ~30-40 cases.

Required:

- compoundRowSchema: 2-element happy + sharedModifiers happy + 1-element reject + 0-element reject + nested invalid exerciseId
- cyclicalCompoundSchema: cycles array happy с primaryReps optional + cycles empty reject
- sandwichCompoundSchema: opening/middle/closing all happy + missing middle reject
- orAlternativeSchema: 4 fields happy + loop через 3 purposes + invalid exerciseId reject
- perSetSubstitutionAssignmentSchema: exerciseId only happy; inlineCompound only happy; both reject (XOR); neither reject (XOR); setIndex positive int
- perSetSubstitutionSchema: placeholderName + assignments min(1) happy; empty assignments reject
- placeholderPayloadSchema: 3 placeholderKinds happy + text min(1) + optional perSetAssignments / pairedConcreteRowId
- exerciseFormSchema: each of 6 variants happy; unknown form reject; nested invalid (compound с 1 element)

#### Phase 3.2 — Barrel update `_shared/index.ts`

Replace content with strict alphabetic 14-line export:

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

#### Phase 3.3 — Pre-commit sanity verify

Run before staging:

```bash
pnpm --filter @repo/contracts check-types
pnpm --filter @repo/contracts lint
pnpm --filter @repo/contracts test
```

Each must pass clean. If any fails — fix root cause (do not bypass).

---

## § 4 — Acceptance criteria (40-item self-check at exit)

### A. Files & structure

1. [ ] 11 new VO schema files в `packages/contracts/src/entities/lms/_shared/`: weight, load, reps, cap-spec, tempo, side, sequence, media, staged-program, compounds, enums.
2. [ ] 11 new test files mirror schema names (`{schema}.test.ts`).
3. [ ] `_shared/index.ts` updated to 14-line strict-alphabetic barrel.
4. [ ] ZERO modifications к existing `_shared/{intensity, time-cap, day-of-week}.ts` or their tests.
5. [ ] ZERO modifications outside `packages/contracts/src/entities/lms/_shared/`.
6. [ ] All 11 new files have NO comments в коде (project convention).
7. [ ] All const tuples use `as const` + UPPER_SNAKE_CASE naming.
8. [ ] All Zod schemas use `camelCaseSchema` naming.
9. [ ] All types exported via `z.infer<typeof xxxSchema>` (PascalCase types).

### B. Dep-cruiser compliance

10. [ ] ZERO `import from "@prisma/client"` в any new file (grep verified).
11. [ ] ZERO `z.nativeEnum` usage (grep verified).
12. [ ] ZERO imports from sibling `lms/exercise/`, `lms/label/`, `lms/block/`, etc — `_shared/` stays leaf.

### C. Per-module variants completeness

13. [ ] weight.ts: 8 discriminated variants (single / dual / single_arm / compound_device / split_tier / dual_value / with_asymmetric_arm / with_depth_modifier).
14. [ ] reps.ts: 7 RepNotation variants + 2 CompoundRepDefinition forms.
15. [ ] cap-spec.ts: RestSpec с 4 scope values + SlotSpec с 2 kinds.
16. [ ] tempo.ts: TempoModifier 5 optional fields + at-least-one refine + FullTempo nested.
17. [ ] side.ts: PerLimbDistribution 4 variants (incl. alternating per types.ts:163-171).
18. [ ] sequence.ts: SequenceIndicator 6 variants.
19. [ ] media.ts: MediaReference с 3 positions + 4 appliesTo + 11 PositionEquipmentModifier values.
20. [ ] staged-program.ts: StagedProgram 3 programKinds + Stage subordinate + cluster refine.
21. [ ] compounds.ts: ExerciseForm 6 variants + CompoundRow / CyclicalCompound / SandwichCompound / OrAlternative / PlaceholderPayload / PerSetSubstitution.
22. [ ] enums.ts: 8 enum schemas (FOOTNOTE_TARGETS / STANDALONE_LOAD_SCOPES / CONNECTOR_FORMS / COUNT_FORMS / STAGE_INDICATORS / STAGED_PROGRAM_KINDS / OR_ALTERNATIVE_PURPOSES / PLACEHOLDER_KINDS).
23. [ ] load.ts: Load 5 variants + PercentageReference 3 scopes (internal к module) + percentage rangeMax > value refine.

### D. Test coverage

24. [ ] weight.test.ts: ≥25 cases covering all 8 variants + edge cases.
25. [ ] reps.test.ts: ≥25 cases covering 7 RepNotation + 2 CompoundRepDefinition.
26. [ ] cap-spec.test.ts: ≥15 cases.
27. [ ] tempo.test.ts: ≥12 cases.
28. [ ] side.test.ts: ≥10 cases.
29. [ ] sequence.test.ts: ≥10 cases.
30. [ ] media.test.ts: ≥12 cases.
31. [ ] staged-program.test.ts: ≥15 cases.
32. [ ] compounds.test.ts: ≥30 cases.
33. [ ] enums.test.ts: ≥10 cases.
34. [ ] load.test.ts: ≥20 cases.
35. [ ] Each test file mirrors `intensity.test.ts` naming/structure: `describe("<schemaName>") > it("accepts {variant}") / it("rejects {invalid case}")`.

### E. Verifications all-green

36. [ ] `pnpm check-types` 16/16 (no regressions).
37. [ ] `pnpm lint` 16/16 (0 warnings; accept lint-staged autofix).
38. [ ] `pnpm test` baseline (1075) + new (~167-220) = ~1240-1295 passed; assert exact delta matches actual test count shipped.
39. [ ] `pnpm dep:check` 0 violations + 1192 baseline modules + 11 new modules = 1203 total.
40. [ ] All commits via husky pre-commit + commit-msg gates clean (no `--no-verify` / `--no-edit` / `--no-gpg-sign`).

---

## § 5 — Adversarial pass (9-flavour application)

Run before locking § 3 ops. Per Step 7.5 precedent — all 9 flavours collectively held the bar; aim for streak continuation.

### (a) [[scope-via-existing-patterns]]

Read 2-3 canonical implementations verbatim before specing each new VO module:

- `_shared/intensity.ts` — multi-schema per file + standalone + composite + const tuples + refines (§ 0.4)
- `_shared/time-cap.ts` — simple struct + refine (§ 0.5)
- `lms/exercise/exercise.constants.ts` — const tuples + `as const` + ExercisePascalCase type alias (§ 0.8)
  Quote и cite in § 0 (done).

### (b) [[coach-pov-first]]

Cite `analysis/artifacts/05-synthesis/domain-model.md` §2.X verbatim для each VO. Each shape decision traces к domain spec OR escalates per [[discuss-before-lift-and-shift]]. Specifically:

- Weight equipment narrow tuples (compound_device 12 / split_tier 4 / asymmetric_passive 2) per coach POV "DBs/KBs are standard compound; ATLAS_STONE isn't typical for compound_device" — implementation-notes §2 line 510-523 enumerates exactly.
- StagedProgram cluster invariant (setsCount + stageCountPerSet required) per coach POV "cluster training has outer N sets each containing fixed mini-stages" — implementation-notes §2 line 734-738.

### (c) [[planner-verbatim-registration]]

Read at execution time:

- `_shared/index.ts` (current 3-line state; expect transition к 14 lines)
- `_shared/intensity.ts` + intensity.test.ts (canonical pattern reference)
- `_shared/time-cap.ts` (canonical pattern reference)
- `lms/exercise/exercise.constants.ts` (canonical enum-mirror pattern)
- `.dependency-cruiser.cjs` lines 26-110 (contracts-no-prisma + lms boundaries)
- `.husky/{pre-commit, pre-push}` (commit-strategy gates)
- `turbo.json` + commitlint config
- `packages/contracts/package.json` (vitest setup)
  All Read verbatim; quote any drift via `AskUserQuestion`.

### (d) [[planner-adversarial-review]]

Per-module concerns mentally simulated:

- **Weight.split_tier**: empty stages reject (.min(2) verifies; 1-stage reject); stages with invalid equipment reject; partial stage object (missing reps/equipment) reject.
- **Weight.compound_device**: equipment outside 12-value subset reject (don't accidentally accept BODYWEIGHT-only equipment без count).
- **Load.percentage**: rangeMax === value reject (must be strictly >); rangeMax < value reject; rangeMax > 200 reject (.max).
- **RepNotation.unit_bound**: value=undef + range=undef reject; value=defined + range=defined reject (XOR refine added).
- **RepNotation.range**: min == max reject (strict <); negative reject.
- **TempoModifier**: empty object reject; all 5 fields undefined reject.
- **CompoundRow**: 1-element reject (semantic atomic, not compound).
- **PerSetSubstitutionAssignment**: both exerciseId + inlineCompound set reject (XOR); neither set reject.
- **StagedProgram**: cluster без setsCount + stageCountPerSet reject; stages.length === 0 reject (.min(1)).
- **SlotSpec.grouped**: minutes.length === 1 reject (semantically = single, not grouped).

### (e) [[husky-cross-package-squash]]

Verified safe (§ 0.B):

- Single package scope (`@repo/contracts`).
- Pure additive — no downstream consumers within 8.0a step.
- Single atomic code commit + 1 docs commit = 2 total. No squash needed.
- Pre-commit hooks (check-secrets + lint-staged + turbo check-types) pass each commit independently.

### (f) [[planner-consumer-pattern-read]]

N/A для 8.0a — no consumers within step (8.0b будет first consumer). Existing modules (`intensity.ts` / `time-cap.ts` / `day-of-week.ts`) ARE consumed (by `block.schema.ts` + `lms/day/day.schema.ts`) but 8.0a does NOT modify those — purely additive.

### (g) [[planner-read-surface-trace]]

N/A — no UI step.

### (h) [[planner-mutation-invariant-trace]]

N/A — pure type slice; no DB / no mutations.

### (i) [[planner-lint-impact-trace]]

Zod schemas = no JSX; no `react/no-multi-comp` risk. ESLint may surface:

- `import/order` — alphabetic per project style; mirror existing `block.schema.ts:1-6` pattern (zod first, sibling `../_shared`/`../label` after gap).
- `padding-line-between-statements` — let lint-staged autofix per Step 7.5 D-1 precedent (accept canonical platform style).
- `member-ordering` — exports grouped (const tuples first, then schemas, then types).
- `@typescript-eslint/no-unused-vars` — verify all exported types are imported by downstream consumers (8.0b lookahead — they will be) OR justify export keeping per type-export-policy.

---

## § 6 — Commit strategy

**2 commits total**: 1 code + 1 docs.

### Commit 1: code (all 11 VO modules + 11 tests + barrel)

```
feat(contracts): add value object infrastructure for lms shared

Foundation modules for Step 8 schema-vertical contract slice.
Adds 11 zod schema modules in lms/_shared/ plus paired tests
and barrel update.

Modules: weight load reps cap-spec tempo side sequence media
staged-program compounds enums.

Self-defines enum tuples mirroring prisma values per
contracts-no-prisma boundary rule. Narrow equipment subsets
on weight compound-device split-tier asymmetric-passive
per domain spec section 2.2.

Tests cover all variants happy plus key invariant rejects
per intensity.test.ts canonical pattern.
```

Subject: ≤100 chars lowercase. Body lines ≤100 chars per Step 7.4 Q-4 lesson. No em-dashes near boundary; no `Word: value` patterns at end.

### Commit 2: docs (output report)

```
docs(step-08.0a): write executor output report
```

---

## § 7 — Verifications cheatsheet

| Check                                                           | Expected outcome                                 |
| --------------------------------------------------------------- | ------------------------------------------------ |
| `pnpm check-types`                                              | 16/16 packages pass                              |
| `pnpm lint`                                                     | 16/16 pass, 0 warnings                           |
| `pnpm test`                                                     | baseline 1075 + ~167-220 new = ~1240-1295 passed |
| `pnpm --filter @repo/contracts test`                            | 160 baseline + ~167-220 new = ~327-380 passed    |
| `pnpm dep:check`                                                | 0 violations, +11 modules (1192 → 1203)          |
| `git log --oneline`                                             | 2 new commits (1 feat + 1 docs)                  |
| `git status`                                                    | clean после docs commit                          |
| `find packages/contracts/src/entities/lms/_shared -name "*.ts"` | 7 baseline + 22 new = 29 files                   |
| `wc -l packages/contracts/src/entities/lms/_shared/index.ts`    | 14                                               |

Run before commit 1: `pnpm --filter @repo/contracts {check-types, lint, test}` локально первым — feedback faster than `pnpm` root.

Run before commit 2 (docs): `pnpm dep:check` (full graph confirm).

---

## § 8 — Smoke test status

**N/A** — contracts-only step. No runtime / api-server / UI surface. First downstream consumer = Step 8.0b (entity contracts). Per Step 7.0 precedent (zero smoke required).

---

## § 9 — Execution mode

Wrap в `/feature small` per [[always-via-feature-skill]] + Step 8 top-level D9 split-policy. Sixth `/feature small` invocation в workflow (после 7.0 → 7.2 → 7.3 → 7.3.5 → 7.3.6); first after 2 `/feature` full (7.4 + 7.5).

**Branch-cut override**: do NOT cut new branch. Ship on `feat/training-domain`. Confirm `git rev-parse --abbrev-ref HEAD == feat/training-domain` before any commit.

`/feature small` minimum contract: research.md + tasks.md или review.md как thin pointers к authoritative content в этом prompt; full Stage 1-3 skipping не allowed (Stage 4-5 covered by 2 atomic commits + ESLint --max-warnings 0 gates).

---

## § 10 — Output template (`output.md` format)

`implementation/step-08.0a/output.md` per WORKFLOW.md "output.md format":

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

N/A — contracts-only step (Step 7.0 precedent).

## Verification notes

[exact outputs of pnpm check-types / lint / test / dep:check]

## Acceptance criteria self-check

[40-item checklist from § 4, mark each ✓ or ✗ with justification]
```

---

## § 11 — Process notes (lessons absorbed)

- **Streak baseline**: Step 7.5 = first clean run after 3-escalation chain (7.3.5/7.3.6/7.4). 8.0a aims for streak continuation.
- **9 planner-discipline flavours** (a-i per `[[planner-verbatim-registration]]` + `[[coach-pov-first]]` + `[[scope-via-existing-patterns]]` + `[[planner-adversarial-review]]` + `[[husky-cross-package-squash]]` + `[[planner-consumer-pattern-read]]` + `[[planner-read-surface-trace]]` + `[[planner-mutation-invariant-trace]]` + `[[planner-lint-impact-trace]]`) — all applied at planning time per § 5.
- **Step 7.0 commit count precedent**: 2 atomic commits + 1 docs = 3 total. 8.0a opts for 1 atomic code + 1 docs = 2 commits (single-package contained scope) — surface если reviewer preference differs.
- **Step 7.4 Q-4 commit body line discipline**: `-m` flag body lines ≤100 chars safety margin (NOT statutory 150) per commitlint trailing-footer parsing quirk. Verified в Step 7.5 close.
- **D12 (RowKind.CONNECTOR drop)**: out-of-scope для 8.0a — lands in 8.0b when Schema entity contracts ship (Schema.trailingConnector field uses `connectorFormSchema` from 8.0a enums.ts). 8.0a ConnectorForm exported from enums.ts for downstream consumption.
- **dual_value Weight resolver**: per types.ts:96-100 — `resolver: "athlete_profile"` literal. Future expansion может add other resolvers; кеep as literal for now (model-ready, single-value enum).
- **Equipment values self-defined narrow subsets**: documented in § 0.8 — DO NOT reuse `EXERCISE_EQUIPMENT` from `lms/exercise/exercise.constants` (different semantic + direction violation `_shared/ → entity-slice`).
- **Future refactor flag**: if Step 8.5+ surfaces hand-roll fatigue для 34 archetypes — generic schema-driven form generator может consume archetypeParamsSchema discriminated union directly (RHF + JSON Schema-like generic renderer). Not within 8.0a scope; flag for Step 8.4+ thesis.

---

## End of prompt.
