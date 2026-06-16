import { formatDate } from "./format-date";
import { DEFAULT_LOCALE } from "./locale";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;

export const formatTimeAgo = (date: Date | string, locale: string = DEFAULT_LOCALE): string => {
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - target.getTime();

  const minutes = Math.round(diff / MS_PER_MINUTE);

  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(diff / MS_PER_HOUR);

  if (hours < HOURS_PER_DAY) {
    return `${hours}h ago`;
  }

  const days = Math.round(diff / MS_PER_DAY);

  if (days < DAYS_PER_WEEK) {
    return `${days}d ago`;
  }

  return formatDate(target, "day", locale);
};
