import { z } from "zod";

import { DAY_TYPE_CONSTANTS } from "./day-type.constants";

export const dayTypeSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(DAY_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  color: z.string().regex(DAY_TYPE_CONSTANTS.COLOR_PATTERN),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createDayTypeSchema = z.object({
  name: z.string().min(1).max(DAY_TYPE_CONSTANTS.MAX_NAME_LENGTH),
  color: z.string().regex(DAY_TYPE_CONSTANTS.COLOR_PATTERN),
});

export const updateDayTypeSchema = createDayTypeSchema.partial();
