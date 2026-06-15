import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";

import {
  createSessionSchema,
  reorderSessionsSchema,
  sessionSchema,
  updateSessionSchema,
} from "./session.schema";

export const sessionByDayParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: dayOfWeekSchema,
});

export const sessionByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});

export const createSessionRequestSchema = createSessionSchema;
export const createSessionResponseSchema = sessionSchema;

export const updateSessionRequestSchema = updateSessionSchema;
export const updateSessionResponseSchema = sessionSchema;

export const reorderSessionsRequestSchema = reorderSessionsSchema;
export const reorderSessionsResponseSchema = z.object({
  sessions: z.array(sessionSchema),
});

export const duplicateSessionRequestSchema = z.object({}).strict();
export const duplicateSessionResponseSchema = sessionSchema;
