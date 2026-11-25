import { describe, expect, it } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";

import { pageEditHref, pagesListHref } from "./locale-url";

describe("pagesListHref / pageEditHref", () => {
  it("links the English list and editor without a locale query", () => {
    expect(pagesListHref("en")).toBe("/pages");
    expect(pageEditHref(PageSlug.HOME, "en")).toBe("/pages/home");
  });

  it("links the list and editor in the selected language", () => {
    expect(pagesListHref("uk")).toBe("/pages?locale=uk");
    expect(pageEditHref(PageSlug.HOME, "uk")).toBe("/pages/home?locale=uk");
  });
});
