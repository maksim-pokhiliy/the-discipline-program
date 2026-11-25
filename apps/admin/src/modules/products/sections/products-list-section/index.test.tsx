import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TranslationState } from "@repo/contracts/cms/locale";
import { type Price, type ProductLanguageState } from "@repo/contracts/cms/product";
import { Currency, PeriodUnit } from "@repo/contracts/common";
import { theme } from "@repo/mui";

import type * as Api from "@app/lib/api";
import { clickButton, typeInto } from "@app/test/interactions";
import { readMockNavigationCalls, resetMockNavigation, setMockNavigation } from "@app/test/mocks";
import { render } from "@app/test/render";

import { makePrice, makeProduct, pickOption } from "../../products.fixtures";

import { ProductsListSection } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("next-auth/react", async () => (await import("@app/test/mocks")).buildNextAuthMock());

const endpoints = vi.hoisted(() => ({
  delete: vi.fn<typeof Api.api.products.delete>(),
  toggleStatus: vi.fn<typeof Api.api.products.toggleStatus>(),
  toggleFeatured: vi.fn<typeof Api.api.products.toggleFeatured>(),
}));

vi.mock("@app/lib/api", async () => {
  const actual = await vi.importActual<typeof Api>("@app/lib/api");

  return { ...actual, api: { ...actual.api, products: { ...actual.api.products, ...endpoints } } };
});

beforeEach(() => {
  resetMockNavigation();
  setMockNavigation({ pathname: "/products" });
  endpoints.delete.mockReset().mockResolvedValue(undefined);
  endpoints.toggleStatus.mockReset().mockResolvedValue(makeProduct([]));
  endpoints.toggleFeatured.mockReset().mockResolvedValue(makeProduct([]));
});

const makeLanguage = (
  locale: string,
  name: string,
  state: TranslationState,
): ProductLanguageState => ({ locale, name, state });

const PRICE_COLUMN_CASES: [string, Price, string][] = [
  [
    "a monthly USD price",
    makePrice({
      amountCents: 9900,
      currency: Currency.USD,
      periodCount: 1,
      periodUnit: PeriodUnit.MONTH,
    }),
    "$99.00/month",
  ],
  [
    "a 4-week EUR price",
    makePrice({
      amountCents: 4900,
      currency: Currency.EUR,
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

describe("ProductsListSection features column", () => {
  it("counts admin feature rows and keeps the existing columns", () => {
    const features = [
      { id: "first", text: "First feature" },
      { id: "second", text: "Second feature" },
    ];

    render(<ProductsListSection products={[{ ...makeProduct([]), features }]} />);
    expect(screen.getByText("2 items")).toBeInTheDocument();
    for (const name of ["Product Name", "Status", "Spotlight", "Price", "Features", "Actions"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(name) })).toBeInTheDocument();
    }
  });
});

describe("ProductsListSection photo and languages", () => {
  it("shows the thumbnail or No photo at the theme's thumbnail size", () => {
    const product = makeProduct([]);
    const photo = "https://synthetic.public.blob.vercel-storage.com/products/list.jpg";
    const { rerender } = render(
      <ProductsListSection products={[{ ...product, imageUrl: photo }]} />,
    );
    const thumbnail = screen.getByRole("img", { name: `${product.title} photo` });

    expect(thumbnail).toHaveAttribute("src", photo);
    expect(thumbnail).toHaveStyle({
      width: theme.spacing(6),
      height: theme.spacing(6),
      objectFit: "contain",
    });
    expect(screen.queryByText("No photo")).not.toBeInTheDocument();
    rerender(<ProductsListSection products={[product]} />);
    expect(screen.getByText("No photo")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("lists every translated language with its server state in catalog order, including drafts", () => {
    const translations = [
      makeLanguage("uk", "Ukrainian", TranslationState.TRANSLATED),
      makeLanguage("de", "German", TranslationState.DRAFT),
      makeLanguage("fr", "French", TranslationState.ENGLISH_NEWER),
      makeLanguage("es", "Spanish", TranslationState.NOT_TRANSLATED),
    ];

    render(<ProductsListSection products={[{ ...makeProduct([]), translations }]} />);
    expect(screen.getByText("Ukrainian").parentElement).toHaveTextContent("Translated");
    expect(screen.getByText("German").parentElement).toHaveTextContent("Draft");
    expect(screen.getByText("French").parentElement).toHaveTextContent("English is newer");
    expect(screen.getByText("Spanish").parentElement).toHaveTextContent("Not translated");
    const cell = screen.getByText("Ukrainian").closest("td");

    if (!cell) {
      throw new Error("The language names must be rendered in a table cell");
    }

    expect(
      within(cell)
        .getAllByText(/^(Ukrainian|German|French|Spanish)$/)
        .map((name) => name.textContent),
    ).toEqual(["Ukrainian", "German", "French", "Spanish"]);
    expect(screen.queryByText("English only")).not.toBeInTheDocument();
  });

  it("shows English only when no translation exists", () => {
    render(<ProductsListSection products={[makeProduct([])]} />);

    expect(screen.getByText("English only")).toBeInTheDocument();
  });

  it("keeps all eight columns and the ratified percentage widths in the table's scroll container", () => {
    render(<ProductsListSection products={[makeProduct([])]} />);
    const headers = screen.getAllByRole("columnheader");

    expect(headers.map((header) => header.textContent?.replace(/\s*sorted.*$/, ""))).toEqual([
      "Photo",
      "Product Name",
      "Status",
      "Spotlight",
      "Price",
      "Features",
      "Languages",
      "Actions",
    ]);
    expect(headers.map((header) => header.getAttribute("width"))).toEqual([
      "8%",
      "22%",
      "13%",
      "14%",
      "11%",
      "8%",
      "14%",
      "10%",
    ]);
    expect(screen.getByRole("table").parentElement).toHaveStyle({
      width: "100%",
      overflowX: "auto",
    });
  });
});

describe("ProductsListSection existing interactions", () => {
  it("keeps title search, visibility/spotlight filters, sort and edit/create links", async () => {
    const product = makeProduct([]);
    const other = {
      ...product,
      id: "clz00000000000000000prd2",
      title: "Adaptive program",
      slug: "adaptive-program",
      isActive: false,
      isFeatured: true,
    };
    const products = [product, other];
    const { rerender } = render(<ProductsListSection products={products} />);

    expect(screen.getByRole("link", { name: "Create Product" })).toHaveAttribute(
      "href",
      "/products/create",
    );
    typeInto("Search", "Adaptive");
    expect(readMockNavigationCalls().replace.at(-1)).toBe("/products?search=Adaptive");
    setMockNavigation({ search: "search=Adaptive" });
    rerender(<ProductsListSection products={products} />);
    expect(screen.queryByText(product.title)).not.toBeInTheDocument();
    await pickOption("Status", "Inactive");
    expect(readMockNavigationCalls().replace.at(-1)).toBe(
      "/products?search=Adaptive&f.status=inactive",
    );
    setMockNavigation({ search: "search=Adaptive&f.status=inactive" });
    rerender(<ProductsListSection products={products} />);
    await pickOption("Spotlight", "Featured");
    expect(readMockNavigationCalls().replace.at(-1)).toBe(
      "/products?search=Adaptive&f.status=inactive&f.spotlight=featured",
    );
    setMockNavigation({ search: "search=Adaptive&f.status=inactive&f.spotlight=featured" });
    rerender(<ProductsListSection products={products} />);
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      `/products/${other.id}`,
    );
    clickButton("Product Name");
    expect(readMockNavigationCalls().replace.at(-1)).toContain("sort=title");
  });

  it("keeps both row toggles calling the same product endpoints", async () => {
    const product = makeProduct([]);

    render(<ProductsListSection products={[product]} />);
    fireEvent.click(screen.getByRole("switch", { checked: true }));
    await waitFor(() => expect(endpoints.toggleStatus).toHaveBeenCalledExactlyOnceWith(product.id));
    fireEvent.click(screen.getByRole("switch", { checked: false }));
    await waitFor(() =>
      expect(endpoints.toggleFeatured).toHaveBeenCalledExactlyOnceWith(product.id),
    );
  });

  it("keeps the product delete confirmation and deletes only after confirming", async () => {
    const product = makeProduct([]);

    render(<ProductsListSection products={[product]} />);
    clickButton("Delete");
    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveTextContent("Delete Product");
    expect(dialog).toHaveTextContent("Are you sure you want to delete this product?");
    expect(dialog).toHaveTextContent(
      "This will remove the product from the storefront immediately. This action cannot be undone.",
    );
    expect(endpoints.delete).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(endpoints.delete).toHaveBeenCalledExactlyOnceWith(product.id));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
