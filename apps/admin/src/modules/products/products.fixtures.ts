import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { expect } from "vitest";

import { TranslationState, type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminProductTranslation,
  type Price,
  type AdminProductDetails,
  type AdminProductListItem,
} from "@repo/contracts/cms/product";
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

export const makeProduct = (prices: Price[]): AdminProductDetails & AdminProductListItem => ({
  id: "clz00000000000000000prd1",
  slug: "strength-mastery",
  title: "Strength Mastery",
  description: "Twelve weeks of barbell strength work.",
  features: [],
  imageUrl: null,
  translation: null,
  translations: [],
  isFeatured: false,
  isActive: true,
  prices,
  createdAt: new Date("2026-06-16T09:00:00.000Z"),
  updatedAt: new Date("2026-06-16T09:00:00.000Z"),
});

export const makeTranslatedProduct = (
  state: TranslationState = TranslationState.TRANSLATED,
  locale: LocaleCode = "uk",
): AdminProductDetails & { translation: AdminProductTranslation } => {
  const features = [
    { id: "strength", text: "Strength work" },
    { id: "support", text: "Coaching support" },
  ];
  const isEmpty = state === TranslationState.NOT_TRANSLATED;

  return {
    ...makeProduct([makePrice()]),
    imageUrl: "https://synthetic.public.blob.vercel-storage.com/products/fixture.jpg",
    features,
    translation: {
      locale,
      state,
      words: {
        title: isEmpty ? "" : "Localized title",
        description: isEmpty || state === TranslationState.DRAFT ? "" : "Localized description",
        features: features.map(({ id }) => ({ id, text: isEmpty ? "" : `Localized ${id}` })),
      },
    },
  };
};

type ProductDeferred<TValue extends void | AdminProductDetails> = {
  promise: Promise<TValue>;
  resolve: (value: TValue) => void;
};

export const makeProductDeferred = <
  TValue extends void | AdminProductDetails,
>(): ProductDeferred<TValue> => {
  let resolve: ProductDeferred<TValue>["resolve"] = () => {
    throw new Error("Product deferred was not initialized");
  };
  const promise = new Promise<TValue>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

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

export { clickButton, typeInto } from "@app/test/interactions";
