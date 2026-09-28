import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import type * as Hooks from "@app/lib/hooks";
import { render } from "@app/test/render";

import { expectPricing } from "../../products.fixtures";

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

const pickOption = async (label: string, option: string): Promise<void> => {
  fireEvent.mouseDown(screen.getByRole("combobox", { name: label }));
  fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: option }));

  await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
};

const typeInto = (label: string, value: string): void => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const fillProduct = (amount: string): void => {
  typeInto("Product Title", "Strength Mastery");
  typeInto("Description", "Twelve weeks of barbell strength work.");
  typeInto("Price", amount);
};

const submit = (): void => {
  fireEvent.click(screen.getByRole("button", { name: "Create Product" }));
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

  it("submits every price term with numbers where numbers belong", async () => {
    render(<ProductCreateView />);

    fillProduct("12.5");
    typeInto("Period length", "3");
    await pickOption("Period unit", "days");
    await pickOption("Currency", "EUR");
    fireEvent.click(screen.getByRole("checkbox", { name: "Offer auto-renew" }));
    submit();

    await waitFor(() => expect(createProductMock).toHaveBeenCalledTimes(1));

    expect(createProductMock.mock.calls[0]?.[0]).toMatchObject({
      price: {
        amountCents: 1250,
        currency: "EUR",
        periodCount: 3,
        periodUnit: "DAY",
        autoRenew: false,
      },
    });
  });

  it("refuses an amount above the contract maximum on the field itself", async () => {
    render(<ProductCreateView />);

    fillProduct("1000000");
    submit();

    expect(
      await screen.findByText("Number must be less than or equal to 999999.99"),
    ).toBeInTheDocument();
    expect(createProductMock).not.toHaveBeenCalled();
  });
});
