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

export const formatLocalLongDate = (iso: string): string => {
  const date = new Date(iso);

  return [date.getDate(), MONTH_SHORT[date.getMonth()], date.getFullYear()].join(
    LONG_DATE_SEPARATOR,
  );
};
