import { describe, expect, it } from "vitest";

import { isCatalogPermutation } from "./catalog-permutation";

const CATALOG = ["uk", "de", "fr"];

describe("isCatalogPermutation", () => {
  it("accepts the catalog in any order", () => {
    expect(isCatalogPermutation(CATALOG, CATALOG)).toBe(true);
    expect(isCatalogPermutation(CATALOG, [...CATALOG].reverse())).toBe(true);
  });

  it("refuses a missing code", () => {
    expect(isCatalogPermutation(CATALOG, CATALOG.slice(1))).toBe(false);
  });

  it("refuses an extra code", () => {
    expect(isCatalogPermutation(CATALOG, [...CATALOG, "pl"])).toBe(false);
  });

  it("refuses a duplicate code", () => {
    expect(isCatalogPermutation(CATALOG, ["uk", "de", "de"])).toBe(false);
  });

  it("refuses a complete catalog with an additional duplicate", () => {
    expect(isCatalogPermutation(CATALOG, ["uk", "de", "fr", "fr"])).toBe(false);
  });

  it("accepts two empty lists", () => {
    expect(isCatalogPermutation([], [])).toBe(true);
  });
});
