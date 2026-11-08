import { screen, within } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";

import { api } from "@app/lib/api";
import { render } from "@app/test/render";

import { PAGE_LABELS } from "../../config/page-labels";
import { ENGLISH_LOCALE, UKRAINIAN_LOCALE, LOCALE_CATALOG } from "../../locale.fixtures";
import { makePageListItem } from "../../pages.fixtures";

import { PagesListSection } from "./index";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

const SERVER_ORDER = [
  PageSlug.ABOUT,
  PageSlug.BLOG,
  PageSlug.CONTACT,
  PageSlug.FAQ,
  PageSlug.HOME,
  PageSlug.OFFER,
  PageSlug.SITE,
  PageSlug.STOREFRONT,
];
const COACH_ORDER = [
  PageSlug.HOME,
  PageSlug.STOREFRONT,
  PageSlug.ABOUT,
  PageSlug.BLOG,
  PageSlug.CONTACT,
  PageSlug.FAQ,
  PageSlug.OFFER,
  PageSlug.SITE,
];

beforeEach(() => {
  vi.spyOn(api.locales, "list").mockResolvedValue(LOCALE_CATALOG);
});

afterEach(() => vi.restoreAllMocks());

describe("PagesListSection", () => {
  it("shows each page's translated count against its own section count", () => {
    const pages = [PageSlug.HOME, PageSlug.STOREFRONT, PageSlug.CONTACT].map((slug, index) => ({
      ...makePageListItem(slug),
      translatedSectionCount: [2, 0, 1][index] ?? 0,
    }));

    render(<PagesListSection pages={pages} locale={UKRAINIAN_LOCALE} />);

    ["2 of 6 translated", "0 of 4 translated", "1 of 3 translated"].forEach((caption) =>
      expect(screen.getByText(caption)).toBeInTheDocument(),
    );
    expect(screen.getByRole("progressbar", { name: "Home translation progress" })).toHaveAttribute(
      "aria-valuenow",
      "33",
    );
  });

  it("shows no translation column in English", () => {
    render(<PagesListSection pages={SERVER_ORDER.map(makePageListItem)} locale={ENGLISH_LOCALE} />);

    expect(screen.queryByRole("columnheader", { name: "Translation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it.each([
    [ENGLISH_LOCALE, ["60%", "30%", null]],
    [UKRAINIAN_LOCALE, ["40%", "30%", "20%", null]],
  ] as const)("preserves the column widths in $0.name", (locale, widths) => {
    render(<PagesListSection pages={SERVER_ORDER.map(makePageListItem)} locale={locale} />);

    expect(screen.getAllByRole("columnheader").map((cell) => cell.getAttribute("width"))).toEqual(
      widths,
    );
  });

  it("links every page to its editor in the list's language", () => {
    render(
      <PagesListSection pages={SERVER_ORDER.map(makePageListItem)} locale={UKRAINIAN_LOCALE} />,
    );

    screen
      .getAllByRole("row")
      .slice(1)
      .forEach((row, index) => {
        expect(within(row).getByRole("link", { name: "Edit content" })).toHaveAttribute(
          "href",
          `/pages/${COACH_ORDER[index]}?locale=uk`,
        );
      });
  });

  it("names every page by its admin label", () => {
    render(<PagesListSection locale={ENGLISH_LOCALE} pages={SERVER_ORDER.map(makePageListItem)} />);

    Object.values(PAGE_LABELS).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("drops the Page suffix and the capitalized slug", () => {
    render(<PagesListSection locale={ENGLISH_LOCALE} pages={SERVER_ORDER.map(makePageListItem)} />);

    expect(screen.queryByText(/ Page$/)).not.toBeInTheDocument();
    expect(screen.queryByText("Faq")).not.toBeInTheDocument();
  });

  it("lists the pages in the coach's daily order", () => {
    render(<PagesListSection locale={ENGLISH_LOCALE} pages={SERVER_ORDER.map(makePageListItem)} />);

    const labels = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell").at(0)?.textContent);

    expect(labels).toEqual(COACH_ORDER.map((slug) => PAGE_LABELS[slug]));
  });

  it("leaves the given pages array in its server order", () => {
    const pages = SERVER_ORDER.map(makePageListItem);

    render(<PagesListSection locale={ENGLISH_LOCALE} pages={pages} />);

    expect(pages.map((page) => page.slug)).toEqual(SERVER_ORDER);
  });
});
