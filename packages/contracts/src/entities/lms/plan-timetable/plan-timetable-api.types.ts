import { type z } from "zod";

import {
  type daySlotViewSchema,
  type planTimetableResponseSchema,
  type planTimetableViewSchema,
  type sessionCardViewSchema,
  type weekTimetableViewSchema,
} from "./plan-timetable-api.schema";

export type SessionCardView = z.infer<typeof sessionCardViewSchema>;
export type DaySlotView = z.infer<typeof daySlotViewSchema>;
export type WeekTimetableView = z.infer<typeof weekTimetableViewSchema>;
export type PlanTimetableView = z.infer<typeof planTimetableViewSchema>;
export type PlanTimetableResponse = z.infer<typeof planTimetableResponseSchema>;
