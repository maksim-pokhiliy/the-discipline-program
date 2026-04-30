import { type z } from "zod";

import {
  type dayIdParamSchema,
  type getDayResponseSchema,
  type updateDayInputSchema,
  type updateDayResponseSchema,
} from "./day-api.schema";

export type UpdateDayInput = z.infer<typeof updateDayInputSchema>;
export type DayIdParam = z.infer<typeof dayIdParamSchema>;
export type GetDayResponse = z.infer<typeof getDayResponseSchema>;
export type UpdateDayResponse = z.infer<typeof updateDayResponseSchema>;
