import { z } from "zod";

import { prKindSchema } from "../_domain/pr-kind.schema";

import { PERSONAL_RECORD_CONSTANTS } from "./personal-record.constants";
import { personalRecordContextSchema, personalRecordSchema } from "./personal-record.schema";

export const upsertPersonalRecordInputSchema = z.object({
  userId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  kind: prKindSchema,
  value: z.number().positive(),
  unit: z.string().min(1).max(PERSONAL_RECORD_CONSTANTS.MAX_UNIT_LENGTH),
  context: personalRecordContextSchema,
  achievedAt: z.date(),
  sourceSetLogId: z.string().cuid().optional(),
});

export const personalRecordIdParamSchema = z.object({
  personalRecordId: z.string().cuid(),
});

export const listPersonalRecordsQuerySchema = z.object({
  userId: z.string().cuid().optional(),
  exerciseId: z.string().cuid().optional(),
  kind: prKindSchema.optional(),
});

export const listPersonalRecordsResponseSchema = z.object({
  items: z.array(personalRecordSchema),
  total: z.number().int().nonnegative(),
});

export const getPersonalRecordResponseSchema = personalRecordSchema;
export const upsertPersonalRecordResponseSchema = personalRecordSchema;
