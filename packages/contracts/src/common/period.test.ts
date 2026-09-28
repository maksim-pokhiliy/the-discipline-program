import { describe, expect, it } from "vitest";

import { PeriodUnit, periodSchema } from "./period";

const PERIOD_UNITS = Object.values(PeriodUnit);

const ACCEPTED_COUNTS = [1, 4, 365];

const REJECTED_COUNTS: unknown[] = [0, -1, 366, 1.5, NaN, Infinity, "4", null];

describe("periodSchema", () => {
  it.each(
    PERIOD_UNITS.flatMap((periodUnit) =>
      ACCEPTED_COUNTS.map((periodCount) => ({ periodCount, periodUnit })),
    ),
  )("accepts $periodCount $periodUnit", (period) => {
    expect(periodSchema.safeParse(period).success).toBe(true);
  });

  it.each(REJECTED_COUNTS)("rejects the count %p", (periodCount) => {
    expect(periodSchema.safeParse({ periodCount, periodUnit: PeriodUnit.WEEK }).success).toBe(
      false,
    );
  });

  it("rejects an unknown unit", () => {
    expect(periodSchema.safeParse({ periodCount: 2, periodUnit: "FORTNIGHT" }).success).toBe(false);
  });

  it("rejects a lower-case unit", () => {
    expect(periodSchema.safeParse({ periodCount: 2, periodUnit: "week" }).success).toBe(false);
  });

  it("rejects a period without a count", () => {
    expect(periodSchema.safeParse({ periodUnit: PeriodUnit.WEEK }).success).toBe(false);
  });

  it("rejects a period without a unit", () => {
    expect(periodSchema.safeParse({ periodCount: 4 }).success).toBe(false);
  });
});
