import { Currency as PrismaCurrency } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { Currency } from "@repo/contracts/common";

import { CURRENCY_MAP } from "./currency";

describe("CURRENCY_MAP", () => {
  it("maps every Prisma currency to the contract currency of the same name", () => {
    const prismaCurrencies: string[] = Object.values(PrismaCurrency);
    const contractCurrencies: string[] = Object.values(Currency);

    expect(CURRENCY_MAP).toStrictEqual(
      Object.fromEntries(prismaCurrencies.map((currency) => [currency, currency])),
    );
    expect(Object.values(CURRENCY_MAP).sort()).toStrictEqual(contractCurrencies.sort());
  });
});
