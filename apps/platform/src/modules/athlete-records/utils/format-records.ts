import {
  DELTA_UNIT_SEPARATOR,
  LONG_DATE_SEPARATOR,
  MONTH_SHORT,
  SHORT_DATE_SEPARATOR,
} from "./athlete-records.constants";

export const formatShortDate = (iso: string): string => {
  const date = new Date(iso);

  return `${MONTH_SHORT[date.getUTCMonth()]}${SHORT_DATE_SEPARATOR}${date.getUTCFullYear()}`;
};

export const formatLongDate = (iso: string): string => {
  const date = new Date(iso);

  return [date.getUTCDate(), MONTH_SHORT[date.getUTCMonth()], date.getUTCFullYear()].join(
    LONG_DATE_SEPARATOR,
  );
};

export const formatMagnitude = (value: number, unit: string): string => {
  const suffix = unit.length > 0 ? `${DELTA_UNIT_SEPARATOR}${unit}` : "";

  return `${Math.abs(value)}${suffix}`;
};
