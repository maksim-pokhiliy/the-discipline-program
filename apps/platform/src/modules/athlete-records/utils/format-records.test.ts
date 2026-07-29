import { afterEach, describe, expect, it, vi } from "vitest";

import { formatLongDate, formatMagnitude, formatShortDate } from "./format-records";

const TZ_ENV_KEY = "TZ";
const KYIV_TZ = "Europe/Kyiv";
const NEW_YORK_TZ = "America/New_York";

const KYIV_PAST_MIDNIGHT_UTC = "2026-04-21T22:00:00.000Z";
const KYIV_PAST_MIDNIGHT_OFFSET = "2026-04-22T01:00:00.000+03:00";
const KYIV_PAST_MIDNIGHT_MINUS_FIVE = "2026-04-21T17:00:00.000-05:00";
const NEW_YORK_EVENING_UTC = "2026-04-23T00:00:00.000Z";
const KYIV_MONTH_ROLLOVER_UTC = "2026-04-30T22:00:00.000Z";
const KYIV_YEAR_ROLLOVER_UTC = "2025-12-31T23:00:00.000Z";
const NEW_YORK_YEAR_HOLD_UTC = "2026-01-01T02:00:00.000Z";
const MIDDAY_UTC = "2025-12-06T12:00:00.000Z";

describe("format-records date formatters (viewer-local calendar)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("formatLongDate names the day the athlete lived when her clock runs ahead of UTC", () => {
    vi.stubEnv(TZ_ENV_KEY, KYIV_TZ);

    expect(formatLongDate(KYIV_PAST_MIDNIGHT_UTC)).toBe("22 Apr 2026");
  });

  it("formatLongDate names the day the athlete lived when her clock runs behind UTC", () => {
    vi.stubEnv(TZ_ENV_KEY, NEW_YORK_TZ);

    expect(formatLongDate(NEW_YORK_EVENING_UTC)).toBe("22 Apr 2026");
  });

  it("formatLongDate reads one instant the same way however the payload spells it", () => {
    vi.stubEnv(TZ_ENV_KEY, KYIV_TZ);

    expect(formatLongDate(KYIV_PAST_MIDNIGHT_OFFSET)).toBe("22 Apr 2026");
    expect(formatLongDate(KYIV_PAST_MIDNIGHT_MINUS_FIVE)).toBe("22 Apr 2026");
  });

  it("formatShortDate follows the viewer's month across a local month rollover", () => {
    vi.stubEnv(TZ_ENV_KEY, KYIV_TZ);

    expect(formatShortDate(KYIV_MONTH_ROLLOVER_UTC)).toBe("May 2026");
  });

  it("both formatters follow the viewer's year across a local year rollover", () => {
    vi.stubEnv(TZ_ENV_KEY, KYIV_TZ);

    expect(formatLongDate(KYIV_YEAR_ROLLOVER_UTC)).toBe("1 Jan 2026");
    expect(formatShortDate(KYIV_YEAR_ROLLOVER_UTC)).toBe("Jan 2026");
  });

  it("both formatters hold the old year for a viewer whose local clock has not turned it", () => {
    vi.stubEnv(TZ_ENV_KEY, NEW_YORK_TZ);

    expect(formatLongDate(NEW_YORK_YEAR_HOLD_UTC)).toBe("31 Dec 2025");
    expect(formatShortDate(NEW_YORK_YEAR_HOLD_UTC)).toBe("Dec 2025");
  });

  it("formatShortDate renders the short month and full year", () => {
    vi.stubEnv(TZ_ENV_KEY, KYIV_TZ);

    expect(formatShortDate(MIDDAY_UTC)).toBe("Dec 2025");
  });

  it("formatLongDate renders the day, short month, and full year", () => {
    vi.stubEnv(TZ_ENV_KEY, KYIV_TZ);

    expect(formatLongDate(MIDDAY_UTC)).toBe("6 Dec 2025");
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
