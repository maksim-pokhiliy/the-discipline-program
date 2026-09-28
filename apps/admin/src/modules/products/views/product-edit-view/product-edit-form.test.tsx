import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductCurrency } from "@repo/contracts/cms/product";
import { PeriodUnit } from "@repo/contracts/common";

import { render } from "@app/test/render";

import { makePrice, makeProduct } from "../../products.fixtures";

import { ProductEditForm } from "./product-edit-form";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

type ExpectedPricing = {
  amount: number | null;
  currency: string;
  periodCount: number;
  periodUnit: string;
  isAutoRenewOffered: boolean;
  symbol: string;
};

const expectPricing = (expected: ExpectedPricing): void => {
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

describe("ProductEditForm pricing", () => {
  it("shows a stored 4-week UAH price without auto-renew", () => {
    const price = makePrice({
      amountCents: 120000,
      currency: ProductCurrency.UAH,
      periodCount: 4,
      periodUnit: PeriodUnit.WEEK,
      autoRenew: false,
    });

    render(<ProductEditForm product={makeProduct([price])} />);

    expectPricing({
      amount: 1200,
      currency: "UAH",
      periodCount: 4,
      periodUnit: "weeks",
      isAutoRenewOffered: false,
      symbol: "₴",
    });
  });

  it("shows a stored monthly USD price with auto-renew", () => {
    const price = makePrice({
      amountCents: 9900,
      currency: ProductCurrency.USD,
      periodCount: 1,
      periodUnit: PeriodUnit.MONTH,
      autoRenew: true,
    });

    render(<ProductEditForm product={makeProduct([price])} />);

    expectPricing({
      amount: 99,
      currency: "USD",
      periodCount: 1,
      periodUnit: "months",
      isAutoRenewOffered: true,
      symbol: "$",
    });
  });

  it("falls back to the contract defaults when the product has no active price", () => {
    render(<ProductEditForm product={makeProduct([makePrice({ isActive: false })])} />);

    expectPricing({
      amount: null,
      currency: "UAH",
      periodCount: 4,
      periodUnit: "weeks",
      isAutoRenewOffered: true,
      symbol: "₴",
    });
  });
});
