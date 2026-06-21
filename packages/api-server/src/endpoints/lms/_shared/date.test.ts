import { describe, expect, it } from "vitest";

import { BadRequestError } from "@repo/errors";

import {
  parseStartDate,
  resolveWeekStartDate,
  sessionAbsoluteDateFromParts,
  weekMondayOfUtc,
} from "./date";

describe("parseStartDate", () => {
  it("returns a Date with local-midnight components for a valid YYYY-MM-DD", () => {
    const result = parseStartDate("2026-05-18");

    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(18);
  });

  it("throws BadRequestError for a regex-passing but calendar-invalid date", () => {
    expect(() => parseStartDate("2026-13-40")).toThrow(BadRequestError);
  });

  it("throws BadRequestError for a value that fails the regex", () => {
    expect(() => parseStartDate("not-a-date")).toThrow(BadRequestError);
  });
});

describe("resolveWeekStartDate", () => {
  it("returns UTC-midnight Monday when given a Monday param", () => {
    const result = resolveWeekStartDate("2026-05-18");

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(4);
    expect(result.getUTCDate()).toBe(18);
  });

  it("snaps a Wednesday param to UTC-midnight Monday of the same week", () => {
    const result = resolveWeekStartDate("2026-05-20");

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(4);
    expect(result.getUTCDate()).toBe(18);
  });

  it("snaps a Sunday param to UTC-midnight Monday of the same week", () => {
    const result = resolveWeekStartDate("2026-05-24");

    expect(result.getUTCFullYear()).toBe(2026);
    expect(result.getUTCMonth()).toBe(4);
    expect(result.getUTCDate()).toBe(18);
  });
});

describe("weekMondayOfUtc", () => {
  it("returns the same UTC Monday when given a Monday", () => {
    const result = weekMondayOfUtc(new Date("2026-05-18T00:00:00.000Z"));

    expect(result.getTime()).toBe(new Date("2026-05-18T00:00:00.000Z").getTime());
  });

  it("snaps a Wednesday back to the UTC Monday of the same week", () => {
    const result = weekMondayOfUtc(new Date("2026-05-20T12:34:56.000Z"));

    expect(result.getTime()).toBe(new Date("2026-05-18T00:00:00.000Z").getTime());
  });

  it("snaps a Sunday to the previous UTC Monday, not the next", () => {
    const result = weekMondayOfUtc(new Date("2026-05-24T23:59:59.000Z"));

    expect(result.getTime()).toBe(new Date("2026-05-18T00:00:00.000Z").getTime());
  });
});

describe("sessionAbsoluteDateFromParts", () => {
  it("adds the day-of-week offset to the UTC Monday of the week-start date", () => {
    const result = sessionAbsoluteDateFromParts(new Date("2026-05-18T00:00:00.000Z"), "WEDNESDAY");

    expect(result.getTime()).toBe(new Date("2026-05-20T00:00:00.000Z").getTime());
  });

  it("snaps a non-Monday week-start date to Monday before applying the offset", () => {
    const result = sessionAbsoluteDateFromParts(new Date("2026-05-20T00:00:00.000Z"), "FRIDAY");

    expect(result.getTime()).toBe(new Date("2026-05-22T00:00:00.000Z").getTime());
  });
});
