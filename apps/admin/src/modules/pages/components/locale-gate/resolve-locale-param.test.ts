import { describe, expect, it } from "vitest";

import { HIDDEN_LOCALE, LOCALE_CATALOG, UKRAINIAN_LOCALE } from "../../locale.fixtures";

import { DEFAULT_EDITOR_LOCALE, resolveLocaleParam } from "./resolve-locale-param";

describe("resolveLocaleParam", () => {
  it.each([null, "", "en"])("resolves %s to English without waiting for the catalog", (param) => {
    expect(resolveLocaleParam(param, { data: undefined, isError: false })).toEqual({
      kind: "resolved",
      locale: DEFAULT_EDITOR_LOCALE,
    });
  });

  it("keeps English available when the catalog fails", () => {
    expect(resolveLocaleParam(null, { data: undefined, isError: true })).toEqual({
      kind: "resolved",
      locale: DEFAULT_EDITOR_LOCALE,
    });
  });

  it.each([UKRAINIAN_LOCALE, HIDDEN_LOCALE])("resolves the catalog entry for $code", (locale) => {
    expect(resolveLocaleParam(locale.code, { data: LOCALE_CATALOG, isError: false })).toEqual({
      kind: "resolved",
      locale: expect.objectContaining(locale),
    });
  });

  it("waits for the catalog before resolving a non-default language", () => {
    expect(resolveLocaleParam("uk", { data: undefined, isError: false })).toEqual({
      kind: "loading",
    });
  });

  it("reports a catalog failure for a non-default language", () => {
    expect(resolveLocaleParam("uk", { data: undefined, isError: true })).toEqual({
      kind: "failed",
    });
  });

  it("resolves a cached language when a background catalog refetch fails", () => {
    expect(resolveLocaleParam("uk", { data: LOCALE_CATALOG, isError: true })).toEqual({
      kind: "resolved",
      locale: expect.objectContaining(UKRAINIAN_LOCALE),
    });
  });

  it("rejects an unknown language using the cached catalog after a failed refetch", () => {
    expect(resolveLocaleParam("xx", { data: LOCALE_CATALOG, isError: true })).toEqual({
      kind: "notFound",
    });
  });

  it.each(["xx", "UK", "faq", "api", "uk-UA", " uk "])(
    "never falls back to English for %s",
    (param) => {
      expect(resolveLocaleParam(param, { data: LOCALE_CATALOG, isError: false })).toEqual({
        kind: "notFound",
      });
    },
  );

  it("does not resolve a code missing from an empty catalog", () => {
    expect(resolveLocaleParam("uk", { data: [], isError: false })).toEqual({ kind: "notFound" });
  });
});
