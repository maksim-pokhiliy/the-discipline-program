import { DEFAULT_LOCALE } from "./locale";

type DateFormatStyle = "short" | "medium" | "long" | "compact" | "day" | "weekday";

const FORMATTERS: Record<DateFormatStyle, Intl.DateTimeFormat> = {
  short: new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium" }),
  medium: new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium", timeStyle: "short" }),
  long: new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "long", timeStyle: "short" }),
  compact: new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
  day: new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: "short", day: "numeric" }),
  weekday: new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }),
};

export const formatDate = (date: Date | string, style: DateFormatStyle = "short"): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  return FORMATTERS[style].format(d);
};
