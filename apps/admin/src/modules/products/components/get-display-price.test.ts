import { describe, expect, it } from "vitest";

import { Currency, PeriodUnit } from "@repo/contracts/common";

import { makePrice } from "../products.fixtures";

import { getDisplayPrice } from "./get-display-price";

describe("getDisplayPrice", () => {
  it("shows no price when no active price exists", () => {
    expect(getDisplayPrice({ prices: [] })).toBe("No price");
    expect(getDisplayPrice({ prices: [makePrice({ isActive: false })] })).toBe("No price");
  });

  it("uses the active price's amount, currency and period", () => {
    expect(
      getDisplayPrice({
        prices: [
          makePrice({ isActive: false }),
          makePrice({
            amountCents: 4900,
            currency: Currency.EUR,
            periodCount: 4,
            periodUnit: PeriodUnit.WEEK,
          }),
        ],
      }),
    ).toBe("€49.00/4 weeks");
    expect(getDisplayPrice({ prices: [makePrice()] })).toBe("$99.00/month");
  });
});
