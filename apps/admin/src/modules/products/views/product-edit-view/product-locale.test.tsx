import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TranslationState } from "@repo/contracts/cms/locale";
import { type AdminProductDetails } from "@repo/contracts/cms/product";
import { STALE_TIMES } from "@repo/query";

import type * as Api from "@app/lib/api";
import { adminKeys } from "@app/lib/api/keys";
import { clickButton, typeInto } from "@app/test/interactions";
import { LOCALE_CATALOG } from "@app/test/locale.fixtures";
import { readMockNavigationCalls, resetMockNavigation, setMockNavigation } from "@app/test/mocks";
import { render } from "@app/test/render";

import {
  makePrice,
  makeProduct,
  makeProductDeferred,
  makeTranslatedProduct,
  pickOption,
} from "../../products.fixtures";
import { ProductsListSection } from "../../sections";

import { ProductEditView } from "./index";

const endpoints = vi.hoisted(() => ({
  getById: vi.fn<typeof Api.api.products.getById>(),
  saveTranslation: vi.fn<typeof Api.api.products.saveTranslation>(),
  update: vi.fn<typeof Api.api.products.update>(),
  toggleStatus: vi.fn<typeof Api.api.products.toggleStatus>(),
  listLocales: vi.fn<typeof Api.api.locales.list>(),
}));
const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@app/lib/api", async () => {
  const actual = await vi.importActual<typeof Api>("@app/lib/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      products: {
        ...actual.api.products,
        getById: endpoints.getById,
        saveTranslation: endpoints.saveTranslation,
        update: endpoints.update,
        toggleStatus: endpoints.toggleStatus,
      },
      locales: { ...actual.api.locales, list: endpoints.listLocales },
    },
  };
});
vi.mock("sonner", () => ({ toast: notifications }));
vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());
vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const ID = makeProduct([]).id;
const createClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: STALE_TIMES.THIRTY_SECONDS },
      mutations: { retry: false },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  endpoints.getById
    .mockReset()
    .mockImplementation(async (_id, locale) =>
      locale === "en"
        ? makeProduct([makePrice()])
        : makeTranslatedProduct(TranslationState.TRANSLATED, locale),
    );
  endpoints.saveTranslation.mockReset().mockResolvedValue(undefined);
  endpoints.update.mockReset().mockResolvedValue(makeProduct([makePrice()]));
  endpoints.toggleStatus.mockReset().mockResolvedValue(makeProduct([]));
  endpoints.listLocales.mockReset().mockResolvedValue(LOCALE_CATALOG);
  resetMockNavigation();
  setMockNavigation({ pathname: `/products/${ID}`, search: "locale=uk" });
});

describe("ProductEditView per language with real query hooks", () => {
  it("opens the Ukrainian form and reads that product locale", async () => {
    render(<ProductEditView id={ID} />);

    expect(await screen.findByLabelText("Product Title")).toHaveValue("Localized title");
    expect(screen.getByLabelText("Product Title")).toHaveAccessibleDescription(
      "English Strength Mastery",
    );
    expect(endpoints.getById).toHaveBeenCalledExactlyOnceWith(ID, "uk");
    expect(screen.getByRole("button", { name: "Save Translation" })).toBeDisabled();
  });

  it("shows the not-found content for an unknown language without reading a product", async () => {
    setMockNavigation({ search: "locale=xx" });
    render(<ProductEditView id={ID} />);

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(endpoints.getById).not.toHaveBeenCalled();
  });

  it("opens a disabled language with its hidden note", async () => {
    setMockNavigation({ search: "locale=de" });
    render(<ProductEditView id={ID} />);

    expect(
      await screen.findByText(
        "German is hidden from the site until you enable it on the Languages page.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText("Product Title")).toHaveValue("Localized title");
    expect(endpoints.getById).toHaveBeenCalledExactlyOnceWith(ID, "de");
  });

  it("drops the locale parameter when switching to English and preserves other query values", async () => {
    setMockNavigation({ search: "locale=uk&tab=details" });
    render(<ProductEditView id={ID} />);
    await screen.findByLabelText("Product Title");
    await pickOption("Language", "English Default");

    expect(readMockNavigationCalls().replace).toEqual([`/products/${ID}?tab=details`]);
  });

  it("keeps the language's unsaved words separate when switching between product locales", async () => {
    const { rerender } = render(<ProductEditView id={ID} />);

    await screen.findByLabelText("Product Title");
    typeInto("Product Title", "Unsaved Ukrainian title");
    setMockNavigation({ search: "locale=de" });
    rerender(<ProductEditView id={ID} />);
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent("German"),
    );
    expect(screen.getByLabelText("Product Title")).toHaveValue("Localized title");
    expect(endpoints.getById).toHaveBeenCalledWith(ID, "de");
    expect(endpoints.saveTranslation).not.toHaveBeenCalled();
  });

  it("saves only Ukrainian words, waits for its own refresh after a backward clock step and refreshes catalog counts", async () => {
    const client = createClient();
    const initial = makeTranslatedProduct();
    const save = makeProductDeferred<void>();
    const refresh = makeProductDeferred<AdminProductDetails>();
    const key = adminKeys.products.detail(ID, "uk");
    const english = makeProduct([makePrice()]);

    client.setQueryData(adminKeys.locales.list(), LOCALE_CATALOG);
    client.setQueryData(key, initial);
    client.setQueryData(adminKeys.products.detail(ID, "en"), english);
    client.setQueryData(adminKeys.products.page(), { products: [] });
    endpoints.saveTranslation.mockReturnValueOnce(save.promise);
    endpoints.getById.mockReturnValueOnce(refresh.promise);
    const { unmount } = render(
      <QueryClientProvider client={client}>
        <ProductEditView id={ID} />
      </QueryClientProvider>,
    );

    await screen.findByLabelText("Product Title");
    typeInto("Product Title", "Saved Ukrainian product");
    clickButton("Save Translation");
    const sent = { ...initial.translation.words, title: "Saved Ukrainian product" };

    await waitFor(() =>
      expect(endpoints.saveTranslation).toHaveBeenCalledExactlyOnceWith(ID, {
        ...sent,
        locale: "uk",
      }),
    );
    await act(async () => {
      client.setQueryData(key, { ...initial, description: "Foreign English reference" });
    });
    const CLOCK_STEP_BACK_MS = 60_000;
    const steppedBackNow = Date.now() - CLOCK_STEP_BACK_MS;
    const clock = vi.spyOn(Date, "now").mockReturnValue(steppedBackNow);

    try {
      expect(client.getQueryState(key)?.dataUpdatedAt).toBeGreaterThan(Date.now());
      await act(async () => save.resolve());
      await waitFor(() => expect(endpoints.getById).toHaveBeenCalledExactlyOnceWith(ID, "uk"));
      expect(screen.getByLabelText("Product Title")).toBeDisabled();
      expect(notifications.success).not.toHaveBeenCalled();
      await act(async () =>
        refresh.resolve({ ...initial, translation: { ...initial.translation, words: sent } }),
      );
      await waitFor(() => expect(screen.getByLabelText("Product Title")).toBeEnabled());
      expect(screen.getByLabelText("Product Title")).toHaveValue(sent.title);
      expect(screen.getByRole("button", { name: "Save Translation" })).toBeDisabled();
      expect(notifications.success).toHaveBeenCalledExactlyOnceWith("Translation saved");
      expect(client.getQueryState(adminKeys.products.page())?.isInvalidated).toBe(true);
      expect(client.getQueryData(adminKeys.products.detail(ID, "en"))).toEqual(english);
      await waitFor(() => expect(endpoints.listLocales).toHaveBeenCalledTimes(1));
      expect(readMockNavigationCalls().push).toEqual([]);
    } finally {
      clock.mockRestore();
      unmount();
      client.clear();
    }
  });

  it("keeps a pending translation locked after leaving and returning to its locale", async () => {
    const client = createClient();
    const initial = makeTranslatedProduct();
    const save = makeProductDeferred<void>();
    const refresh = makeProductDeferred<AdminProductDetails>();
    const editor = (
      <QueryClientProvider client={client}>
        <ProductEditView id={ID} />
      </QueryClientProvider>
    );

    client.setQueryData(adminKeys.locales.list(), LOCALE_CATALOG);
    client.setQueryData(adminKeys.products.detail(ID, "uk"), initial);
    endpoints.saveTranslation.mockReturnValueOnce(save.promise);
    endpoints.getById.mockReturnValueOnce(refresh.promise);
    const { rerender, unmount } = render(editor);

    try {
      await screen.findByLabelText("Product Title");
      typeInto("Product Title", "Saved before leaving");
      clickButton("Save Translation");
      await waitFor(() => expect(endpoints.saveTranslation).toHaveBeenCalledTimes(1));
      rerender(<QueryClientProvider client={client}>Left product</QueryClientProvider>);
      rerender(editor);
      await waitFor(() => expect(screen.getByLabelText("Product Title")).toBeDisabled());
      expect(screen.getByRole("button", { name: "Clear Translation" })).toBeDisabled();
      await act(async () => save.resolve());
      await waitFor(() => expect(endpoints.getById).toHaveBeenCalledExactlyOnceWith(ID, "uk"));
      expect(screen.getByLabelText("Product Title")).toBeDisabled();
      await act(async () =>
        refresh.resolve({
          ...initial,
          translation: {
            ...initial.translation,
            words: { ...initial.translation.words, title: "Saved before leaving" },
          },
        }),
      );
      await waitFor(() => expect(screen.getByLabelText("Product Title")).toBeEnabled());
      expect(screen.getByLabelText("Product Title")).toHaveValue("Saved before leaving");
      expect(notifications.success).toHaveBeenCalledExactlyOnceWith("Translation saved");
    } finally {
      unmount();
      client.clear();
    }
  });

  it("retains the entered words when a translation save fails", async () => {
    endpoints.saveTranslation.mockRejectedValueOnce(new Error("Synthetic translation refusal"));
    render(<ProductEditView id={ID} />);
    await screen.findByLabelText("Product Title");
    typeInto("Product Title", "Retained after failure");
    clickButton("Save Translation");

    await waitFor(() => expect(notifications.error).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Product Title")).toHaveValue("Retained after failure");
    expect(screen.getByRole("button", { name: "Save Translation" })).toBeEnabled();
    expect(notifications.success).not.toHaveBeenCalled();
    expect(endpoints.getById).toHaveBeenCalledTimes(1);
  });

  it("invalidates locale counts after toggling a product's visible status", async () => {
    const client = createClient();

    client.setQueryData(adminKeys.locales.list(), LOCALE_CATALOG);
    const { unmount } = render(
      <QueryClientProvider client={client}>
        <ProductsListSection products={[makeProduct([])]} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("switch", { checked: true }));
    await waitFor(() => expect(endpoints.toggleStatus).toHaveBeenCalledExactlyOnceWith(ID));
    await waitFor(() =>
      expect(client.getQueryState(adminKeys.locales.list())?.isInvalidated).toBe(true),
    );
    unmount();
    client.clear();
  });

  it("clears only the current locale and lands the empty refetch before showing success", async () => {
    const cleared = makeTranslatedProduct(TranslationState.NOT_TRANSLATED);

    endpoints.getById.mockResolvedValueOnce(makeTranslatedProduct()).mockResolvedValueOnce(cleared);
    render(<ProductEditView id={ID} />);
    await screen.findByLabelText("Product Title");
    clickButton("Clear Translation");
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Clear Translation" }),
    );
    await waitFor(() =>
      expect(endpoints.saveTranslation).toHaveBeenCalledExactlyOnceWith(ID, {
        locale: "uk",
        title: "",
        description: "",
        features: [],
      }),
    );
    await screen.findByText("Not translated");
    expect(screen.getByLabelText("Product Title")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear Translation" })).not.toBeInTheDocument();
    expect(notifications.success).toHaveBeenCalledExactlyOnceWith("Translation cleared");
  });

  it("invalidates every locale of an English product update and refreshes the language catalog", async () => {
    const client = createClient();
    const key = adminKeys.products.detail(ID, "uk");

    setMockNavigation({ search: "" });
    client.setQueryData(key, makeTranslatedProduct());
    client.setQueryData(adminKeys.products.detail(ID, "en"), makeProduct([makePrice()]));
    client.setQueryData(adminKeys.locales.list(), LOCALE_CATALOG);
    const { unmount } = render(
      <QueryClientProvider client={client}>
        <ProductEditView id={ID} />
      </QueryClientProvider>,
    );

    await screen.findByLabelText("Product Title");
    typeInto("Product Title", "Changed English product");
    clickButton("Save Changes");
    await waitFor(() => expect(endpoints.update).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    await waitFor(() => expect(endpoints.listLocales).toHaveBeenCalledTimes(1));
    expect(readMockNavigationCalls().push).toEqual(["/products"]);
    unmount();
    client.clear();
  });
});
