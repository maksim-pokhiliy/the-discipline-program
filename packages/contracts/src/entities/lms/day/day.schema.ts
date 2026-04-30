import { z } from "zod";

import { dayKindSchema } from "../_domain/day-kind.schema";
import { dayOfWeekSchema } from "../_domain/day-of-week.schema";

import { DAY_CONSTANTS } from "./day.constants";

export const daySchema = z.object({
  id: z.string().cuid(),
  weekId: z.string().cuid(),
  dayOfWeek: dayOfWeekSchema,
  kind: dayKindSchema,
  notes: z.string().max(DAY_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
