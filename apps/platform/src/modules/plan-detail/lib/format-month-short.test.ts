import { describe, expect, it } from "vitest";

import { formatMonthShort } from "./format-month-short";

describe("formatMonthShort", () => {
  it("returns Jan for a January date", () => {
    expect(formatMonthShort(new Date(2025, 0, 6))).toBe("Jan");
  });

  it("returns Jun for a June date", () => {
    expect(formatMonthShort(new Date(2025, 5, 15))).toBe("Jun");
  });

  it("returns Dec for a December date", () => {
    expect(formatMonthShort(new Date(2025, 11, 31))).toBe("Dec");
  });

  it("returns Feb for a leap-year February 29 date", () => {
    expect(formatMonthShort(new Date(2024, 1, 29))).toBe("Feb");
  });

  it("returns identical output on repeated calls against the singleton formatter", () => {
    const date = new Date(2025, 2, 10);

    expect(formatMonthShort(date)).toBe(formatMonthShort(date));
  });
});
