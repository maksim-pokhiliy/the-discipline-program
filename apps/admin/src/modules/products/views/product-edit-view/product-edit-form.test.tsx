import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { updateProductRequestSchema } from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";

import type * as Hooks from "@app/lib/hooks";
import { typeIntoNth } from "@app/test/interactions";
import { ENGLISH_LOCALE, LOCALE_CATALOG } from "@app/test/locale.fixtures";
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
const mutation = vi.hoisted(() => ({ isPending: false }));

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdateProduct: () => ({ mutate: updateProductMock, isPending: mutation.isPending }),
    useLocales: () => ({ data: LOCALE_CATALOG }),
  };
});

const { ProductEditForm } = await import("./product-edit-form");

const MONTHLY_USD_PRICE = makePrice({
  amountCents: 9900,
  currency: Currency.USD,
  periodCount: 1,
  periodUnit: PeriodUnit.MONTH,
  autoRenew: true,
});

describe("ProductEditForm language bar", () => {
  it("shows the language switch and the English product note", () => {
    render(<ProductEditForm locale={ENGLISH_LOCALE} product={makeProduct([MONTHLY_USD_PRICE])} />);

    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent("English");
    expect(
      screen.getByText(
        "English is the default language: every other language falls back to it, product by product.",
      ),
    ).toBeInTheDocument();
  });
});

afterEach(() => {
  updateProductMock.mockReset();
  mutation.isPending = false;
});

describe("ProductEditForm pricing", () => {
  it.each([
    { label: "Price", message: "Enter the price as a number" },
    { label: "Period length", message: "Enter the period length as a whole number" },
  ])("explains an empty $label on its field and blocks the save", async ({ label, message }) => {
    render(<ProductEditForm locale={ENGLISH_LOCALE} product={makeProduct([MONTHLY_USD_PRICE])} />);
    typeInto(label, "");
    clickButton("Save Changes");

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(label)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(label)).toHaveAccessibleDescription(message);
    expect(updateProductMock).not.toHaveBeenCalled();
  });

  it("shows a stored 4-week UAH price without auto-renew", () => {
    const price = makePrice({
      amountCents: 120000,
      currency: Currency.UAH,
      periodCount: 4,
      periodUnit: PeriodUnit.WEEK,
      autoRenew: false,
    });

    render(<ProductEditForm locale={ENGLISH_LOCALE} product={makeProduct([price])} />);

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
    render(<ProductEditForm locale={ENGLISH_LOCALE} product={makeProduct([MONTHLY_USD_PRICE])} />);

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
    render(
      <ProductEditForm
        locale={ENGLISH_LOCALE}
        product={makeProduct([makePrice({ isActive: false })])}
      />,
    );

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

    render(<ProductEditForm locale={ENGLISH_LOCALE} product={product} />);

    typeInto("Price", "12.5");
    typeInto("Period length", "4");
    await pickOption("Period unit", "weeks");
    clickButton("Save Changes");

    await waitFor(() => expect(updateProductMock).toHaveBeenCalledTimes(1));

    const request = updateProductMock.mock.calls[0]?.[0];

    expect(request?.id).toBe(product.id);
    expect(updateProductRequestSchema.parse(request?.data).price).toEqual({
      amountCents: 1250,
      currency: Currency.USD,
      periodCount: 4,
      periodUnit: PeriodUnit.WEEK,
      autoRenew: true,
    });
  });
});

describe("ProductEditForm features", () => {
  const first = { id: "first", text: "First feature" };
  const second = { id: "second", text: "Second feature" };
  const third = { id: "third", text: "Third feature" };

  it("blocks feature text, add, move and remove while the update is pending", async () => {
    const product = { ...makeProduct([MONTHLY_USD_PRICE]), features: [first, second] };
    const { rerender } = render(<ProductEditForm locale={ENGLISH_LOCALE} product={product} />);

    act(() => screen.getByRole("button", { name: "Save Changes" }).focus());
    clickButton("Save Changes");
    await waitFor(() => expect(updateProductMock).toHaveBeenCalledTimes(1));
    mutation.isPending = true;
    rerender(<ProductEditForm locale={ENGLISH_LOCALE} product={product} />);

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
    expect(screen.getAllByLabelText("Text")[0]).toHaveValue(first.text);
    expect(screen.getAllByLabelText("Text")[1]).toHaveValue(second.text);
    expect(updateProductMock).toHaveBeenCalledTimes(1);
    mutation.isPending = false;
    rerender(<ProductEditForm locale={ENGLISH_LOCALE} product={product} />);
    typeIntoNth("Text", 0, "Editable again");
    clickButton("Move Feature 1 down");
    clickButton("Remove Feature 1");
    clickButton("Add Feature");
    expect(screen.getAllByLabelText("Text")[0]).toHaveValue("Editable again");
    expect(screen.getByText("Key features (2)")).toBeInTheDocument();
  });

  it("adds, moves, removes and edits features while keeping their ids", async () => {
    const product = { ...makeProduct([MONTHLY_USD_PRICE]), features: [first, second, third] };

    render(<ProductEditForm locale={ENGLISH_LOCALE} product={product} />);
    clickButton("Add Feature");
    typeIntoNth("Text", 3, "New feature");
    typeIntoNth("Text", 0, "Edited first");
    clickButton("Move Feature 2 up");
    clickButton("Remove Feature 3");
    expect(screen.getByText("Key features (3)")).toBeInTheDocument();
    clickButton("Save Changes");

    await waitFor(() => expect(updateProductMock).toHaveBeenCalledTimes(1));
    const data = updateProductRequestSchema.parse(updateProductMock.mock.calls[0]?.[0]?.data);

    expect(data.features).toEqual([
      second,
      { ...first, text: "Edited first" },
      { id: expect.any(String), text: "New feature" },
    ]);
    const added = data.features?.[2];

    expect(added?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect([first.id, second.id, third.id]).not.toContain(added?.id);
  });

  it("a blank feature blocks the save with the field message", async () => {
    render(<ProductEditForm locale={ENGLISH_LOCALE} product={makeProduct([MONTHLY_USD_PRICE])} />);
    clickButton("Add Feature");
    clickButton("Save Changes");

    expect(await screen.findByText("Write the feature or remove it")).toBeInTheDocument();
    expect(updateProductMock).not.toHaveBeenCalled();
  });
});
