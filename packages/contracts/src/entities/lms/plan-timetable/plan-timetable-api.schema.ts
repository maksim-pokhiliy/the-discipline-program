import { z } from "zod";

import { dayOfWeekSchema } from "../_shared/day-of-week";

import { TimetableSlotStatus } from "./plan-timetable.constants";

export const timetableSlotStatusSchema = z.nativeEnum(TimetableSlotStatus);

export const sessionCardViewSchema = z.object({
  sessionId: z.string().cuid(),
  title: z.string(),
  subtitle: z.string().nullable(),
  done: z.boolean(),
});

export const daySlotViewSchema = z.object({
  date: z.coerce.date(),
  dayOfWeek: dayOfWeekSchema,
  dayOfMonth: z.number().int().min(1).max(31),
  isToday: z.boolean(),
  isRestDay: z.boolean(),
  status: timetableSlotStatusSchema,
  sessions: z.array(sessionCardViewSchema),
});

export const weekTimetableViewSchema = z.object({
  index: z.number().int().nonnegative(),
  startDate: z.coerce.date(),
  days: z.array(daySlotViewSchema),
});

export const planTimetableViewSchema = z.object({
  planId: z.string().cuid(),
  planTitle: z.string(),
  todayWeekIndex: z.number().int().nonnegative().nullable(),
  landingWeekIndex: z.number().int().nonnegative(),
  weeks: z.array(weekTimetableViewSchema),
});

export const planTimetableResponseSchema = z.object({
  plans: z.array(planTimetableViewSchema),
});
