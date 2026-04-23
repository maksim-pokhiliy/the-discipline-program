import { describe, expect, it } from "vitest";

import { isActiveHref } from "./is-active-href";

describe("isActiveHref", () => {
  it("returns false when pathname is null", () => {
    expect(isActiveHref("/library/exercises", null)).toBe(false);
  });

  it("returns true for exact match", () => {
    expect(isActiveHref("/library/exercises", "/library/exercises")).toBe(true);
  });

  it("returns true for nested sub-route when no siblings passed", () => {
    expect(isActiveHref("/library/exercises", "/library/exercises/123")).toBe(true);
  });

  it("returns false for a sibling route that shares a prefix but is not nested under it", () => {
    expect(isActiveHref("/library", "/library-archive")).toBe(false);
    expect(isActiveHref("/library/exercises", "/library/exercises-archive")).toBe(false);
  });

  it("treats root href as exact match only", () => {
    expect(isActiveHref("/", "/")).toBe(true);
    expect(isActiveHref("/", "/library/exercises")).toBe(false);
  });

  it("treats explicit exact flag as requiring a full match", () => {
    expect(isActiveHref("/library/exercises", "/library/exercises", true)).toBe(true);
    expect(isActiveHref("/library/exercises", "/library/exercises/123", true)).toBe(false);
  });

  it("accepts options object with exact flag", () => {
    expect(isActiveHref("/library/exercises", "/library/exercises/123", { exact: true })).toBe(
      false,
    );
    expect(isActiveHref("/library/exercises", "/library/exercises", { exact: true })).toBe(true);
  });

  describe("sibling nav items under /library", () => {
    const siblings = [
      "/library/exercises",
      "/library/exercises/review",
      "/library/schemes",
      "/library/block-types",
    ];

    it("marks Exercises active on /library/exercises with no sub-path", () => {
      expect(
        isActiveHref("/library/exercises", "/library/exercises", { siblingHrefs: siblings }),
      ).toBe(true);
    });

    it("marks Exercises active on its own detail sub-route", () => {
      expect(
        isActiveHref("/library/exercises", "/library/exercises/abc123", { siblingHrefs: siblings }),
      ).toBe(true);
    });

    it("does not mark Exercises as active when pathname matches the sibling /library/exercises/review", () => {
      expect(
        isActiveHref("/library/exercises", "/library/exercises/review", {
          siblingHrefs: siblings,
        }),
      ).toBe(false);
    });

    it("marks Review queue as active when pathname is /library/exercises/review", () => {
      expect(
        isActiveHref("/library/exercises/review", "/library/exercises/review", {
          siblingHrefs: siblings,
        }),
      ).toBe(true);
    });

    it("selects only the more-specific href when two items share a prefix", () => {
      const pathname = "/library/exercises/review";

      expect(isActiveHref("/library/exercises", pathname, { siblingHrefs: siblings })).toBe(false);
      expect(isActiveHref("/library/exercises/review", pathname, { siblingHrefs: siblings })).toBe(
        true,
      );
    });
  });
});
