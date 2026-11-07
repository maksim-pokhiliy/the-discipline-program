import { describe, expect, it } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";

import { UNPARSABLE_SECTION_DATA, UK_ABOUT_HERO } from "./__fixtures__/section-data";
import { isSectionOfPage, parseServedSectionData } from "./page-sections";

describe("parseServedSectionData", () => {
  it("serves data with a known key", () => {
    expect(parseServedSectionData("about:hero", UK_ABOUT_HERO)).toEqual({
      kind: "served",
      data: UK_ABOUT_HERO,
    });
  });

  it("returns empty for an empty object", () => {
    expect(parseServedSectionData("about:hero", {})).toEqual({ kind: "empty" });
  });

  it("returns empty for unknown keys only", () => {
    expect(parseServedSectionData("about:hero", { retiredTitle: "Old title" })).toEqual({
      kind: "empty",
    });
  });

  it("returns invalid with the Zod error for a type mismatch", () => {
    const result = parseServedSectionData("about:hero", UNPARSABLE_SECTION_DATA);

    expect(result.kind).toBe("invalid");

    if (result.kind === "invalid") {
      expect(result.error.issues).toEqual([
        expect.objectContaining({ path: ["title"], code: "invalid_type" }),
      ]);
    }
  });

  it("serves a valid partial nested item", () => {
    const data = { timeline: [{ year: "2026" }] };

    expect(parseServedSectionData("about:journey", data)).toEqual({ kind: "served", data });
  });
});

describe("isSectionOfPage", () => {
  it("accepts a section belonging to its page", () => {
    expect(isSectionOfPage(PageSlug.ABOUT, "about:hero")).toBe(true);
  });

  it.each([
    [PageSlug.HOME, "about:hero"],
    [PageSlug.ABOUT, "about:retired"],
    ["constructor", "about:hero"],
    [PageSlug.ABOUT, "constructor"],
  ])("refuses the page and section relation %s / %s", (pageSlug, section) => {
    expect(isSectionOfPage(pageSlug, section)).toBe(false);
  });
});
