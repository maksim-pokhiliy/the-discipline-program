const LONG_DATE_SEPARATOR = " ";

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const formatLongDate = (iso: string): string => {
  const date = new Date(iso);

  return [date.getUTCDate(), MONTH_SHORT[date.getUTCMonth()], date.getUTCFullYear()].join(
    LONG_DATE_SEPARATOR,
  );
};
