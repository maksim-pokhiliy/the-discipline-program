import { type DayType } from "@repo/contracts/lms/day-type";
import { type PlanDay } from "@repo/contracts/lms/plan-day";
import { formatDateParam } from "@repo/shared";

export type DayBucket = {
  readonly date: Date;
  readonly planDayId: string | null;
  readonly dayType: DayType | null;
};

export const groupDaysByDate = (
  days: PlanDay[],
  dayTypeMap: ReadonlyMap<string, DayType>,
): ReadonlyMap<string, DayBucket> => {
  const buckets: Map<string, DayBucket> = new Map();

  for (const day of days) {
    const dayType = day.dayTypeId !== null ? (dayTypeMap.get(day.dayTypeId) ?? null) : null;

    buckets.set(formatDateParam(day.date), {
      date: day.date,
      planDayId: day.id,
      dayType,
    });
  }

  return buckets;
};
