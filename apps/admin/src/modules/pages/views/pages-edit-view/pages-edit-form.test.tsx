import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";

import type * as Hooks from "@app/lib/hooks";
import { clickButton, typeInto } from "@app/test/interactions";
import { render } from "@app/test/render";

import { PAGE_LABELS } from "../../config/page-labels";
import { makePage, makeSectionRow } from "../../pages.fixtures";

const updateSectionMock = vi.fn();

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

vi.mock("@app/lib/hooks", async () => {
  const actual = await vi.importActual<typeof Hooks>("@app/lib/hooks");

  return {
    ...actual,
    useUpdatePageSection: () => ({ mutate: updateSectionMock, isPending: false }),
  };
});

const { PagesEditForm } = await import("./pages-edit-form");

const makeOfferPage = () =>
  makePage(PageSlug.OFFER, [
    makeSectionRow("offer:hero", {}),
    makeSectionRow("offer:requisites", {}),
    makeSectionRow("offer:terms", {}),
    makeSectionRow("offer:seo", {}),
  ]);

afterEach(() => {
  updateSectionMock.mockReset();
});

describe("PagesEditForm", () => {
  it("names the page in the header", () => {
    render(<PagesEditForm page={makeOfferPage()} />);

    expect(screen.getByText(PAGE_LABELS[PageSlug.OFFER])).toBeInTheDocument();
  });

  it("renders one accordion per section of the page", () => {
    render(<PagesEditForm page={makeOfferPage()} />);

    ["Offer Hero", "Offer Requisites", "Offer Terms", "Offer SEO"].forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
  });

  it("hands the section body and the page slug to the update hook", async () => {
    const data = { title: "Fixture offer title", subtitle: "Fixture offer subtitle" };
    const title = "Edited fixture offer title";
    const page = makePage(PageSlug.OFFER, [makeSectionRow("offer:hero", data)]);

    render(<PagesEditForm page={page} />);

    typeInto("Section Title", title);
    clickButton("Update Section");

    await waitFor(() =>
      expect(updateSectionMock).toHaveBeenCalledExactlyOnceWith({
        slug: PageSlug.OFFER,
        body: { section: "offer:hero", data: { ...data, title } },
      }),
    );
  });
});
