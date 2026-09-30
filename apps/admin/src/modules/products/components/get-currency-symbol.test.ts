import { afterEach, describe, expect, it, vi } from "vitest";

import { Currency } from "@repo/contracts/common";

import { getCurrencySymbol } from "./get-currency-symbol";

const SYMBOL_CASES: [Currency, string][] = [
  [Currency.USD, "$"],
  [Currency.EUR, "€"],
  [Currency.UAH, "₴"],
];

describe("getCurrencySymbol", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(SYMBOL_CASES)("renders %s as %s", (currency, symbol) => {
    expect(getCurrencySymbol(currency)).toBe(symbol);
  });

  it("falls back to the ISO code when the locale yields no currency part", () => {
    vi.spyOn(Intl.NumberFormat.prototype, "formatToParts").mockReturnValue([
      { type: "integer", value: "0" },
    ]);

    expect(getCurrencySymbol(Currency.UAH)).toBe("UAH");
  });
});
