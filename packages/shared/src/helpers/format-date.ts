import { DEFAULT_LOCALE } from "./locale";

type DateFormatStyle = "short" | "medium" | "long" | "compact" | "day" | "weekday";

export const formatDate = (date: Date | string, style: DateFormatStyle = "short"): string => {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (style) {
    case "short":
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium" }).format(d);
    case "medium":
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    case "long":
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        dateStyle: "long",
        timeStyle: "short",
      }).format(d);
    case "compact":
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    case "day":
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        month: "short",
        day: "numeric",
      }).format(d);
    case "weekday":
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(d);
  }
};
