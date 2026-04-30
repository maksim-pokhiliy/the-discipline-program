import { type z } from "zod";

import { type dayOfWeekSchema } from "./day-of-week.schema";

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
] as const;
