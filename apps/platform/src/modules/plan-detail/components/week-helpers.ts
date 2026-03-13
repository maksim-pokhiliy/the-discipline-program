export const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);

  return d;
};

export const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);

  d.setDate(d.getDate() + days);

  return d;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const getWeekDays = (monday: Date): Date[] =>
  Array.from({ length: 7 }, (_, i) => addDays(monday, i));

export const getISOWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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

const DAY_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const RANGE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const formatDayHeader = (date: Date): string =>
  `${DAY_FORMAT.format(date)}, ${DATE_FORMAT.format(date)}`;

export const formatWeekRange = (monday: Date): string => {
  const sunday = addDays(monday, 6);

  return `${DATE_FORMAT.format(monday)} – ${RANGE_FORMAT.format(sunday)}`;
};
