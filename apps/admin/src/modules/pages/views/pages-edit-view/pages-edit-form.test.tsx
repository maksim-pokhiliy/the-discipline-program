import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PageSlug, updatePageSectionBodySchema } from "@repo/contracts/cms/pages";

import type * as Hooks from "@app/lib/hooks";
import { clickButton, typeInto, typeIntoNth } from "@app/test/interactions";
import { render } from "@app/test/render";

import { PAGE_LABELS } from "../../config/page-labels";
import { makeTermsData } from "../../list-editor.fixtures";
import { makePage, makeSectionRow, makeSeoData } from "../../pages.fixtures";

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

  it("clears a populated document and saves only a field touched after an equal empty refresh", async () => {
    const populated = makePage(PageSlug.HOME, [makeSectionRow("home:seo", makeSeoData())]);
    const empty = makePage(PageSlug.HOME, [makeSectionRow("home:seo", {})]);
    const { rerender } = render(<PagesEditForm page={populated} />);

    rerender(<PagesEditForm page={empty} />);

    expect(screen.getByLabelText("Search Result Title")).toHaveValue("");
    expect(screen.getByLabelText("Search Result Description")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();

    const title = "Only edited fixture title";

    typeInto("Search Result Title", title);
    rerender(<PagesEditForm page={makePage(PageSlug.HOME, [makeSectionRow("home:seo", {})])} />);

    expect(screen.getByLabelText("Search Result Title")).toHaveValue(title);
    expect(screen.getByLabelText("Search Result Description")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
    clickButton("Update Section");

    await waitFor(() =>
      expect(updateSectionMock).toHaveBeenCalledExactlyOnceWith({
        slug: PageSlug.HOME,
        body: { section: "home:seo", data: { title } },
      }),
    );
  });

  it("clears old field-array rows and keeps a new row through an equal empty refresh", async () => {
    const blocks = [{ heading: "Old fixture heading", body: "Old fixture body" }];
    const row = makeSectionRow("offer:terms", { title: "Old fixture title", blocks });
    const { rerender } = render(<PagesEditForm page={makePage(PageSlug.OFFER, [row])} />);

    rerender(
      <PagesEditForm page={makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", {})])} />,
    );

    expect(screen.getByLabelText("Section Title")).toHaveValue("");
    expect(screen.queryByLabelText("Heading")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Body")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();

    clickButton("Add Terms Block");
    const heading = "New fixture heading";

    typeInto("Heading", heading);
    rerender(
      <PagesEditForm page={makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", {})])} />,
    );

    expect(screen.getByLabelText("Heading")).toHaveValue(heading);
    expect(screen.getAllByLabelText("Body")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
    clickButton("Update Section");

    await waitFor(() =>
      expect(updateSectionMock).toHaveBeenCalledExactlyOnceWith({
        slug: PageSlug.OFFER,
        body: { section: "offer:terms", data: { blocks: [{ heading, body: "" }] } },
      }),
    );
  });

  it("adopts a populated server list from an empty document and saves an edit against its rows", async () => {
    const empty = makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", {})]);
    const { rerender } = render(<PagesEditForm page={empty} />);

    expect(screen.queryByLabelText("Heading")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();

    const data = makeTermsData();

    rerender(
      <PagesEditForm page={makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", data)])} />,
    );

    expect(screen.getByLabelText("Section Title")).toHaveValue(data.title);
    expect(screen.getAllByLabelText("Heading")).toHaveLength(data.blocks.length);
    expect(screen.getAllByLabelText("Body")).toHaveLength(data.blocks.length);
    data.blocks.forEach((block, index) => {
      expect(screen.getAllByLabelText("Heading")[index]).toHaveValue(block.heading);
      expect(screen.getAllByLabelText("Body")[index]).toHaveValue(block.body);
    });
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();

    const body = "Edited adopted fixture body.\n\nSecond adopted fixture paragraph.";

    typeIntoNth("Body", 1, body);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
    clickButton("Update Section");

    await waitFor(() =>
      expect(updateSectionMock).toHaveBeenCalledExactlyOnceWith({
        slug: PageSlug.OFFER,
        body: {
          section: "offer:terms",
          data: {
            ...data,
            blocks: data.blocks.map((block, index) => (index === 1 ? { ...block, body } : block)),
          },
        },
      }),
    );
  });

  it("clears requisites when a nonempty refresh drops the array key and saves only a newly added row", async () => {
    const title = "Fixture requisites title";
    const items = ["First", "Second"].map((name) => ({ label: name, value: `${name} value` }));
    const populated = makeSectionRow("offer:requisites", { title, items });
    const { rerender } = render(<PagesEditForm page={makePage(PageSlug.OFFER, [populated])} />);

    expect(screen.getByText("Requisites (2)")).toBeInTheDocument();
    rerender(
      <PagesEditForm
        page={makePage(PageSlug.OFFER, [makeSectionRow("offer:requisites", { title })])}
      />,
    );

    expect(screen.getByText("Requisites (0)")).toBeInTheDocument();
    expect(screen.queryByLabelText("Label")).not.toBeInTheDocument();
    clickButton("Add Requisite");
    const item = { label: "New fixture label", value: "New fixture value" };

    typeInto("Label", item.label);
    typeInto("Value", item.value);
    clickButton("Update Section");

    await waitFor(() => expect(updateSectionMock).toHaveBeenCalledTimes(1));
    const saved = updateSectionMock.mock.calls[0]?.[0];

    expect(saved?.slug).toBe(PageSlug.OFFER);
    expect(updatePageSectionBodySchema.parse(saved?.body)).toEqual({
      locale: "en",
      section: "offer:requisites",
      data: { title, items: [item] },
    });
  });

  it("keeps dirty edits when an equal populated document refreshes with a new timestamp", () => {
    const row = makeSectionRow("home:seo", makeSeoData());
    const { rerender } = render(<PagesEditForm page={makePage(PageSlug.HOME, [row])} />);
    const title = "Unsaved fixture title";

    typeInto("Search Result Title", title);
    const refreshed = { ...row, data: makeSeoData(), updatedAt: new Date() };

    rerender(<PagesEditForm page={makePage(PageSlug.HOME, [refreshed])} />);

    expect(screen.getByLabelText("Search Result Title")).toHaveValue(title);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
  });
});
