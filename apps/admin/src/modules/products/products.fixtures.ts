import { screen } from "@testing-library/react";
import { expect } from "vitest";

import { type Price, type Product, ProductCurrency } from "@repo/contracts/cms/product";
import { PeriodUnit } from "@repo/contracts/common";

export const makePrice = (overrides: Partial<Price> = {}): Price => ({
  id: "clz00000000000000000prc1",
  amountCents: 9900,
  currency: ProductCurrency.USD,
  periodCount: 1,
  periodUnit: PeriodUnit.MONTH,
  autoRenew: true,
  isActive: true,
  ...overrides,
});

export const makeProduct = (prices: Price[]): Product => ({
  id: "clz00000000000000000prd1",
  slug: "strength-mastery",
  title: "Strength Mastery",
  description: "Twelve weeks of barbell strength work.",
  features: [],
  isFeatured: false,
  isActive: true,
  prices,
  createdAt: new Date("2026-06-16T09:00:00.000Z"),
  updatedAt: new Date("2026-06-16T09:00:00.000Z"),
});

type ExpectedPricing = {
  amount: number | null;
  currency: string;
  periodCount: number;
  periodUnit: string;
  isAutoRenewOffered: boolean;
  symbol: string;
};

export const expectPricing = (expected: ExpectedPricing): void => {
  expect(screen.getByLabelText("Price")).toHaveValue(expected.amount);
  expect(screen.getByLabelText("Currency")).toHaveTextContent(expected.currency);
  expect(screen.getByLabelText("Period length")).toHaveValue(expected.periodCount);
  expect(screen.getByLabelText("Period unit")).toHaveTextContent(expected.periodUnit);
  expect(
    screen.getByRole("checkbox", {
      name: "Offer auto-renew",
      checked: expected.isAutoRenewOffered,
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(expected.symbol)).toBeInTheDocument();
};
