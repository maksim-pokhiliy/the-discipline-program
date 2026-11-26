import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TranslationState } from "@repo/contracts/cms/locale";
import { type ProductTranslationWords } from "@repo/contracts/cms/product";

import type * as Hooks from "@app/lib/hooks";
import { clickButton, typeInto, typeIntoNth } from "@app/test/interactions";
import { LOCALE_CATALOG, UKRAINIAN_LOCALE } from "@app/test/locale.fixtures";
import { render } from "@app/test/render";

import { makeTranslatedProduct } from "../../products.fixtures";

import { ProductTranslationForm } from "./product-translation-form";

const mutation = vi.hoisted(() => ({
  save: vi.fn<(words: ProductTranslationWords) => void>(),
  isPending: false,
}));

vi.mock("@app/lib/hooks", async () => ({
  ...(await vi.importActual<typeof Hooks>("@app/lib/hooks")),
  useSaveProductTranslation: () => ({ mutate: mutation.save, isPending: mutation.isPending }),
  useLocales: () => ({ data: LOCALE_CATALOG }),
}));
vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

beforeEach(() => {
  mutation.save.mockReset();
  mutation.isPending = false;
});

const renderTranslation = (state: TranslationState = TranslationState.TRANSLATED) => {
  const product = makeTranslatedProduct(state);
  const view = render(
    <ProductTranslationForm
      product={product}
      translation={product.translation}
      locale={UKRAINIAN_LOCALE}
    />,
  );

  return { product, ...view };
};

describe("ProductTranslationForm", () => {
  it("shows every word with its English beside it and keeps the feature structure in English", () => {
    const { product } = renderTranslation();

    expect(screen.getByLabelText("Product Title")).toHaveAccessibleDescription(
      `English ${product.title}`,
    );
    expect(screen.getByLabelText("Description")).toHaveAccessibleDescription(
      `English ${product.description}`,
    );
    product.features.forEach((feature, index) => {
      expect(screen.getAllByLabelText("Text")[index]).toHaveAccessibleDescription(
        `English ${feature.text}`,
      );
      expect(screen.getAllByLabelText("Text")[index]).toHaveValue(
        product.translation.words.features[index]?.text,
      );
    });
    expect(
      screen.queryByRole("button", { name: /^Add Feature$|^Move Feature|^Remove Feature/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Rows are added, moved and removed in English.")).toBeInTheDocument();
  });

  it("shows the shared fields as read-only and previews the complete English photo", () => {
    const { product, rerender } = renderTranslation();

    expect(screen.getByText("Same in every language. Change it in English.")).toBeInTheDocument();
    for (const label of ["URL Slug", "Price", "Status", "Spotlight"]) {
      expect(screen.getByLabelText(label)).toHaveAttribute("readonly");
    }
    expect(screen.getByLabelText("URL Slug")).toHaveValue(product.slug);
    expect(screen.getByLabelText("Price")).toHaveValue("$99.00/month");
    expect(screen.getByLabelText("Status")).toHaveValue("Active");
    expect(screen.getByLabelText("Spotlight")).toHaveValue("Standard");
    expect(screen.getByRole("img", { name: `${product.title} photo` })).toHaveAttribute(
      "src",
      product.imageUrl,
    );
    expect(screen.queryByLabelText("Product photo")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    const withoutPhoto = {
      ...product,
      imageUrl: null,
      prices: [],
      isActive: false,
      isFeatured: true,
    };

    rerender(
      <ProductTranslationForm
        product={withoutPhoto}
        translation={withoutPhoto.translation}
        locale={UKRAINIAN_LOCALE}
      />,
    );
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(screen.getByLabelText("Price")).toHaveValue("No price");
    expect(screen.getByLabelText("Status")).toHaveValue("Inactive");
    expect(screen.getByLabelText("Spotlight")).toHaveValue("Featured");
  });

  it("keeps Save disabled until a word changes and saves the language's words only", async () => {
    const { product } = renderTranslation();

    expect(screen.getByRole("button", { name: "Save Translation" })).toBeDisabled();
    typeInto("Product Title", "Edited localized title");
    expect(screen.getByRole("button", { name: "Save Translation" })).toBeEnabled();
    clickButton("Save Translation");
    await waitFor(() =>
      expect(mutation.save).toHaveBeenCalledExactlyOnceWith({
        ...product.translation.words,
        title: "Edited localized title",
      }),
    );
    expect(Object.keys(mutation.save.mock.calls[0]?.[0] ?? {}).sort()).toEqual([
      "description",
      "features",
      "title",
    ]);
  });

  it("enables confirmation and shows the notice when English is newer", async () => {
    const { product } = renderTranslation(TranslationState.ENGLISH_NEWER);

    expect(
      screen.getByText(
        "English changed after this translation was saved. Check the words against the English, then click Save Translation to confirm them.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Translation" })).toBeEnabled();
    clickButton("Save Translation");
    await waitFor(() =>
      expect(mutation.save).toHaveBeenCalledExactlyOnceWith(product.translation.words),
    );
  });

  it.each([
    [TranslationState.NOT_TRANSLATED, "Not translated"],
    [TranslationState.DRAFT, "Draft"],
    [TranslationState.TRANSLATED, "Translated"],
    [TranslationState.ENGLISH_NEWER, "English is newer"],
  ])("shows the server's %s state", (state, label) => {
    renderTranslation(state);

    expect(screen.getByText(label)).toBeInTheDocument();

    if (state === TranslationState.NOT_TRANSLATED) {
      expect(screen.queryByRole("button", { name: "Clear Translation" })).not.toBeInTheDocument();
      expect(screen.getByLabelText("Product Title")).toHaveValue("");
    }
  });

  it("Clear asks with the product sentence and sends empty words", () => {
    renderTranslation(TranslationState.DRAFT);
    clickButton("Clear Translation");

    expect(mutation.save).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveTextContent(
      "The Ukrainian words written for this product are removed, and the Ukrainian site shows it in English.",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Clear Translation" }));
    expect(mutation.save).toHaveBeenCalledExactlyOnceWith({
      title: "",
      description: "",
      features: [],
    });
  });

  it("locks the words and both actions during a save", () => {
    mutation.isPending = true;
    renderTranslation();

    expect(screen.getByLabelText("Product Title")).toBeDisabled();
    expect(screen.getByLabelText("Description")).toBeDisabled();
    screen.getAllByLabelText("Text").forEach((field) => expect(field).toBeDisabled());
    expect(screen.getByRole("button", { name: "Save Translation" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear Translation" })).toBeDisabled();
  });

  it("keeps unsaved words on their feature ids across an English move, addition and removal", async () => {
    const { product, rerender } = renderTranslation();

    typeIntoNth("Text", 1, "Unsaved support");
    const added = { id: "new", text: "New English feature" };
    const next = {
      ...product,
      features: [...product.features.slice(1), added],
      translation: {
        ...product.translation,
        words: {
          ...product.translation.words,
          features: [
            { id: "support", text: "Localized support" },
            { id: added.id, text: "" },
          ],
        },
      },
    };

    rerender(
      <ProductTranslationForm
        product={next}
        translation={next.translation}
        locale={UKRAINIAN_LOCALE}
      />,
    );
    await waitFor(() => expect(screen.getAllByLabelText("Text")[0]).toHaveValue("Unsaved support"));
    expect(screen.getAllByLabelText("Text")[0]).toHaveAccessibleDescription(
      "English Coaching support",
    );
    expect(screen.getAllByLabelText("Text")[1]).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save Translation" })).toBeEnabled();
    clickButton("Save Translation");
    await waitFor(() => expect(mutation.save).toHaveBeenCalledTimes(1));
    expect(mutation.save.mock.calls[0]?.[0].features).toEqual([
      { id: "support", text: "Unsaved support" },
      { id: "new", text: "" },
    ]);
  });
});
