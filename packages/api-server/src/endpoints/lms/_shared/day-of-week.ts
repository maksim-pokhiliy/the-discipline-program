import { type DayOfWeek as PrismaDayOfWeek } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";

export const DAY_OF_WEEK_TO_PRISMA = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const satisfies Record<DayOfWeek, PrismaDayOfWeek>;
