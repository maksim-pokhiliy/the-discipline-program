import { describe, expect, it } from "vitest";

import { localeCodeParamsSchema, localeQuerySchema } from "./locale-api.schema";
import { DEFAULT_LOCALE_CODE } from "./locale.constants";

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
