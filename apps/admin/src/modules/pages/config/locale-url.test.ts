import { describe, expect, it } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";

import { LOCALE_PARAM, pageEditHref, pagesListHref, withLocaleParam } from "./locale-url";

describe("withLocaleParam", () => {
  it("sets the locale and keeps the open section without changing the original params", () => {
    const params = new URLSearchParams({ section: "home:hero", locale: "de", filter: "recent" });
    const next = withLocaleParam(params, "uk");

    expect(next.get(LOCALE_PARAM)).toBe("uk");
    expect(next.get("section")).toBe("home:hero");
    expect(next.get("filter")).toBe("recent");
    expect(params.get(LOCALE_PARAM)).toBe("de");
  });

  it("drops the locale for English and keeps the other params", () => {
    const params = new URLSearchParams({ section: "home:hero", locale: "uk" });
    const next = withLocaleParam(params, "en");

    expect(next.has(LOCALE_PARAM)).toBe(false);
    expect(next.get("section")).toBe("home:hero");
    expect(params.get(LOCALE_PARAM)).toBe("uk");
  });

  it("replaces duplicate locale params with one selected code", () => {
    const next = withLocaleParam(new URLSearchParams("locale=uk&locale=de"), "pl");

    expect(next.getAll(LOCALE_PARAM)).toEqual(["pl"]);
  });
});

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
