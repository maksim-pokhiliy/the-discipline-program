import { describe, expect, it } from "vitest";

import { BadRequestError } from "@repo/errors";

import { parseStartDate, resolveWeekStartDate } from "./date";

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
