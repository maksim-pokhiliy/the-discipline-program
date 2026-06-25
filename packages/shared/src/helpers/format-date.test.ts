import { describe, expect, it } from "vitest";

import { formatCalendarDate, formatCalendarWeekday } from "./format-date";

const MARCH_NINTH_UTC = new Date("2026-03-09T00:00:00.000Z");
const NEW_YEAR_UTC = new Date("2026-01-01T00:00:00.000Z");

describe("formatCalendarDate", () => {
  it("renders the UTC calendar day regardless of tz (QA-02)", () => {
    expect(formatCalendarDate(MARCH_NINTH_UTC, "day")).toBe("Mar 9");
  });

  it("renders the year/month boundary day in UTC (QA-02)", () => {
    expect(formatCalendarDate(NEW_YEAR_UTC, "day")).toBe("Jan 1");
  });

  it("forces UTC so a local-tz formatter would disagree on a negative offset (QA-02)", () => {
    const losAngelesLocal = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    }).format(MARCH_NINTH_UTC);

    expect(losAngelesLocal).toBe("Mar 8");
    expect(formatCalendarDate(MARCH_NINTH_UTC, "day")).toBe("Mar 9");
  });

  it("parses a string input as UTC before formatting (QA-02)", () => {
    expect(formatCalendarDate("2026-03-09T00:00:00.000Z", "day")).toBe("Mar 9");
  });
});

describe("formatCalendarWeekday", () => {
  it("renders the short weekday by default", () => {
    expect(formatCalendarWeekday("2026-01-05")).toBe("Mon");
  });

  it("renders the long weekday when requested", () => {
    expect(formatCalendarWeekday("2026-01-06", "long")).toBe("Tuesday");
  });

  it("parses a bare date string as UTC so the weekday never shifts by tz", () => {
    const losAngelesLocal = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "America/Los_Angeles",
    }).format(new Date("2026-01-05T00:00:00.000Z"));

    expect(losAngelesLocal).toBe("Sunday");
    expect(formatCalendarWeekday("2026-01-05", "long")).toBe("Monday");
  });
});
