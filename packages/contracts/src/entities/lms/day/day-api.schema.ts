import { z } from "zod";

import { dayKindSchema } from "../_domain/day-kind.schema";

import { DAY_CONSTANTS } from "./day.constants";
import { daySchema } from "./day.schema";

export const updateDayInputSchema = z.object({
  kind: dayKindSchema.optional(),
  notes: z.string().max(DAY_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const dayIdParamSchema = z.object({ dayId: z.string().cuid() });

export const updateDayResponseSchema = daySchema;
export const getDayResponseSchema = daySchema;
