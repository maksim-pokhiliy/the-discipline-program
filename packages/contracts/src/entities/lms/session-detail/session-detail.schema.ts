import { z } from "zod";

import {
  dayOfWeekSchema,
  intensitySchema,
  loadSchema,
  notesListSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  restSpecSchema,
  resultSchema,
  RESULT_TYPES,
  tempoModifierSchema,
} from "../_shared";
import { compositionLabelSchema, compositionSchema } from "../composition";

const MIN_DAY_OF_MONTH = 1;
const MAX_DAY_OF_MONTH = 31;

export const resolvedLoadSchema = z.union([
  z.object({ status: z.literal("resolved"), kg: z.number(), perHand: z.boolean() }),
  z.object({
    status: z.literal("unresolved"),
    reason: z.literal("missing_one_rm"),
    prompt: z.literal("set_one_rm"),
    exerciseId: z.string().cuid(),
  }),
  z.object({
    status: z.literal("unresolved"),
    reason: z.literal("missing_profile_pick"),
    prompt: z.literal("pick_profile"),
    axisNames: z.array(z.string()),
  }),
  z.object({ status: z.literal("not_applicable") }),
]);

export const rowViewSchema = z.object({
  rowId: z.string().cuid(),
  movement: z.string(),
  media: z.string().url().nullable(),
  sets: z.number().int().positive().nullable(),
  reps: repNotationSchema.nullable(),
  load: loadSchema.nullable(),
  resolvedLoad: resolvedLoadSchema.nullable(),
  intensity: intensitySchema.nullable(),
  tempo: tempoModifierSchema.nullable(),
  side: perLimbDistributionSchema.nullable(),
  rest: restSpecSchema.nullable(),
  modifiers: z.array(z.string()),
  notes: notesListSchema.nullable(),
});

export const rowItemViewSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("row"), row: rowViewSchema }),
  z.object({ kind: z.literal("group"), members: z.array(rowViewSchema) }),
]);

export const schemaCardViewSchema = z.object({
  schemaId: z.string().cuid(),
  header: z.string().nullable(),
  composition: compositionSchema.nullable(),
  label: compositionLabelSchema.nullable(),
  isBenchmark: z.boolean(),
  resultType: z.enum(RESULT_TYPES).nullable(),
  intensity: intensitySchema.nullable(),
  existingResult: resultSchema.nullable(),
  items: z.array(rowItemViewSchema),
});

export const blockItemViewSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("schema"), schema: schemaCardViewSchema }),
  z.object({
    kind: z.literal("parallel-group"),
    trackCount: z.number().int().positive(),
    tracks: z.array(z.object({ header: z.string().nullable(), schema: schemaCardViewSchema })),
  }),
]);

export const blockViewSchema = z.object({
  blockId: z.string().cuid(),
  label: z.string().nullable(),
  intensity: intensitySchema.nullable(),
  note: z.string().nullable(),
  items: z.array(blockItemViewSchema),
});

export const sessionHeaderViewSchema = z.object({
  sessionId: z.string().cuid(),
  planTitle: z.string(),
  position: z.string(),
  title: z.string(),
  dayOfWeek: dayOfWeekSchema,
  dayOfMonth: z.number().int().min(MIN_DAY_OF_MONTH).max(MAX_DAY_OF_MONTH),
  summary: z.string(),
  done: z.boolean(),
  completedAt: z.coerce.date().nullable(),
});

export const sessionDetailViewSchema = z.object({
  session: sessionHeaderViewSchema,
  blocks: z.array(blockViewSchema),
});
