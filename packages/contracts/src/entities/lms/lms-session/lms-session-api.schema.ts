import { z } from "zod";

import { LMS_SESSION_CONSTANTS } from "./lms-session.constants";
import { lmsSessionSchema } from "./lms-session.schema";

export const createLmsSessionInputSchema = z.object({
  dayId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(LMS_SESSION_CONSTANTS.MAX_LABEL_LENGTH).optional(),
  notes: z.string().max(LMS_SESSION_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updateLmsSessionInputSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  label: z.string().max(LMS_SESSION_CONSTANTS.MAX_LABEL_LENGTH).nullable().optional(),
  notes: z.string().max(LMS_SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const lmsSessionIdParamSchema = z.object({ sessionId: z.string().cuid() });

export const getLmsSessionResponseSchema = lmsSessionSchema;
export const createLmsSessionResponseSchema = lmsSessionSchema;
export const updateLmsSessionResponseSchema = lmsSessionSchema;
