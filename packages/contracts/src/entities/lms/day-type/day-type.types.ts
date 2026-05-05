import { type z } from "zod";

import {
  type createDayTypeSchema,
  type dayTypeSchema,
  type updateDayTypeSchema,
} from "./day-type.schema";

export type DayType = z.infer<typeof dayTypeSchema>;
export type CreateDayTypeData = z.infer<typeof createDayTypeSchema>;
export type UpdateDayTypeData = z.infer<typeof updateDayTypeSchema>;
