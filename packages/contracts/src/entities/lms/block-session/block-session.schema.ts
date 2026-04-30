import { z } from "zod";

import { rxStatusSchema } from "../_domain/rx-status.schema";
import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { BLOCK_SESSION_CONSTANTS } from "./block-session.constants";

export const blockResultPrimarySchema = z.object({
  totalReps: z.number().int().nonnegative().optional(),
  timeSec: z.number().int().nonnegative().optional(),
  distanceM: z.number().nonnegative().optional(),
  calories: z.number().int().nonnegative().optional(),
  rounds: z.number().int().nonnegative().optional(),
  score: z.number().nonnegative().optional(),
});

export const blockSessionSchema = z.object({
  id: z.string().cuid(),
  workoutSessionId: z.string().cuid(),
  sourceBlockId: z.string().cuid().nullable(),
  order: z.number().int().nonnegative(),
  kindName: z.string().min(1).max(BLOCK_SESSION_CONSTANTS.MAX_KIND_NAME_LENGTH),
  weight: z
    .number()
    .int()
    .min(BLOCK_SESSION_CONSTANTS.MIN_WEIGHT)
    .max(BLOCK_SESSION_CONSTANTS.MAX_WEIGHT),
  archetypeKind: schemeArchetypeKindSchema,
  schemeParamsSnapshot: schemeParamsSchema,
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  durationSec: z.number().int().nonnegative().nullable(),
  rxStatus: rxStatusSchema,
  resultPrimary: blockResultPrimarySchema.nullable(),
  notes: z.string().max(BLOCK_SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
