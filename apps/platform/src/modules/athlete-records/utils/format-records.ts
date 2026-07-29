import { MONTH_SHORT } from "@app/lib/format-record-date";

import { DELTA_UNIT_SEPARATOR, SHORT_DATE_SEPARATOR } from "./athlete-records.constants";

export { formatLongDate } from "@app/lib/format-record-date";

export const formatShortDate = (iso: string): string => {
  const date = new Date(iso);

  return `${MONTH_SHORT[date.getMonth()]}${SHORT_DATE_SEPARATOR}${date.getFullYear()}`;
};

export const formatMagnitude = (value: number, unit: string): string => {
  const suffix = unit.length > 0 ? `${DELTA_UNIT_SEPARATOR}${unit}` : "";

  return `${Math.abs(value)}${suffix}`;
};
