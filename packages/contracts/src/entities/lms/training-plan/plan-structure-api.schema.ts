import { z } from "zod";

import { planIdParamSchema } from "../../../common";
import { blockSchema } from "../block";
import { blockSegmentSchema } from "../block-segment";
import { daySchema } from "../day";
import { exerciseEntrySchema } from "../exercise-entry";
import { lmsSessionSchema } from "../lms-session";
import { setGroupSchema } from "../set-group";
import { weekSchema } from "../week";

import { trainingPlanSchema } from "./training-plan.schema";

export const planStructureSetGroupSchema = setGroupSchema.extend({
  entries: z.array(exerciseEntrySchema),
});

export const planStructureSegmentSchema = blockSegmentSchema.extend({
  setGroups: z.array(planStructureSetGroupSchema),
});

export const planStructureBlockSchema = blockSchema.extend({
  segments: z.array(planStructureSegmentSchema),
});

export const planStructureSessionSchema = lmsSessionSchema.extend({
  blocks: z.array(planStructureBlockSchema),
});

export const planStructureDaySchema = daySchema.extend({
  sessions: z.array(planStructureSessionSchema),
});

export const planStructureWeekSchema = weekSchema.extend({
  days: z.array(planStructureDaySchema),
});

export const planStructurePlanSchema = trainingPlanSchema.extend({
  weeks: z.array(planStructureWeekSchema),
});

export const planStructureWindowSchema = z.object({
  fromWeek: z.number().int().nonnegative(),
  toWeek: z.number().int().nonnegative(),
  maxIndex: z.number().int().nonnegative(),
});

export const getPlanStructureParamsSchema = planIdParamSchema;

export const getPlanStructureQuerySchema = z.object({
  fromWeek: z.coerce.number().int().nonnegative().optional(),
  toWeek: z.coerce.number().int().nonnegative().optional(),
});

export const getPlanStructureResponseSchema = z.object({
  plan: planStructurePlanSchema,
  window: planStructureWindowSchema,
});
