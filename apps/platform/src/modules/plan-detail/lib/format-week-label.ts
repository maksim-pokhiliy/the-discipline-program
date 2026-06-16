import { formatWeekRange, parseDateParam } from "@repo/shared";

export const formatWeekLabel = (startDate: string): string => {
  const parsed = parseDateParam(startDate);

  return parsed ? `Week of ${formatWeekRange(parsed)}` : `Week of ${startDate}`;
};
