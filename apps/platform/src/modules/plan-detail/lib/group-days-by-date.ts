import { type DayType } from "@repo/contracts/lms/day-type";
import { type PlanDay } from "@repo/contracts/lms/plan-day";
import { formatDateParam } from "@repo/shared";

export type DayBucket = {
  readonly date: Date;
  readonly planDayId: string | null;
  readonly dayType: DayType | null;
};

const toDate = (value: Date | string): Date =>
  typeof value === "string" ? new Date(value) : value;

export const groupDaysByDate = (
  days: PlanDay[],
  dayTypeMap: ReadonlyMap<string, DayType>,
): ReadonlyMap<string, DayBucket> => {
  const buckets: Map<string, DayBucket> = new Map();

  for (const day of days) {
    const date = toDate(day.date);
    const dayType = day.dayTypeId !== null ? (dayTypeMap.get(day.dayTypeId) ?? null) : null;

    buckets.set(formatDateParam(date), {
      date,
      planDayId: day.id,
      dayType,
    });
  }

  return buckets;
};
