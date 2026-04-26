import { z } from "zod";

import { loadSpecSchema } from "../_domain/load-spec.schema";
import { prescriptionSchema } from "../_domain/prescription.schema";

import { SET_LOG_CONSTANTS } from "./set-log.constants";

export const setActualResultSchema = z.object({
  reps: z.number().int().nonnegative().optional(),
  load: loadSpecSchema.optional(),
  durationSec: z.number().int().nonnegative().optional(),
  distanceM: z.number().nonnegative().optional(),
  calories: z.number().int().nonnegative().optional(),
  rpe: z.number().int().min(SET_LOG_CONSTANTS.MIN_RPE).max(SET_LOG_CONSTANTS.MAX_RPE).optional(),
  side: z.enum(["L", "R"]).nullable().optional(),
});

export const setLogSchema = z.object({
  id: z.string().cuid(),
  exerciseLogId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  prescribed: prescriptionSchema,
  actual: setActualResultSchema,
  failed: z.boolean(),
  notes: z.string().max(SET_LOG_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  completedAt: z.date().nullable(),
});
