import { type z } from "zod";

import {
  type daySlotSchema,
  type sessionWithLabelSchema,
  type updateDayLabelSchema,
  type updateDayNotesSchema,
} from "./day.schema";

export type DaySlot = z.infer<typeof daySlotSchema>;
export type SessionWithLabel = z.infer<typeof sessionWithLabelSchema>;
export type UpdateDayLabelData = z.infer<typeof updateDayLabelSchema>;
export type UpdateDayNotesData = z.infer<typeof updateDayNotesSchema>;
