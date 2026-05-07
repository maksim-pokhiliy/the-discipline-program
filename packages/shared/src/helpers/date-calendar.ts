import { DEFAULT_LOCALE } from "./locale";

const MS_PER_DAY = 86_400_000;

export const DAYS_IN_WEEK = 7;
export const LAST_DAY_OFFSET_IN_WEEK = 6;

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

const DATE_PARAM_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDateParam = (param: string): Date | null => {
  const match = DATE_PARAM_PATTERN.exec(param);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
};

export const formatDayHeader = (date: Date, locale: string = DEFAULT_LOCALE): string => {
  const day = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const dateF = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });

  return `${day.format(date)}, ${dateF.format(date)}`;
};

export const formatDayName = (date: Date, locale: string = DEFAULT_LOCALE): string =>
  new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);

export const formatWeekRange = (monday: Date, locale: string = DEFAULT_LOCALE): string => {
  const sunday = addDays(monday, LAST_DAY_OFFSET_IN_WEEK);
  const dateF = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
  const rangeF = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${dateF.format(monday)} – ${rangeF.format(sunday)}`;
};
