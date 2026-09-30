import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { expect } from "vitest";

import { type Price, type Product } from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";

export const makePrice = (overrides: Partial<Price> = {}): Price => ({
  id: "clz00000000000000000prc1",
  amountCents: 9900,
  currency: Currency.USD,
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

export const pickOption = async (label: string, option: string): Promise<void> => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: label }));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: option }));

  await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
};

export const typeInto = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

export const clickButton = (name: string): void => {
  fireEvent.click(screen.getByRole("button", { name }));
};
