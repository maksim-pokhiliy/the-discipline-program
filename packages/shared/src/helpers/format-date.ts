import { DEFAULT_LOCALE } from "./locale";

type DateFormatStyle = "short" | "medium" | "long" | "compact" | "day" | "weekday";

const STYLE_OPTIONS: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: "medium" },
  medium: { dateStyle: "medium", timeStyle: "short" },
  long: { dateStyle: "long", timeStyle: "short" },
  compact: { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  day: { month: "short", day: "numeric" },
  weekday: { weekday: "short", month: "short", day: "numeric" },
};

export const formatDate = (
  date: Date | string,
  style: DateFormatStyle = "short",
  locale: string = DEFAULT_LOCALE,
): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat(locale, STYLE_OPTIONS[style]).format(d);
};
