import { describe, expect, it } from "vitest";

import {
  adminLocaleListItemSchema,
  getLocalesResponseSchema,
  localeCodeParamsSchema,
  localeQuerySchema,
  reorderLocalesRequestSchema,
  reorderLocalesResponseSchema,
} from "./locale-api.schema";
import { DEFAULT_LOCALE_CODE } from "./locale.constants";
import { reorderLocalesSchema } from "./locale.schema";

const UKRAINIAN_CODE = "uk";

describe("localeQuerySchema", () => {
  it("fills the default locale when the query omits it", () => {
    expect(localeQuerySchema.parse({})).toEqual({ locale: DEFAULT_LOCALE_CODE });
  });

  it("keeps an explicit locale", () => {
    expect(localeQuerySchema.parse({ locale: UKRAINIAN_CODE })).toEqual({
      locale: UKRAINIAN_CODE,
    });
  });

  it("refuses a malformed locale instead of falling back to the default", () => {
    expect(localeQuerySchema.safeParse({ locale: "UK" }).success).toBe(false);
  });

  it("refuses an empty locale", () => {
    expect(localeQuerySchema.safeParse({ locale: "" }).success).toBe(false);
  });

  it("ignores unrelated query parameters", () => {
    expect(localeQuerySchema.parse({ locale: UKRAINIAN_CODE, utm_source: "newsletter" })).toEqual({
      locale: UKRAINIAN_CODE,
    });
    expect(localeQuerySchema.parse({ v: "2" })).toEqual({ locale: DEFAULT_LOCALE_CODE });
  });
});

describe("localeCodeParamsSchema", () => {
  it("accepts a valid code", () => {
    expect(localeCodeParamsSchema.parse({ code: UKRAINIAN_CODE })).toEqual({
      code: UKRAINIAN_CODE,
    });
  });

  it("refuses a malformed code", () => {
    expect(localeCodeParamsSchema.safeParse({ code: "uk-UA" }).success).toBe(false);
  });
});

const FIXED_DATE = new Date("2026-10-16T00:00:00.000Z");
const LOCALE_ROW = {
  code: UKRAINIAN_CODE,
  name: "Ukrainian",
  isEnabled: false,
  isDefault: false,
  sortOrder: 1,
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
};
const PRODUCT_COUNTS = { translatedProductCount: 0, shownProductCount: 0 };
const LIST_ROW = { ...LOCALE_ROW, translatedSectionCount: 0, ...PRODUCT_COUNTS };
const PRODUCT_COUNT_FIELDS = ["translatedProductCount", "shownProductCount"];

describe("adminLocaleListItemSchema", () => {
  it.each([0, 1])("accepts a translated section count of %i", (translatedSectionCount) => {
    const row = { ...LOCALE_ROW, ...PRODUCT_COUNTS, translatedSectionCount };

    expect(adminLocaleListItemSchema.parse(row)).toEqual(row);
    expect(getLocalesResponseSchema.parse([row])).toEqual([row]);
  });

  it("refuses a missing count", () => {
    expect(adminLocaleListItemSchema.safeParse(LOCALE_ROW).success).toBe(false);
  });

  it.each([-1, 1.5])("refuses a translated section count of %s", (translatedSectionCount) => {
    expect(
      adminLocaleListItemSchema.safeParse({
        ...LOCALE_ROW,
        ...PRODUCT_COUNTS,
        translatedSectionCount,
      }).success,
    ).toBe(false);
  });

  it.each([0, 1])("accepts both product counts as the non-negative integer %i", (count) => {
    const row = { ...LIST_ROW, translatedProductCount: count, shownProductCount: count };

    expect(adminLocaleListItemSchema.parse(row)).toEqual(row);
    expect(getLocalesResponseSchema.parse([row])).toEqual([row]);
  });

  it.each(PRODUCT_COUNT_FIELDS)("requires %s as a non-negative integer", (field) => {
    for (const value of [undefined, -1, 1.5, "1"]) {
      expect(adminLocaleListItemSchema.safeParse({ ...LIST_ROW, [field]: value }).success).toBe(
        false,
      );
    }
  });
});

describe("reorderLocalesRequestSchema", () => {
  it("aliases the entity reorder schema", () => {
    expect(reorderLocalesRequestSchema).toBe(reorderLocalesSchema);
  });
});

describe("reorderLocalesResponseSchema", () => {
  it("aliases the list response schema", () => {
    expect(reorderLocalesResponseSchema).toBe(getLocalesResponseSchema);
  });
});
