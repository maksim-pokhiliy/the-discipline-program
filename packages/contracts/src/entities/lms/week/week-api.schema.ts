import { z } from "zod";

import { planIdParamSchema } from "../../../common";

import { WEEK_CONSTANTS } from "./week.constants";
import { weekSchema } from "./week.schema";

export const createWeekInputSchema = z.object({
  index: z.number().int().nonnegative(),
  label: z.string().max(WEEK_CONSTANTS.MAX_LABEL_LENGTH).optional(),
  notes: z.string().max(WEEK_CONSTANTS.MAX_NOTES_LENGTH).optional(),
});

export const updateWeekInputSchema = z.object({
  index: z.number().int().nonnegative().optional(),
  label: z.string().max(WEEK_CONSTANTS.MAX_LABEL_LENGTH).nullable().optional(),
  notes: z.string().max(WEEK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const weekIdParamSchema = z.object({ weekId: z.string().cuid() });

export const planWeekParamSchema = planIdParamSchema.extend({
  weekId: z.string().cuid(),
});

export const duplicateWeekInputSchema = z.object({
  targetIndex: z.number().int().nonnegative(),
});

export const listPlanWeeksResponseSchema = z.object({
  items: z.array(weekSchema),
  total: z.number().int().nonnegative(),
});

export const getWeekResponseSchema = weekSchema;
export const createWeekResponseSchema = weekSchema;
export const updateWeekResponseSchema = weekSchema;
export const duplicateWeekResponseSchema = weekSchema;
