export const getMonday = (date: Date): Date => {
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diff));
};

export const addDays = (date: Date, days: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export const getWeekDays = (monday: Date): Date[] =>
  Array.from({ length: 7 }, (_, i) => addDays(monday, i));

export const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

export const formatDateParam = (date: Date): string => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
};

export const parseDateParam = (param: string): Date => {
  const parts = param.split("-").map(Number);

  return new Date(Date.UTC(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1));
};

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const RANGE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDayHeader = (date: Date): string =>
  `${DAY_FORMAT.format(date)}, ${DATE_FORMAT.format(date)}`;

export const formatDayName = (date: Date): string => DAY_FORMAT.format(date);

export const formatWeekRange = (monday: Date): string => {
  const sunday = addDays(monday, 6);

  return `${DATE_FORMAT.format(monday)} – ${RANGE_FORMAT.format(sunday)}`;
};
