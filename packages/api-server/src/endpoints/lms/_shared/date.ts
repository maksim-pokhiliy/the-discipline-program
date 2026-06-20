import { dayOfWeekSchema, dayOfWeekValues } from "@repo/contracts/lms/_shared";
import { BadRequestError } from "@repo/errors";
import { getMonday, parseDateParam } from "@repo/shared";

export const DEFAULT_WORKOUT_TITLE = "Workout";

const SUNDAY_DAYS_FROM_MONDAY = 6;

export const toUtcMidnight = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export const addUtcDays = (date: Date, days: number): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));

export const weekMondayOfUtc = (date: Date): Date => {
  const midnight = toUtcMidnight(date);
  const weekday = midnight.getUTCDay();
  const offsetToMonday = weekday === 0 ? SUNDAY_DAYS_FROM_MONDAY : weekday - 1;

  return addUtcDays(midnight, -offsetToMonday);
};

export const sessionAbsoluteDateFromParts = (weekStartDate: Date, dayOfWeek: string): Date => {
  const monday = weekMondayOfUtc(weekStartDate);
  const day = dayOfWeekSchema.parse(dayOfWeek);

  return addUtcDays(monday, dayOfWeekValues.indexOf(day));
};

export const parseStartDate = (param: string): Date => {
  const parsed = parseDateParam(param);

  if (parsed === null) {
    throw new BadRequestError("startDate must be a valid YYYY-MM-DD date", {
      field: "startDate",
    });
  }

  return parsed;
};

export const resolveWeekStartDate = (startDateParam: string): Date => {
  const monday = getMonday(parseStartDate(startDateParam));

  return new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
};
