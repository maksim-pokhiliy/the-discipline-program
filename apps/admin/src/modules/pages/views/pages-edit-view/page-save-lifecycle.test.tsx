import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CorrelatedAdminPageDetails,
  PageSlug,
  type SectionSchemaKey,
  type UpdatePageSectionBody,
} from "@repo/contracts/cms/pages";

import type * as Api from "@app/lib/api";
import { clickButton, nthButton, typeInto, typeIntoNth } from "@app/test/interactions";
import { render } from "@app/test/render";

import { makeDeferred } from "../../deferred.fixtures";
import { makeTermsData } from "../../list-editor.fixtures";
import { makePage, makeSectionRow, makeSeoData } from "../../pages.fixtures";

const endpoints = vi.hoisted(() => ({
  getPageBySlug: vi.fn<(slug: string) => Promise<CorrelatedAdminPageDetails>>(),
  updateSection: vi.fn<(slug: string, body: UpdatePageSectionBody) => Promise<void>>(),
}));
const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@app/lib/api", async () => {
  const actual = await vi.importActual<typeof Api>("@app/lib/api");

  return { ...actual, api: { ...actual.api, pages: { ...actual.api.pages, ...endpoints } } };
});
vi.mock("sonner", () => ({ toast: notifications }));
vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

const { PagesQueryFormFixture } = await import("./pages-query-form.fixture");

const expectTermsLocked = () => {
  screen.getAllByRole("textbox").forEach((input) => expect(input).toBeDisabled());
  screen
    .getAllByRole("button", {
      name: /Add Terms Block|Move up|Move down|Remove item|Update Section/,
    })
    .forEach((button) => expect(button).toBeDisabled());
  act(() => {
    screen.getByRole("button", { name: "Add Terms Block" }).click();
    nthButton("Remove item", 0).click();
    nthButton("Move down", 0).click();
  });
  expect(screen.getAllByLabelText("Heading")).toHaveLength(2);
  expect(screen.getAllByLabelText("Heading")[0]).toHaveValue("First fixture heading");
  expect(screen.getAllByLabelText("Heading")[1]).toHaveValue("Second fixture heading");
};

const getSection = (section: SectionSchemaKey) => {
  const element = document.getElementById(`${section}-content`);

  if (!element) {
    throw new Error(`Missing section ${section}`);
  }

  return within(element);
};

beforeEach(() => {
  endpoints.getPageBySlug.mockReset();
  endpoints.updateSection.mockReset();
  notifications.success.mockReset();
  notifications.error.mockReset();
});

describe("page section save lifecycle with real query hooks", () => {
  it("excludes native text and list edits throughout PATCH and GET, then becomes clean and unlocked", async () => {
    const blocks = ["First", "Second"].map((name) => ({
      heading: `${name} fixture heading`,
      body: `${name} fixture body`,
    }));
    const data = { title: "Stored fixture title", blocks };
    const patch = makeDeferred<void>();
    const refetch = makeDeferred<CorrelatedAdminPageDetails>();

    endpoints.getPageBySlug
      .mockResolvedValueOnce(makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", data)]))
      .mockReturnValueOnce(refetch.promise);
    endpoints.updateSection.mockReturnValueOnce(patch.promise);
    render(<PagesQueryFormFixture slug={PageSlug.OFFER} />);
    await screen.findByLabelText("Section Title");

    const title = "Submitted fixture title";
    const body = "Submitted fixture body";
    const saved = {
      title,
      blocks: blocks.map((block, index) => (index === 0 ? { ...block, body } : block)),
    };

    typeInto("Section Title", title);
    typeIntoNth("Body", 0, body);
    clickButton("Update Section");

    await waitFor(() =>
      expect(endpoints.updateSection).toHaveBeenCalledExactlyOnceWith(PageSlug.OFFER, {
        section: "offer:terms",
        data: saved,
      }),
    );
    await waitFor(expectTermsLocked);
    expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(1);
    await act(async () => patch.resolve());
    await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(2));
    expectTermsLocked();
    expect(notifications.success).not.toHaveBeenCalled();

    await act(async () =>
      refetch.resolve(makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", saved)])),
    );

    await waitFor(() => expect(screen.getByLabelText("Section Title")).toBeEnabled());
    expect(screen.getByLabelText("Section Title")).toHaveValue(title);
    expect(screen.getAllByLabelText("Body")[0]).toHaveValue(body);
    expect(screen.getByRole("button", { name: "Add Terms Block" })).toBeEnabled();
    expect(nthButton("Move down", 0)).toBeEnabled();
    expect(nthButton("Remove item", 0)).toBeEnabled();
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
    expect(notifications.success).toHaveBeenCalledExactlyOnceWith("Section updated successfully");
  });

  it("retains edits and unlocks after PATCH fails, allowing a successful retry", async () => {
    const data = makeSeoData();
    const title = "Retained fixture title";
    const patch = makeDeferred<void>();

    endpoints.getPageBySlug.mockResolvedValueOnce(
      makePage(PageSlug.HOME, [makeSectionRow("home:seo", data)]),
    );
    endpoints.updateSection.mockReturnValueOnce(patch.promise);
    render(<PagesQueryFormFixture slug={PageSlug.HOME} />);
    await screen.findByLabelText("Search Result Title");
    typeInto("Search Result Title", title);
    clickButton("Update Section");
    await waitFor(() => expect(screen.getByLabelText("Search Result Title")).toBeDisabled());

    await act(async () => patch.reject(new Error("Fixture PATCH failure")));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled(),
    );
    expect(screen.getByLabelText("Search Result Title")).toHaveValue(title);
    expect(screen.getByLabelText("Search Result Title")).toBeEnabled();
    expect(screen.getByLabelText("Search Result Description")).toHaveValue(data.description);
    expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(1);
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith("Fixture PATCH failure");

    endpoints.updateSection.mockResolvedValueOnce(undefined);
    endpoints.getPageBySlug.mockResolvedValueOnce(
      makePage(PageSlug.HOME, [makeSectionRow("home:seo", { ...data, title })]),
    );
    clickButton("Update Section");

    await waitFor(() => expect(notifications.success).toHaveBeenCalledTimes(1));
    expect(endpoints.updateSection).toHaveBeenLastCalledWith(PageSlug.HOME, {
      section: "home:seo",
      data: { ...data, title },
    });
    expect(screen.getByLabelText("Search Result Title")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it("retains a reordered and edited list after PATCH fails and retries the complete body", async () => {
    const data = makeTermsData();
    const reordered = makeTermsData(["Second", "First", "Third"]);
    const title = "Retained fixture terms title";
    const body = "Edited fixture first paragraph.\n\nEdited fixture second paragraph.";
    const saved = {
      ...reordered,
      title,
      blocks: reordered.blocks.map((block, index) => (index === 0 ? { ...block, body } : block)),
    };
    const patch = makeDeferred<void>();

    endpoints.getPageBySlug.mockResolvedValueOnce(
      makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", data)]),
    );
    endpoints.updateSection.mockReturnValueOnce(patch.promise);
    render(<PagesQueryFormFixture slug={PageSlug.OFFER} />);
    await screen.findByLabelText("Section Title");
    typeInto("Section Title", title);
    typeIntoNth("Body", 1, body);
    fireEvent.click(nthButton("Move up", 1));
    clickButton("Update Section");

    await waitFor(() =>
      expect(endpoints.updateSection).toHaveBeenCalledExactlyOnceWith(PageSlug.OFFER, {
        section: "offer:terms",
        data: saved,
      }),
    );
    await waitFor(() => expect(screen.getByLabelText("Section Title")).toBeDisabled());
    await act(async () => patch.reject(new Error("Fixture list PATCH failure")));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled(),
    );
    expect(screen.getByLabelText("Section Title")).toHaveValue(title);
    saved.blocks.forEach((block, index) => {
      expect(screen.getAllByLabelText("Heading")[index]).toHaveValue(block.heading);
      expect(screen.getAllByLabelText("Body")[index]).toHaveValue(block.body);
    });
    screen.getAllByRole("textbox").forEach((input) => expect(input).toBeEnabled());
    expect(screen.getByRole("button", { name: "Add Terms Block" })).toBeEnabled();
    expect(nthButton("Move up", 0)).toBeDisabled();
    expect(nthButton("Move down", 0)).toBeEnabled();
    expect(nthButton("Move up", 1)).toBeEnabled();
    expect(nthButton("Remove item", 0)).toBeEnabled();
    expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(1);
    expect(notifications.error).toHaveBeenCalledExactlyOnceWith("Fixture list PATCH failure");
    act(() => {
      nthButton("Move down", 0).click();
    });
    act(() => {
      nthButton("Move up", 1).click();
    });

    endpoints.updateSection.mockResolvedValueOnce(undefined);
    endpoints.getPageBySlug.mockResolvedValueOnce(
      makePage(PageSlug.OFFER, [makeSectionRow("offer:terms", saved)]),
    );
    clickButton("Update Section");

    await waitFor(() => expect(notifications.success).toHaveBeenCalledTimes(1));
    expect(endpoints.updateSection).toHaveBeenCalledTimes(2);
    expect(endpoints.updateSection).toHaveBeenLastCalledWith(PageSlug.OFFER, {
      section: "offer:terms",
      data: saved,
    });
    expect(screen.getByLabelText("Section Title")).toBeEnabled();
    expect(screen.getAllByLabelText("Body")[0]).toHaveValue(body);
    expect(screen.getByRole("button", { name: "Add Terms Block" })).toBeEnabled();
    expect(nthButton("Move down", 0)).toBeEnabled();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled(),
    );
  });

  it("releases mutation pending after a failed invalidation GET", async () => {
    const patch = makeDeferred<void>();
    const refetch = makeDeferred<CorrelatedAdminPageDetails>();

    endpoints.getPageBySlug
      .mockResolvedValueOnce(makePage(PageSlug.HOME, [makeSectionRow("home:seo", makeSeoData())]))
      .mockReturnValueOnce(refetch.promise);
    endpoints.updateSection.mockReturnValueOnce(patch.promise);
    render(<PagesQueryFormFixture slug={PageSlug.HOME} />);
    await screen.findByLabelText("Search Result Title");
    const title = "Fixture title awaiting refetch";

    typeInto("Search Result Title", title);
    clickButton("Update Section");
    await waitFor(() => expect(screen.getByLabelText("Search Result Title")).toBeDisabled());
    await act(async () => patch.resolve());
    await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText("Search Result Title")).toBeDisabled();

    await act(async () => refetch.reject(new Error("Fixture GET failure")));

    await waitFor(() => expect(screen.getByLabelText("Search Result Title")).toBeEnabled());
    expect(screen.getByLabelText("Search Result Title")).toHaveValue(title);
    expect(screen.getByRole("button", { name: "Update Section" })).toBeEnabled();
    expect(notifications.success).toHaveBeenCalledTimes(1);
    expect(notifications.error).not.toHaveBeenCalled();
  });

  it("preserves dirty edits in an unchanged section when another section saves", async () => {
    const data = makeSeoData();
    const other = { title: "Stored reviews title", subtitle: "Stored reviews subtitle" };
    const patch = makeDeferred<void>();
    const refetch = makeDeferred<CorrelatedAdminPageDetails>();

    endpoints.getPageBySlug
      .mockResolvedValueOnce(
        makePage(PageSlug.HOME, [
          makeSectionRow("home:seo", data),
          makeSectionRow("home:reviews", other),
        ]),
      )
      .mockReturnValueOnce(refetch.promise);
    endpoints.updateSection.mockReturnValueOnce(patch.promise);
    render(<PagesQueryFormFixture slug={PageSlug.HOME} />);
    await screen.findByLabelText("Search Result Title");
    const subtitle = "Unsaved reviews subtitle";

    typeInto("Section Subtitle", subtitle);
    const title = "Saved SEO fixture title";

    typeInto("Search Result Title", title);
    clickButton("Update Section");
    await waitFor(() => expect(screen.getByLabelText("Section Subtitle")).toBeDisabled());
    await act(async () => patch.resolve());
    await waitFor(() => expect(endpoints.getPageBySlug).toHaveBeenCalledTimes(2));
    await act(async () =>
      refetch.resolve(
        makePage(PageSlug.HOME, [
          makeSectionRow("home:seo", { ...data, title }),
          makeSectionRow("home:reviews", { ...other }),
        ]),
      ),
    );

    await waitFor(() => expect(screen.getByLabelText("Section Subtitle")).toBeEnabled());
    expect(screen.getByLabelText("Section Subtitle")).toHaveValue(subtitle);
    expect(getSection("home:reviews").getByText("Update Section").closest("button")).toBeEnabled();
    expect(getSection("home:seo").getByText("Update Section").closest("button")).toBeDisabled();
  });
});
