import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type Price, ProductCurrency } from "@repo/contracts/cms/product";
import { PeriodUnit } from "@repo/contracts/common";

import { render } from "@app/test/render";

import { makePrice, makeProduct } from "../../products.fixtures";

import { ProductsListSection } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const PRICE_COLUMN_CASES: [string, Price, string][] = [
  [
    "a monthly USD price",
    makePrice({
      amountCents: 9900,
      currency: ProductCurrency.USD,
      periodCount: 1,
      periodUnit: PeriodUnit.MONTH,
    }),
    "$99.00/month",
  ],
  [
    "a 4-week EUR price",
    makePrice({
      amountCents: 4900,
      currency: ProductCurrency.EUR,
      periodCount: 4,
      periodUnit: PeriodUnit.WEEK,
    }),
    "€49.00/4 weeks",
  ],
];

describe("ProductsListSection price column", () => {
  it.each(PRICE_COLUMN_CASES)("renders %s with its period", (_, price, expected) => {
    render(<ProductsListSection products={[makeProduct([price])]} />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders No price when the product has no active price", () => {
    render(<ProductsListSection products={[makeProduct([makePrice({ isActive: false })])]} />);

    expect(screen.getByText("No price")).toBeInTheDocument();
  });
});
