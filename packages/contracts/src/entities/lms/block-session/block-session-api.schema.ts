import { z } from "zod";

import { rxStatusSchema } from "../_domain/rx-status.schema";
import { schemeArchetypeKindSchema, schemeParamsSchema } from "../_domain/scheme-archetype.schema";

import { BLOCK_SESSION_CONSTANTS } from "./block-session.constants";
import { blockResultPrimarySchema, blockSessionSchema } from "./block-session.schema";

export const createBlockSessionInputSchema = z.object({
  workoutSessionId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  blockNames: z
    .array(z.string().min(1).max(BLOCK_SESSION_CONSTANTS.MAX_BLOCK_NAME_LENGTH))
    .min(1)
    .max(BLOCK_SESSION_CONSTANTS.MAX_BLOCK_NAMES_PER_BLOCK),
  weight: z
    .number()
    .int()
    .min(BLOCK_SESSION_CONSTANTS.MIN_WEIGHT)
    .max(BLOCK_SESSION_CONSTANTS.MAX_WEIGHT),
  archetypeKind: schemeArchetypeKindSchema,
  schemeParamsSnapshot: schemeParamsSchema,
  rxStatus: rxStatusSchema.default("RX"),
});

export const updateBlockSessionInputSchema = z.object({
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  durationSec: z.number().int().nonnegative().nullable().optional(),
  rxStatus: rxStatusSchema.optional(),
  resultPrimary: blockResultPrimarySchema.nullable().optional(),
  notes: z.string().max(BLOCK_SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const blockSessionIdParamSchema = z.object({ blockSessionId: z.string().cuid() });

export const listBlockSessionsQuerySchema = z.object({
  workoutSessionId: z.string().cuid().optional(),
});

export const listBlockSessionsResponseSchema = z.object({
  items: z.array(blockSessionSchema),
  total: z.number().int().nonnegative(),
});

export const getBlockSessionResponseSchema = blockSessionSchema;
export const createBlockSessionResponseSchema = blockSessionSchema;
export const updateBlockSessionResponseSchema = blockSessionSchema;
