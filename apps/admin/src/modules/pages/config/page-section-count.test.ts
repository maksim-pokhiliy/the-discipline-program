import { describe, expect, it } from "vitest";

import { PageSlug } from "@repo/contracts/cms/pages";

import { pageSectionCount } from "./page-section-count";

describe("pageSectionCount", () => {
  it.each([
    [PageSlug.HOME, 6],
    [PageSlug.STOREFRONT, 4],
    [PageSlug.ABOUT, 6],
    [PageSlug.BLOG, 4],
    [PageSlug.CONTACT, 3],
    [PageSlug.FAQ, 4],
    [PageSlug.OFFER, 4],
    [PageSlug.SITE, 4],
  ])("counts the canonical sections of %s", (slug, expected) => {
    expect(pageSectionCount(slug)).toBe(expected);
  });
});
