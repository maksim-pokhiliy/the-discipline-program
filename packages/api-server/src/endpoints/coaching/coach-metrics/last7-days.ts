import { type Last7Day } from "@repo/contracts/coaching/coach-athletes";

import { addDaysInTz } from "../../../utils/date-helpers";

import { LAST_7_DAYS } from "./coach-metrics.constants";
import { type PerformedByKey } from "./coach-metrics.types";
import { buildDaysByDate, classifyDate } from "./day-status";
import { type ScheduledDay } from "./scheduled-day";

export const buildLast7Days = (
  scheduledDays: ScheduledDay[],
  startOfToday: Date,
  tz: string,
  startOfDayCache: (date: Date) => Date,
  performedByKey: PerformedByKey,
  athleteId: string,
): Last7Day[] => {
  const byDate = buildDaysByDate(scheduledDays);
  const days: Last7Day[] = [];

  for (let offset = LAST_7_DAYS - 1; offset >= 0; offset -= 1) {
    const date = startOfDayCache(addDaysInTz(startOfToday, -offset, tz));
    const isToday = offset === 0;

    days.push({
      date,
      status: classifyDate(byDate.get(date.getTime()), isToday, performedByKey, athleteId),
    });
  }

  return days;
};
