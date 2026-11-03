import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";

import { render } from "@app/test/render";

import { PAGE_LABELS } from "../../config/page-labels";
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

describe("PagesListSection", () => {
  it("names every page by its admin label", () => {
    render(<PagesListSection pages={SERVER_ORDER.map(makePageListItem)} />);

    Object.values(PAGE_LABELS).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("drops the Page suffix and the capitalized slug", () => {
    render(<PagesListSection pages={SERVER_ORDER.map(makePageListItem)} />);

    expect(screen.queryByText(/ Page$/)).not.toBeInTheDocument();
    expect(screen.queryByText("Faq")).not.toBeInTheDocument();
  });

  it("lists the pages in the coach's daily order", () => {
    render(<PagesListSection pages={SERVER_ORDER.map(makePageListItem)} />);

    const labels = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell").at(0)?.textContent);

    expect(labels).toEqual(COACH_ORDER.map((slug) => PAGE_LABELS[slug]));
  });

  it("leaves the given pages array in its server order", () => {
    const pages = SERVER_ORDER.map(makePageListItem);

    render(<PagesListSection pages={pages} />);

    expect(pages.map((page) => page.slug)).toEqual(SERVER_ORDER);
  });
});
