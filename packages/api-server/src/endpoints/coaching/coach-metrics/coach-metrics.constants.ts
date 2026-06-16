import { DayOfWeek } from "@prisma/client";

export const DAY_OF_WEEK_OFFSET: Record<DayOfWeek, number> = {
  [DayOfWeek.MONDAY]: 0,
  [DayOfWeek.TUESDAY]: 1,
  [DayOfWeek.WEDNESDAY]: 2,
  [DayOfWeek.THURSDAY]: 3,
  [DayOfWeek.FRIDAY]: 4,
  [DayOfWeek.SATURDAY]: 5,
  [DayOfWeek.SUNDAY]: 6,
};

export const RECENT_WORKOUTS_LIMIT = 5;
export const LAST_7_DAYS = 7;
export const METRICS_CACHE_TTL_SECONDS = 60;
export const DEFAULT_WORKOUT_TITLE = "Workout";
