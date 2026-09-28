import { afterEach, describe, expect, it, vi } from "vitest";

import { formatPeriod } from "./format-period";
import { type Period, PeriodUnit } from "./period";

const EN_US = "en-US";
const UK_UA = "uk-UA";

const LOCALES = [EN_US, UK_UA];

const EN_US_CASES: [Period, string][] = [
  [{ periodCount: 1, periodUnit: PeriodUnit.MONTH }, "month"],
  [{ periodCount: 1, periodUnit: PeriodUnit.YEAR }, "year"],
  [{ periodCount: 4, periodUnit: PeriodUnit.WEEK }, "4 weeks"],
  [{ periodCount: 3, periodUnit: PeriodUnit.DAY }, "3 days"],
  [{ periodCount: 2, periodUnit: PeriodUnit.MONTH }, "2 months"],
];

const UK_UA_CASES: [Period, string][] = [
  [{ periodCount: 1, periodUnit: PeriodUnit.MONTH }, "місяць"],
  [{ periodCount: 1, periodUnit: PeriodUnit.YEAR }, "рік"],
  [{ periodCount: 4, periodUnit: PeriodUnit.WEEK }, "4 тижні"],
  [{ periodCount: 3, periodUnit: PeriodUnit.DAY }, "3 дні"],
  [{ periodCount: 5, periodUnit: PeriodUnit.DAY }, "5 днів"],
  [{ periodCount: 21, periodUnit: PeriodUnit.DAY }, "21 день"],
  [{ periodCount: 2, periodUnit: PeriodUnit.MONTH }, "2 місяці"],
];

const SINGLE_PERIODS = LOCALES.flatMap((locale) =>
  Object.values(PeriodUnit).map((periodUnit) => ({ locale, periodUnit })),
);

describe("formatPeriod", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(EN_US_CASES)("renders %o in en-US as %s", (period, expected) => {
    expect(formatPeriod(period, EN_US)).toBe(expected);
  });

  it.each(UK_UA_CASES)("renders %o in uk-UA as %s", (period, expected) => {
    expect(formatPeriod(period, UK_UA)).toBe(expected);
  });

  it.each(SINGLE_PERIODS)("renders a single $periodUnit in $locale without a digit", (single) => {
    const rendered = formatPeriod({ periodCount: 1, periodUnit: single.periodUnit }, single.locale);

    expect(rendered).not.toMatch(/\d/);
    expect(rendered.trim()).toBe(rendered);
    expect(rendered.length).toBeGreaterThan(0);
  });

  it("falls back to the full string when the locale yields no unit part", () => {
    vi.spyOn(Intl.NumberFormat.prototype, "formatToParts").mockReturnValue([
      { type: "integer", value: "1" },
    ]);

    expect(formatPeriod({ periodCount: 1, periodUnit: PeriodUnit.MONTH }, EN_US)).toBe("1 month");
  });
});
