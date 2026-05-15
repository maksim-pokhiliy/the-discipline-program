import { z } from "zod";

export const dayOfWeekValues = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const dayOfWeekSchema = z.enum(dayOfWeekValues);

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
