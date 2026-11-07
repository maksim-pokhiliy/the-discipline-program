import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LOCALE_CODE, getLocalesResponseSchema } from "@repo/contracts/cms/locale";
import { AppError, ConflictError, InternalServerError } from "@repo/errors";

import { prisma } from "../../../db/client";
import { cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import { UK_ABOUT_HERO } from "../pages/__fixtures__/section-data";
import { ABOUT_HERO_ROW } from "../pages/__fixtures__/section-rows";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";

import {
  CATALOG_CODES,
  expectCatalogOrder,
  NEW_POLISH,
  NON_DEFAULT_CODES,
  readCatalogOrder,
} from "./__fixtures__/catalog-order";
import { CATALAN, GERMAN, seedLocaleCatalog, UKRAINIAN } from "./__fixtures__/locale-catalog";
import { refusalOf } from "./__fixtures__/lock-race";
import { cmsLocaleAdminApi } from "./admin";

describe("cmsLocaleAdminApi — catalog order", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("createLocale", () => {
    it("appends at the row count", async () => {
      const count = await cleanupRaw.marketingLocale.count();
      const created = await cmsLocaleAdminApi.createLocale(NEW_POLISH);

      expect(created).toMatchObject({ ...NEW_POLISH, isEnabled: false, sortOrder: count });
      await expectCatalogOrder([...CATALOG_CODES, NEW_POLISH.code]);
    });

    it("after a delete takes the next free slot and leaves the catalog dense", async () => {
      await cmsLocaleAdminApi.deleteLocale(GERMAN.code);

      const remainingCodes = CATALOG_CODES.filter((code) => code !== GERMAN.code);
      const created = await cmsLocaleAdminApi.createLocale(NEW_POLISH);

      expect(created.sortOrder).toBe(remainingCodes.length);
      await expectCatalogOrder([...remainingCodes, NEW_POLISH.code]);
    });

    it("takes slot one on English alone", async () => {
      await cleanupRaw.marketingLocale.deleteMany({
        where: { code: { not: DEFAULT_LOCALE_CODE } },
      });

      const created = await cmsLocaleAdminApi.createLocale(NEW_POLISH);

      expect(created.sortOrder).toBe(1);
      await expectCatalogOrder([DEFAULT_LOCALE_CODE, NEW_POLISH.code]);
    });
  });

  describe("reorderLocales", () => {
    it("writes consecutive non-default slots with English at zero and returns the full list shape", async () => {
      await seedSectionsWithOverrides({ [ABOUT_HERO_ROW.section]: UK_ABOUT_HERO }, UKRAINIAN.code);

      const orderedCodes = [...NON_DEFAULT_CODES].reverse();
      const locales = await cmsLocaleAdminApi.reorderLocales({ orderedCodes });

      await expectCatalogOrder([DEFAULT_LOCALE_CODE, ...orderedCodes]);
      expect(locales.map(({ code }) => code)).toEqual([DEFAULT_LOCALE_CODE, ...orderedCodes]);
      expect(getLocalesResponseSchema.parse(locales)).toEqual(locales);
      expect(locales).toEqual(await cmsLocaleAdminApi.getLocales());
      expect(locales.find(({ code }) => code === UKRAINIAN.code)).toMatchObject({
        translatedSectionCount: 1,
      });
      expect(locales.find(({ code }) => code === DEFAULT_LOCALE_CODE)).toMatchObject({
        isDefault: true,
        sortOrder: 0,
      });
    });

    it("maps a failed post-commit list read without rolling back the new order", async () => {
      const rawFailure = new Error("Post-commit read failed");
      const orderedCodes = [...NON_DEFAULT_CODES].reverse();

      vi.spyOn(prisma.marketingLocale, "findMany").mockRejectedValueOnce(rawFailure);

      const error = await cmsLocaleAdminApi
        .reorderLocales({ orderedCodes })
        .catch((failure: unknown) => failure);

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(InternalServerError);
      expect(error).not.toBe(rawFailure);
      expect(error).toMatchObject({ message: "Database operation failed for Locale" });
      await expectCatalogOrder([DEFAULT_LOCALE_CODE, ...orderedCodes]);
    });

    it("refuses a set missing a catalog code with ConflictError 409 and leaves the order", async () => {
      const before = await readCatalogOrder();
      const refusal = await refusalOf(
        cmsLocaleAdminApi.reorderLocales({ orderedCodes: NON_DEFAULT_CODES.slice(1) }),
      );

      expect(refusal).toMatchObject({ name: ConflictError.name, statusCode: 409 });
      expect(await readCatalogOrder()).toEqual(before);
      await expectCatalogOrder(CATALOG_CODES);
    });

    it("refuses a set naming a code the catalog no longer has with 409 and leaves the order", async () => {
      await cmsLocaleAdminApi.deleteLocale(CATALAN.code);

      const before = await readCatalogOrder();
      const refusal = await refusalOf(
        cmsLocaleAdminApi.reorderLocales({ orderedCodes: NON_DEFAULT_CODES }),
      );

      expect(refusal).toMatchObject({ name: ConflictError.name, statusCode: 409 });
      expect(await readCatalogOrder()).toEqual(before);
      await expectCatalogOrder(CATALOG_CODES.filter((code) => code !== CATALAN.code));
    });

    it("keeps consecutive slots when the reorder changes nothing", async () => {
      await cmsLocaleAdminApi.reorderLocales({ orderedCodes: NON_DEFAULT_CODES });

      await expectCatalogOrder(CATALOG_CODES);
    });
  });

  describe("deleteLocale", () => {
    it("moves every later locale up by one after deleting a middle locale", async () => {
      await cmsLocaleAdminApi.deleteLocale(GERMAN.code);

      await expectCatalogOrder(CATALOG_CODES.filter((code) => code !== GERMAN.code));
    });

    it("leaves consecutive slots after deleting the last locale", async () => {
      await cmsLocaleAdminApi.deleteLocale(CATALAN.code);

      await expectCatalogOrder(CATALOG_CODES.filter((code) => code !== CATALAN.code));
    });

    it("changes no slot when content refuses the delete", async () => {
      await seedSectionsWithOverrides({ [ABOUT_HERO_ROW.section]: UK_ABOUT_HERO }, UKRAINIAN.code);

      const before = await readCatalogOrder();

      expect(await refusalOf(cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code))).toMatchObject({
        name: ConflictError.name,
        statusCode: 409,
        details: { code: UKRAINIAN.code, translatedSectionCount: 1 },
      });
      expect(await readCatalogOrder()).toEqual(before);
      await expectCatalogOrder(CATALOG_CODES);
    });
  });
});
