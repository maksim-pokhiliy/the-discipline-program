import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE_CODE,
  DEFAULT_LOCALE_NAME,
  getPublicLocalesResponseSchema,
} from "@repo/contracts/cms/locale";

import { cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";

import { cmsLocalePublicApi } from "./public";

const UKRAINIAN = { code: "uk", name: "Українська", isEnabled: true, sortOrder: 1 };
const GERMAN = { code: "de", name: "Deutsch", isEnabled: false, sortOrder: 2 };
const FRENCH = { code: "fr", name: "Français", isEnabled: true, sortOrder: 3 };
const CATALAN = { code: "ca", name: "Català", isEnabled: true, sortOrder: 3 };
const SEEDED_LOCALES = [UKRAINIAN, GERMAN, FRENCH, CATALAN];
const ENABLED_LOCALES = [
  { code: DEFAULT_LOCALE_CODE, name: DEFAULT_LOCALE_NAME },
  { code: UKRAINIAN.code, name: UKRAINIAN.name },
  { code: CATALAN.code, name: CATALAN.name },
  { code: FRENCH.code, name: FRENCH.name },
];

describe("cmsLocalePublicApi", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await cleanupRaw.marketingLocale.createMany({ data: SEEDED_LOCALES });
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("getEnabledLocales", () => {
    it("returns the enabled locales as code and name only", async () => {
      const locales = await cmsLocalePublicApi.getEnabledLocales();

      expect(locales).toEqual(ENABLED_LOCALES);
      expect(getPublicLocalesResponseSchema.parse(locales)).toEqual(locales);
    });

    it("leaves disabled locales out", async () => {
      const locales = await cmsLocalePublicApi.getEnabledLocales();

      expect(locales.map((locale) => locale.code)).not.toContain(GERMAN.code);
      expect(await cleanupRaw.marketingLocale.count({ where: { code: GERMAN.code } })).toBe(1);
    });

    it("orders the locales by sortOrder then code", async () => {
      const locales = await cmsLocalePublicApi.getEnabledLocales();

      expect(locales.map((locale) => locale.code)).toEqual(
        ENABLED_LOCALES.map((locale) => locale.code),
      );
    });

    it("creates nothing on a table without the default locale", async () => {
      await cleanupRaw.marketingLocale.deleteMany();

      expect(await cmsLocalePublicApi.getEnabledLocales()).toEqual([]);
      expect(await cleanupRaw.marketingLocale.count()).toBe(0);
    });
  });
});
