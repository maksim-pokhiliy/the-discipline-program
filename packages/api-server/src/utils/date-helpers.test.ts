import { describe, expect, it } from "vitest";

import {
  daysBetweenInTz,
  endOfWeekInTz,
  startOfDayInTz,
  startOfTodayInTz,
  startOfWeekInTz,
} from "./date-helpers";

describe("startOfDayInTz", () => {
  it("returns midnight UTC for a UTC timezone", () => {
    const date = new Date("2025-06-15T14:30:00Z");
    const result = startOfDayInTz(date, "UTC");

    expect(result.toISOString()).toBe("2025-06-15T00:00:00.000Z");
  });

  it("returns midnight in Europe/Kyiv (UTC+3 summer)", () => {
    const date = new Date("2025-06-15T14:30:00Z");
    const result = startOfDayInTz(date, "Europe/Kyiv");

    expect(result.toISOString()).toBe("2025-06-14T21:00:00.000Z");
  });

  it("returns midnight in Europe/Kyiv (UTC+2 winter)", () => {
    const date = new Date("2025-01-15T14:30:00Z");
    const result = startOfDayInTz(date, "Europe/Kyiv");

    expect(result.toISOString()).toBe("2025-01-14T22:00:00.000Z");
  });

  it("returns midnight in America/New_York (UTC-4 summer)", () => {
    const date = new Date("2025-06-15T14:30:00Z");
    const result = startOfDayInTz(date, "America/New_York");

    expect(result.toISOString()).toBe("2025-06-15T04:00:00.000Z");
  });

  it("returns midnight in America/New_York (UTC-5 winter)", () => {
    const date = new Date("2025-01-15T14:30:00Z");
    const result = startOfDayInTz(date, "America/New_York");

    expect(result.toISOString()).toBe("2025-01-15T05:00:00.000Z");
  });

  it("handles midnight edge case — date just past midnight in tz", () => {
    const date = new Date("2025-06-15T21:05:00Z");
    const result = startOfDayInTz(date, "Europe/Kyiv");

    expect(result.toISOString()).toBe("2025-06-15T21:00:00.000Z");
  });

  it("handles midnight edge case — date just before midnight in tz", () => {
    const date = new Date("2025-06-15T20:59:00Z");
    const result = startOfDayInTz(date, "Europe/Kyiv");

    expect(result.toISOString()).toBe("2025-06-14T21:00:00.000Z");
  });

  it("handles exact midnight UTC input", () => {
    const date = new Date("2025-06-15T00:00:00.000Z");
    const result = startOfDayInTz(date, "UTC");

    expect(result.toISOString()).toBe("2025-06-15T00:00:00.000Z");
  });
});

describe("startOfTodayInTz", () => {
  it("returns a Date that is midnight of today in the given timezone", () => {
    const result = startOfTodayInTz("UTC");
    const now = new Date();
    const expected = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    expect(result.getTime()).toBe(expected.getTime());
  });

  it("result is always in the past or exactly now", () => {
    const result = startOfTodayInTz("America/New_York");

    expect(result.getTime()).toBeLessThanOrEqual(Date.now());
  });
});

describe("startOfWeekInTz", () => {
  it("returns Monday midnight for a Wednesday input", () => {
    const wednesday = new Date("2025-06-18T12:00:00Z");
    const result = startOfWeekInTz(wednesday, "UTC");

    expect(result.toISOString()).toBe("2025-06-16T00:00:00.000Z");
  });

  it("returns Monday midnight for a Monday input", () => {
    const monday = new Date("2025-06-16T12:00:00Z");
    const result = startOfWeekInTz(monday, "UTC");

    expect(result.toISOString()).toBe("2025-06-16T00:00:00.000Z");
  });

  it("returns previous Monday for a Sunday input", () => {
    const sunday = new Date("2025-06-22T12:00:00Z");
    const result = startOfWeekInTz(sunday, "UTC");

    expect(result.toISOString()).toBe("2025-06-16T00:00:00.000Z");
  });

  it("returns previous Monday for a Saturday input", () => {
    const saturday = new Date("2025-06-21T12:00:00Z");
    const result = startOfWeekInTz(saturday, "UTC");

    expect(result.toISOString()).toBe("2025-06-16T00:00:00.000Z");
  });

  it("handles timezone where local date differs from UTC date", () => {
    const lateUtcFriday = new Date("2025-06-20T23:30:00Z");
    const result = startOfWeekInTz(lateUtcFriday, "Europe/Kyiv");

    expect(result.toISOString()).toBe("2025-06-15T21:00:00.000Z");
  });
});

describe("endOfWeekInTz", () => {
  it("returns Sunday midnight for a Wednesday input", () => {
    const wednesday = new Date("2025-06-18T12:00:00Z");
    const result = endOfWeekInTz(wednesday, "UTC");

    expect(result.toISOString()).toBe("2025-06-22T00:00:00.000Z");
  });

  it("returns Sunday midnight for a Monday input", () => {
    const monday = new Date("2025-06-16T12:00:00Z");
    const result = endOfWeekInTz(monday, "UTC");

    expect(result.toISOString()).toBe("2025-06-22T00:00:00.000Z");
  });

  it("returns same Sunday midnight for a Sunday input", () => {
    const sunday = new Date("2025-06-22T12:00:00Z");
    const result = endOfWeekInTz(sunday, "UTC");

    expect(result.toISOString()).toBe("2025-06-22T00:00:00.000Z");
  });

  it("respects timezone offset", () => {
    const wednesday = new Date("2025-06-18T12:00:00Z");
    const result = endOfWeekInTz(wednesday, "Europe/Kyiv");

    expect(result.toISOString()).toBe("2025-06-21T21:00:00.000Z");
  });
});

describe("daysBetweenInTz", () => {
  it("returns 0 for the same day", () => {
    const a = new Date("2025-06-15T10:00:00Z");
    const b = new Date("2025-06-15T22:00:00Z");

    expect(daysBetweenInTz(a, b, "UTC")).toBe(0);
  });

  it("returns positive days when b is after a", () => {
    const a = new Date("2025-06-15T10:00:00Z");
    const b = new Date("2025-06-18T10:00:00Z");

    expect(daysBetweenInTz(a, b, "UTC")).toBe(3);
  });

  it("returns negative days when a is after b", () => {
    const a = new Date("2025-06-18T10:00:00Z");
    const b = new Date("2025-06-15T10:00:00Z");

    expect(daysBetweenInTz(a, b, "UTC")).toBe(-3);
  });

  it("timezone-aware: same UTC instant can be different days in different zones", () => {
    const a = new Date("2025-06-15T23:30:00Z");
    const b = new Date("2025-06-16T00:30:00Z");

    expect(daysBetweenInTz(a, b, "UTC")).toBe(1);
    expect(daysBetweenInTz(a, b, "Europe/Kyiv")).toBe(0);
  });

  it("handles cross-midnight correctly in negative offset timezone", () => {
    const a = new Date("2025-06-16T03:30:00Z");
    const b = new Date("2025-06-16T05:30:00Z");

    expect(daysBetweenInTz(a, b, "America/New_York")).toBe(1);
    expect(daysBetweenInTz(a, b, "UTC")).toBe(0);
  });
});
