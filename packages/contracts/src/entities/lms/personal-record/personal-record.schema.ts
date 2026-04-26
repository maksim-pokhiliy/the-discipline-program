import { z } from "zod";

import { prKindSchema } from "../_domain/pr-kind.schema";

import { PERSONAL_RECORD_CONSTANTS } from "./personal-record.constants";

export const personalRecordContextSchema = z.object({
  fixedReps: z.number().int().positive().optional(),
  scoredAt: z.date().optional(),
  sourceWorkoutSessionId: z.string().cuid().optional(),
  notes: z.string().max(500).optional(),
});

export const personalRecordSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  kind: prKindSchema,
  value: z.number(),
  unit: z.string().min(1).max(PERSONAL_RECORD_CONSTANTS.MAX_UNIT_LENGTH),
  context: personalRecordContextSchema,
  achievedAt: z.date(),
  sourceSetLogId: z.string().cuid().nullable(),
});
