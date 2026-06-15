import { type DayOfWeek } from "@repo/contracts/lms/_shared";

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const formatDayLabel = (dayOfWeek: DayOfWeek): string => DAY_LABELS[dayOfWeek];
