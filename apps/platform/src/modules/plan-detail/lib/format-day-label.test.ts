import { describe, expect, it } from "vitest";

import { type DayOfWeek, dayOfWeekValues } from "@repo/contracts/lms/_shared";

import { formatDayLabel } from "./format-day-label";

const EXPECTED_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

describe("formatDayLabel", () => {
  it("returns the title-cased English label for Monday", () => {
    expect(formatDayLabel("MONDAY")).toBe("Monday");
  });

  it("returns the title-cased English label for Sunday", () => {
    expect(formatDayLabel("SUNDAY")).toBe("Sunday");
  });

  it.each(dayOfWeekValues)("maps %s to its full weekday name", (dayOfWeek) => {
    expect(formatDayLabel(dayOfWeek)).toBe(EXPECTED_LABELS[dayOfWeek]);
  });
});
