import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { createProductRequestSchema, ProductCurrency } from "@repo/contracts/cms/product";
import { PeriodUnit } from "@repo/contracts/common";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import {
  clickButton,
  expectPricing,
  makeProduct,
  pickOption,
  typeInto,
} from "../../products.fixtures";

const createProductMock: Mock = vi.fn();

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateProduct: () => ({ mutate: createProductMock, isPending: false }),
  };
});

const { ProductCreateView } = await import("./index");

const PRODUCT = makeProduct([]);

const CREATE_LABEL = "Create Product";

const REFUSED_PERIOD_LENGTHS: [string, string][] = [
  ["0", "Number must be greater than or equal to 1"],
  ["366", "Number must be less than or equal to 365"],
];

const fillProduct = (amount: string): void => {
  typeInto("Product Title", PRODUCT.title);
  typeInto("Description", PRODUCT.description);
  typeInto("Price", amount);
};

const expectRefusedWith = async (message: string): Promise<void> => {
  clickButton(CREATE_LABEL);

  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(createProductMock).not.toHaveBeenCalled();
};

afterEach(() => {
  createProductMock.mockReset();
});

describe("ProductCreateView pricing", () => {
  it("seeds a new product with a 4-week UAH price that offers auto-renew", () => {
    render(<ProductCreateView />);

    expectPricing({
      amount: null,
      currency: "UAH",
      periodCount: 4,
      periodUnit: "weeks",
      isAutoRenewOffered: true,
      symbol: "₴",
    });
  });

  it("explains what switching auto-renew off means", () => {
    render(<ProductCreateView />);

    expect(
      screen.getByText("When off, this price is sold only as a one-off paid period."),
    ).toBeInTheDocument();
  });

  it("moves the amount adornment with every currency change", async () => {
    render(<ProductCreateView />);

    await pickOption("Currency", "USD");

    expect(screen.getByText("$")).toBeInTheDocument();

    await pickOption("Currency", "EUR");

    expect(screen.getByText("€")).toBeInTheDocument();
    expect(screen.queryByText("$")).not.toBeInTheDocument();
  });

  it("switches the auto-renew offer off and on", () => {
    render(<ProductCreateView />);

    const checkbox = screen.getByRole("checkbox", { name: "Offer auto-renew" });

    fireEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("submits a payload the create request schema accepts, with every price term", async () => {
    render(<ProductCreateView />);

    fillProduct("19.99");
    typeInto("Period length", "3");
    await pickOption("Period unit", "days");
    await pickOption("Currency", "EUR");
    fireEvent.click(screen.getByRole("checkbox", { name: "Offer auto-renew" }));
    clickButton(CREATE_LABEL);

    await waitFor(() => expect(createProductMock).toHaveBeenCalledTimes(1));

    const payload = createProductRequestSchema.parse(createProductMock.mock.calls[0]?.[0]);

    expect(payload.price).toEqual({
      amountCents: 1999,
      currency: ProductCurrency.EUR,
      periodCount: 3,
      periodUnit: PeriodUnit.DAY,
      autoRenew: false,
    });
  });

  it.each(REFUSED_PERIOD_LENGTHS)(
    "refuses a period length of %s on the field itself",
    async (periodLength, message) => {
      render(<ProductCreateView />);

      fillProduct("10");
      typeInto("Period length", periodLength);

      await expectRefusedWith(message);
    },
  );

  it("refuses a negative amount on the field itself", async () => {
    render(<ProductCreateView />);

    fillProduct("-5");

    await expectRefusedWith("Number must be greater than or equal to 0");
  });

  it("refuses an amount above the contract maximum on the field itself", async () => {
    render(<ProductCreateView />);

    fillProduct("1000000");

    await expectRefusedWith("Number must be less than or equal to 999999.99");
  });
});
