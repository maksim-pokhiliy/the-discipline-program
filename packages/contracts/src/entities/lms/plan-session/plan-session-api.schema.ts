import { z } from "zod";

import {
  createPlanSessionSchema,
  planSessionSchema,
  updatePlanSessionSchema,
} from "./plan-session.schema";

export const planSessionParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});

export const planSessionsByDayParamsSchema = z.object({
  planId: z.string().cuid(),
  dayId: z.string().cuid(),
});

export const getPlanSessionsResponseSchema = z.object({
  sessions: z.array(planSessionSchema),
});

export const getPlanSessionResponseSchema = planSessionSchema;

export const createPlanSessionRequestSchema = createPlanSessionSchema.omit({ dayId: true });

export const createPlanSessionResponseSchema = planSessionSchema;

export const updatePlanSessionRequestSchema = updatePlanSessionSchema.refine(
  (data) => Object.keys(data).length > 0,
  { message: "patch cannot be empty" },
);

export const updatePlanSessionResponseSchema = planSessionSchema;
