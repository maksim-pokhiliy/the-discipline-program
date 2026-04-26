import { z } from "zod";

import { prescriptionSchema } from "../_domain/prescription.schema";

import { SET_LOG_CONSTANTS } from "./set-log.constants";
import { setActualResultSchema, setLogSchema } from "./set-log.schema";

export const createSetLogInputSchema = z.object({
  exerciseLogId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  prescribed: prescriptionSchema,
  actual: setActualResultSchema,
  failed: z.boolean().default(false),
  notes: z.string().max(SET_LOG_CONSTANTS.MAX_NOTES_LENGTH).optional(),
  completedAt: z.date().optional(),
});

export const updateSetLogInputSchema = z.object({
  prescribed: prescriptionSchema.optional(),
  actual: setActualResultSchema.optional(),
  failed: z.boolean().optional(),
  notes: z.string().max(SET_LOG_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  completedAt: z.date().nullable().optional(),
});

export const setLogIdParamSchema = z.object({ setLogId: z.string().cuid() });

export const listSetLogsQuerySchema = z.object({
  exerciseLogId: z.string().cuid().optional(),
});

export const listSetLogsResponseSchema = z.object({
  items: z.array(setLogSchema),
  total: z.number().int().nonnegative(),
});

export const getSetLogResponseSchema = setLogSchema;
export const createSetLogResponseSchema = setLogSchema;
export const updateSetLogResponseSchema = setLogSchema;
