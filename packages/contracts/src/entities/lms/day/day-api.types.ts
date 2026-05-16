import { type z } from "zod";

import {
  type dayByAddressParamsSchema,
  type updateDayLabelRequestSchema,
  type updateDayLabelResponseSchema,
  type updateDayNotesRequestSchema,
  type updateDayNotesResponseSchema,
} from "./day-api.schema";

export type DayByAddressParams = z.infer<typeof dayByAddressParamsSchema>;
export type UpdateDayLabelRequest = z.infer<typeof updateDayLabelRequestSchema>;
export type UpdateDayLabelResponse = z.infer<typeof updateDayLabelResponseSchema>;
export type UpdateDayNotesRequest = z.infer<typeof updateDayNotesRequestSchema>;
export type UpdateDayNotesResponse = z.infer<typeof updateDayNotesResponseSchema>;
