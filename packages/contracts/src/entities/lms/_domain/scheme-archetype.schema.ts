import { z } from "zod";

export const schemeArchetypeKindSchema = z.enum([
  "NONE",
  "COUNT_UP",
  "COUNT_DOWN",
  "INTERVAL_LOOP",
  "EMOM_LOOP",
  "TIME_BOXED",
]);

const intervalSlotSchema = z.object({
  durationSec: z.number().int().positive(),
  action: z.enum(["WORK", "REST"]),
  entryRefIndex: z.number().int().nonnegative().optional(),
  label: z.string().optional(),
});

const emomSlotActionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("ENTRY"),
    entryRefIndex: z.number().int().nonnegative(),
  }),
  z.object({ kind: z.literal("REST") }),
  z.object({
    kind: z.literal("MAX_OF_ENTRY"),
    entryRefIndex: z.number().int().nonnegative(),
  }),
]);

const emomSlotSchema = z.object({
  minutes: z.array(z.number().int().nonnegative()).min(1),
  action: emomSlotActionSchema,
});

const progressionStepSchema = z.object({
  round: z.number().int().positive(),
  reps: z.array(z.number().int().positive()).optional(),
  loadOverride: z.unknown().optional(),
  modifier: z.string().optional(),
});

const innerArchetypeKindSchema = z.enum([
  "NONE",
  "COUNT_UP",
  "COUNT_DOWN",
  "INTERVAL_LOOP",
  "EMOM_LOOP",
]);

const timeBoxedSegmentSchema = z.object({
  startSec: z.number().int().nonnegative(),
  endSec: z.number().int().positive(),
  label: z.string().optional(),
  innerArchetypeKind: innerArchetypeKindSchema,
  innerParams: z.unknown(),
});

export const schemeParamsNoneSchema = z.object({ kind: z.literal("NONE") });

export const schemeParamsCountUpSchema = z.object({
  kind: z.literal("COUNT_UP"),
  cap: z.number().int().positive().optional(),
  rounds: z.number().int().positive().optional(),
  progression: z.array(progressionStepSchema).optional(),
});

export const schemeParamsCountDownSchema = z.object({
  kind: z.literal("COUNT_DOWN"),
  durationSec: z.number().int().positive(),
  progression: z.array(progressionStepSchema).optional(),
});

export const schemeParamsIntervalLoopSchema = z.object({
  kind: z.literal("INTERVAL_LOOP"),
  sets: z.number().int().positive(),
  slots: z.array(intervalSlotSchema).min(1),
});

export const schemeParamsEmomLoopSchema = z.object({
  kind: z.literal("EMOM_LOOP"),
  totalMinutes: z.number().int().positive(),
  cycleLength: z.number().int().positive().optional(),
  slots: z.array(emomSlotSchema).min(1),
});

export const schemeParamsTimeBoxedSchema = z.object({
  kind: z.literal("TIME_BOXED"),
  segments: z.array(timeBoxedSegmentSchema).min(1),
});

export const schemeParamsSchema = z.discriminatedUnion("kind", [
  schemeParamsNoneSchema,
  schemeParamsCountUpSchema,
  schemeParamsCountDownSchema,
  schemeParamsIntervalLoopSchema,
  schemeParamsEmomLoopSchema,
  schemeParamsTimeBoxedSchema,
]);
