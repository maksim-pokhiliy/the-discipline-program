import { DEFAULT_LOCALE } from "./locale";

const MS_PER_DAY = 86_400_000;
const DAYS_IN_WEEK = 7;

export const getMonday = (date: Date): Date => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
};

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getWeekDays = (monday: Date): Date[] =>
  Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(monday, i));

export const getISOWeekNumber = (date: Date): number => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  d.setDate(d.getDate() + 4 - (d.getDay() || DAYS_IN_WEEK));

  const yearStart = new Date(d.getFullYear(), 0, 1);

  return Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / DAYS_IN_WEEK);
};

export const formatDateParam = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

export const parseDateParam = (param: string): Date => {
  const parts = param.split("-").map(Number);

  return new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1);
};

export const formatDayHeader = (date: Date, locale: string = DEFAULT_LOCALE): string => {
  const day = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dateF = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });

  return `${day.format(date)}, ${dateF.format(date)}`;
};

export const formatDayName = (date: Date, locale: string = DEFAULT_LOCALE): string =>
  new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);

export const formatWeekRange = (monday: Date, locale: string = DEFAULT_LOCALE): string => {
  const sunday = addDays(monday, 6);
  const dateF = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const rangeF = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${dateF.format(monday)} – ${rangeF.format(sunday)}`;
};
