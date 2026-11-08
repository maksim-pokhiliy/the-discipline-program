import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";
import { QueryProvider } from "@repo/query";

import { api } from "@app/lib/api";
import { typeInto } from "@app/test/interactions";
import { resetMockNavigation } from "@app/test/mocks";
import { render } from "@app/test/render";

import {
  ENGLISH_LOCALE,
  HIDDEN_LOCALE,
  LOCALE_CATALOG,
  UKRAINIAN_LOCALE,
} from "../../locale.fixtures";
import { makePage, makeSectionRow, makeLocalizedSectionRow } from "../../pages.fixtures";

import { PagesEditForm } from "./pages-edit-form";

vi.mock("next/navigation", async () => (await import("@app/test/mocks")).buildNextNavigationMock());

beforeEach(() => {
  resetMockNavigation();
  vi.spyOn(api.locales, "list").mockResolvedValue(LOCALE_CATALOG);
});

afterEach(() => vi.restoreAllMocks());

describe("PagesEditForm across languages", () => {
  it("drops unsaved edits and remounts the fields when the language changes", () => {
    const english = makePage(PageSlug.HOME, [
      makeSectionRow("home:seo", { title: "", description: "" }),
    ]);
    const ukrainian = {
      ...makePage(PageSlug.HOME, [makeLocalizedSectionRow("home:seo")]),
      locale: "uk",
    };
    const { rerender } = render(
      <QueryProvider>
        <PagesEditForm page={english} locale={ENGLISH_LOCALE} />
      </QueryProvider>,
    );
    const originalDescription = screen.getByLabelText("Search Result Description");

    typeInto("Search Result Title", "Unsaved English title");
    rerender(
      <QueryProvider>
        <PagesEditForm page={ukrainian} locale={UKRAINIAN_LOCALE} />
      </QueryProvider>,
    );

    const description = screen.getByLabelText("Search Result Description");

    expect(screen.getByLabelText("Search Result Title")).toHaveValue("Localized title");
    expect(description).toHaveValue("Localized description");
    expect(description).not.toBe(originalDescription);
    expect(screen.getByText("Search Result Description", { selector: "label" })).toHaveAttribute(
      "data-shrink",
      "true",
    );
    expect(screen.getByRole("button", { name: "Update Section" })).toBeDisabled();
  });

  it("names the language on the whole screen and marks a disabled one hidden from the site", () => {
    const page = {
      ...makePage(PageSlug.HOME, [makeLocalizedSectionRow("home:seo")]),
      locale: "de",
    };

    render(<PagesEditForm page={page} locale={HIDDEN_LOCALE} />);

    expect(screen.getByText("Editing German")).toBeInTheDocument();
    expect(screen.getAllByText("Hidden from site")).toHaveLength(2);
    expect(screen.getByRole("combobox", { name: "Language" })).toHaveTextContent("German");
    expect(
      screen.getByText("German is hidden from the site until you enable it on the Languages page."),
    ).toBeInTheDocument();
  });

  it("links back to the Pages list in the same language", () => {
    const page = {
      ...makePage(PageSlug.HOME, [makeLocalizedSectionRow("home:seo")]),
      locale: "uk",
    };

    render(<PagesEditForm page={page} locale={UKRAINIAN_LOCALE} />);

    expect(screen.getByRole("link", { name: "Back to Pages" })).toHaveAttribute(
      "href",
      "/pages?locale=uk",
    );
  });
});
