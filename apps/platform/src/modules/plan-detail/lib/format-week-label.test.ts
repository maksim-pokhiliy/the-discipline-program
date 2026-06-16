import { describe, expect, it } from "vitest";

import { formatWeekRange, parseDateParam } from "@repo/shared";

import { formatWeekLabel } from "./format-week-label";

describe("formatWeekLabel", () => {
  it("renders 'Week of <range>' for a parseable YYYY-MM-DD", () => {
    const startDate = "2026-06-08";
    const parsed = parseDateParam(startDate);

    if (parsed === null) {
      throw new Error("fixture date must parse");
    }

    expect(formatWeekLabel(startDate)).toBe(`Week of ${formatWeekRange(parsed)}`);
  });

  it("starts with the 'Week of ' prefix for a valid date", () => {
    expect(formatWeekLabel("2026-01-06").startsWith("Week of ")).toBe(true);
  });

  it("falls back to the raw string when the input cannot be parsed", () => {
    expect(formatWeekLabel("2026-6-9")).toBe("Week of 2026-6-9");
  });

  it("falls back to the raw string for a non-date input", () => {
    expect(formatWeekLabel("not-a-date")).toBe("Week of not-a-date");
  });
});
