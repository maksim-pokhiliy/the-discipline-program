import { waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { ProductCurrency, updateProductRequestSchema } from "@repo/contracts/cms/product";
import { PeriodUnit } from "@repo/contracts/common";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import {
  clickButton,
  expectPricing,
  makePrice,
  makeProduct,
  pickOption,
  typeInto,
} from "../../products.fixtures";

const updateProductMock: Mock = vi.fn();

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateProduct: () => ({ mutate: updateProductMock, isPending: false }),
  };
});

const { ProductEditForm } = await import("./product-edit-form");

const MONTHLY_USD_PRICE = makePrice({
  amountCents: 9900,
  currency: ProductCurrency.USD,
  periodCount: 1,
  periodUnit: PeriodUnit.MONTH,
  autoRenew: true,
});

afterEach(() => {
  updateProductMock.mockReset();
});

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
    render(<ProductEditForm product={makeProduct([MONTHLY_USD_PRICE])} />);

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

  it("submits the edited price in a payload the update request schema accepts", async () => {
    const product = makeProduct([MONTHLY_USD_PRICE]);

    render(<ProductEditForm product={product} />);

    typeInto("Price", "12.5");
    typeInto("Period length", "4");
    await pickOption("Period unit", "weeks");
    clickButton("Save Changes");

    await waitFor(() => expect(updateProductMock).toHaveBeenCalledTimes(1));

    const request = updateProductMock.mock.calls[0]?.[0];

    expect(request?.id).toBe(product.id);
    expect(updateProductRequestSchema.parse(request?.data).price).toEqual({
      amountCents: 1250,
      currency: ProductCurrency.USD,
      periodCount: 4,
      periodUnit: PeriodUnit.WEEK,
      autoRenew: true,
    });
  });
});
