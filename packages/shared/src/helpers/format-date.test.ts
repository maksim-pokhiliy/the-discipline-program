import { describe, expect, it } from "vitest";

import { formatCalendarDate } from "./format-date";

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
