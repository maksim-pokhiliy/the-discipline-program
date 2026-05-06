import { z } from "zod";

import { PLAN_SESSION_CONSTANTS } from "./plan-session.constants";

export const planSessionSchema = z.object({
  id: z.string().cuid(),
  dayId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(PLAN_SESSION_CONSTANTS.MAX_LABEL_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPlanSessionSchema = z.object({
  dayId: z.string().cuid(),
  order: z.number().int().nonnegative(),
  label: z.string().max(PLAN_SESSION_CONSTANTS.MAX_LABEL_LENGTH).optional(),
});

export const updatePlanSessionSchema = z.object({
  order: z.number().int().nonnegative().optional(),
  label: z.string().max(PLAN_SESSION_CONSTANTS.MAX_LABEL_LENGTH).nullable().optional(),
});
