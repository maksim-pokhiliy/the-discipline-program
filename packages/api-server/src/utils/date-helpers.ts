const MS_PER_DAY = 86_400_000;

const getDatePartsInTz = (
  date: Date,
  tz: string,
): { year: number; month: number; day: number; weekday: number } => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: weekdayMap[parts.weekday ?? "Mon"] ?? 1,
  };
};

const getOffsetMs = (date: Date, tz: string): number => {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: tz });

  return new Date(tzStr).getTime() - new Date(utcStr).getTime();
};

export const startOfDayInTz = (date: Date, tz: string): Date => {
  const { year, month, day } = getDatePartsInTz(date, tz);
  const fakeUtcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const offset = getOffsetMs(fakeUtcMidnight, tz);

  return new Date(fakeUtcMidnight.getTime() - offset);
};

export const startOfTodayInTz = (tz: string): Date => startOfDayInTz(new Date(), tz);

export const startOfWeekInTz = (date: Date, tz: string): Date => {
  const { weekday } = getDatePartsInTz(date, tz);
  const diff = weekday === 0 ? 6 : weekday - 1;
  const mondayApprox = new Date(date.getTime() - diff * MS_PER_DAY);

  return startOfDayInTz(mondayApprox, tz);
};

export const endOfWeekInTz = (date: Date, tz: string): Date => {
  const weekStart = startOfWeekInTz(date, tz);
  const sundayApprox = new Date(weekStart.getTime() + 6 * MS_PER_DAY);

  return startOfDayInTz(sundayApprox, tz);
};

export const daysBetweenInTz = (a: Date, b: Date, tz: string): number => {
  const aDay = startOfDayInTz(a, tz);
  const bDay = startOfDayInTz(b, tz);

  return Math.floor((bDay.getTime() - aDay.getTime()) / MS_PER_DAY);
};
