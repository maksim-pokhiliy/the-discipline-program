import { z } from "zod";

import {
  exerciseFormSchema,
  repNotationSchema,
  restSpecSchema,
  slotSpecSchema,
  stagedProgramSchema,
} from "../_shared";

const positiveInt = z.number().int().positive();

const exactOrRangeSchema = z.union([
  positiveInt,
  z
    .object({
      min: positiveInt,
      max: positiveInt,
    })
    .refine((r) => r.min < r.max, { message: "range.min must be less than range.max" }),
]);

const archetypeRoundsSetsParamsSchema = z.object({
  countForm: z.enum(["exact", "range", "count_times_reps"]),
  count: positiveInt.optional(),
  countRange: z
    .object({ min: positiveInt, max: positiveInt })
    .refine((r) => r.min < r.max, { message: "countRange.min must be less than countRange.max" })
    .optional(),
  repsPerSet: positiveInt.optional(),
  rest: restSpecSchema.optional(),
});

const ladderArchetypeParamsSchema = z.object({
  steps: z.array(positiveInt).min(1),
});

const parallelLadderEntrySchema = z.object({
  steps: z.array(positiveInt).min(1),
  pairedWithInnerRowId: z.string().cuid().optional(),
  direction: z.enum(["asc", "desc"]).optional(),
});

const archetypeAlternatingSetsParamsSchema = z.object({
  setEnumeration: z.array(positiveInt).min(1),
});

const archetypeAmrapFlatParamsSchema = z.object({ durationMin: positiveInt });

const archetypeEmomNestedParamsSchema = z.object({
  durationMin: positiveInt,
  rounds: positiveInt.optional(),
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
  intervalsCount: positiveInt,
  restMin: positiveInt,
  innerRounds: positiveInt,
  preambleExercise: exerciseFormSchema,
  preambleReps: repNotationSchema,
});

const archetypeCompositeIntervalsWorkRestFixedParamsSchema = z.object({
  intervalsCount: positiveInt,
  workMin: positiveInt,
  restMin: positiveInt,
});

const archetypeCompositeIntervalsWorkRestProgressiveParamsSchema = z.object({
  sets: positiveInt,
  workMin: positiveInt,
  offMin: positiveInt,
  progressiveSeed: z.string().min(1),
});

const archetypeCompositeIntervalsOnOffMaxTailParamsSchema = z.object({
  intervals: positiveInt,
  onMin: positiveInt,
  offMin: positiveInt,
  tailExerciseId: z.string().cuid(),
});

const archetypeCompositeRollingRoundsParamsSchema = z.object({
  everyNthMin: positiveInt,
  rounds: positiveInt,
  totalMin: positiveInt,
});

const archetypeNestedRoundsOverRoundsParamsSchema = z.object({
  outerCount: exactOrRangeSchema,
});

const archetypeNestedRoundsOverParallelLadderParamsSchema = z.object({
  outerCount: exactOrRangeSchema,
});

const archetypeNestedCompositeRoundsOverLadderParamsSchema = z.object({
  outerCount: positiveInt,
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
  schemaRows: z.array(z.string().cuid()).min(1),
});

const archetypeSuperSetParamsSchema = z.object({
  pairs: z.array(superSetPairSchema).min(1),
  restBetweenPairs: restSpecSchema.optional(),
  rounds: positiveInt,
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
