import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { createProductRequestSchema } from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";

import type * as Hooks from "@app/lib/hooks";
import { typeIntoNth } from "@app/test/interactions";
import { render } from "@app/test/render";

import {
  clickButton,
  expectPricing,
  makeProduct,
  pickOption,
  typeInto,
} from "../../products.fixtures";

const createProductMock: Mock = vi.fn();
const mutation = vi.hoisted(() => ({ isPending: false }));

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useCreateProduct: () => ({ mutate: createProductMock, isPending: mutation.isPending }),
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
  mutation.isPending = false;
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
      currency: Currency.EUR,
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

describe("ProductCreateView features", () => {
  it("blocks feature text, add, move and remove while creation is pending", async () => {
    const { rerender } = render(<ProductCreateView />);

    fillProduct("10");
    clickButton("Add Feature");
    typeIntoNth("Text", 0, "First feature");
    clickButton("Add Feature");
    typeIntoNth("Text", 1, "Second feature");
    act(() => screen.getByRole("button", { name: CREATE_LABEL }).focus());
    clickButton(CREATE_LABEL);
    await waitFor(() => expect(createProductMock).toHaveBeenCalledTimes(1));
    mutation.isPending = true;
    rerender(<ProductCreateView />);

    for (const field of screen.getAllByLabelText("Text")) {
      expect(field).toBeDisabled();
      field.focus();
      expect(field).not.toHaveFocus();
    }

    for (const button of screen.getAllByRole("button", {
      name: /^Add Feature$|^Move Feature|^Remove Feature/,
    })) {
      expect(button).toBeDisabled();
      act(() => button.click());
    }

    expect(screen.getByText("Key features (2)")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Text")[0]).toHaveValue("First feature");
    expect(screen.getAllByLabelText("Text")[1]).toHaveValue("Second feature");
    expect(createProductMock).toHaveBeenCalledTimes(1);
    mutation.isPending = false;
    rerender(<ProductCreateView />);
    typeIntoNth("Text", 0, "Editable again");
    clickButton("Move Feature 1 down");
    clickButton("Remove Feature 1");
    clickButton("Add Feature");
    expect(screen.getAllByLabelText("Text")[0]).toHaveValue("Editable again");
    expect(screen.getByText("Key features (2)")).toBeInTheDocument();
  });

  it("shows no language bar on the English-only create page", () => {
    render(<ProductCreateView />);

    expect(screen.queryByRole("combobox", { name: "Language" })).not.toBeInTheDocument();
  });

  it("creates with fresh, distinct feature row ids", async () => {
    render(<ProductCreateView />);
    fillProduct("10");
    clickButton("Add Feature");
    typeIntoNth("Text", 0, "First feature");
    clickButton("Add Feature");
    typeIntoNth("Text", 1, "Second feature");
    clickButton(CREATE_LABEL);

    await waitFor(() => expect(createProductMock).toHaveBeenCalledTimes(1));
    const payload = createProductRequestSchema.parse(createProductMock.mock.calls[0]?.[0]);

    expect(payload.features.map(({ text }) => text)).toEqual(["First feature", "Second feature"]);
    expect(payload.features[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(payload.features[1]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(payload.features[0]?.id).not.toBe(payload.features[1]?.id);
  });
});
