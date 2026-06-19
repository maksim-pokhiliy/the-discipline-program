import { describe, expect, it } from "vitest";

import { formatLongDate, formatMagnitude, formatShortDate } from "./format-records";

const UTC_LATE_NIGHT = "2026-04-22T23:30:00.000Z";
const SAME_INSTANT_PLUS_ONE = "2026-04-23T00:30:00.000+01:00";
const SAME_INSTANT_MINUS_FIVE = "2026-04-22T18:30:00.000-05:00";
const UTC_YEAR_BOUNDARY = "2026-01-01T00:30:00.000Z";
const SAME_BOUNDARY_MINUS_ONE = "2025-12-31T23:30:00.000-01:00";

describe("format-records date formatters (tz-stable)", () => {
  it("formatShortDate normalizes equivalent instants to the same UTC month and year", () => {
    expect(formatShortDate(UTC_LATE_NIGHT)).toBe("Apr 2026");
    expect(formatShortDate(SAME_INSTANT_PLUS_ONE)).toBe("Apr 2026");
    expect(formatShortDate(SAME_INSTANT_MINUS_FIVE)).toBe("Apr 2026");
  });

  it("formatLongDate normalizes equivalent instants to the same UTC calendar day", () => {
    expect(formatLongDate(UTC_LATE_NIGHT)).toBe("22 Apr 2026");
    expect(formatLongDate(SAME_INSTANT_PLUS_ONE)).toBe("22 Apr 2026");
    expect(formatLongDate(SAME_INSTANT_MINUS_FIVE)).toBe("22 Apr 2026");
  });

  it("holds the UTC day across a year boundary regardless of the source offset", () => {
    expect(formatShortDate(UTC_YEAR_BOUNDARY)).toBe("Jan 2026");
    expect(formatShortDate(SAME_BOUNDARY_MINUS_ONE)).toBe("Jan 2026");
    expect(formatLongDate(UTC_YEAR_BOUNDARY)).toBe("1 Jan 2026");
    expect(formatLongDate(SAME_BOUNDARY_MINUS_ONE)).toBe("1 Jan 2026");
  });

  it("formatShortDate renders the short month and full year", () => {
    expect(formatShortDate("2025-12-06T12:00:00.000Z")).toBe("Dec 2025");
  });

  it("formatLongDate renders the day, short month, and full year", () => {
    expect(formatLongDate("2025-12-06T12:00:00.000Z")).toBe("6 Dec 2025");
  });
});

describe("formatMagnitude", () => {
  it("renders a positive value with a spaced unit and no sign", () => {
    expect(formatMagnitude(10, "kg")).toBe("10 kg");
  });

  it("drops the sign of a negative value, keeping only the magnitude", () => {
    expect(formatMagnitude(-5, "s")).toBe("5 s");
  });

  it("renders the magnitude of a larger negative value without a sign", () => {
    expect(formatMagnitude(-12, "kg")).toBe("12 kg");
  });

  it("renders zero with the unit", () => {
    expect(formatMagnitude(0, "kg")).toBe("0 kg");
  });

  it("omits the trailing space when the unit is empty", () => {
    expect(formatMagnitude(8, "")).toBe("8");
  });
});
