import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE, getLocalesResponseSchema } from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";

import { cleanup, cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA, UK_ABOUT_HERO } from "../pages/__fixtures__/section-data";
import { ABOUT_HERO_ROW, readRows } from "../pages/__fixtures__/section-rows";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";
import { cmsPagesPublicApi } from "../pages/public";
import {
  seedProductTranslation,
  seedTranslationProduct,
  TRANSLATION_WORDS,
} from "../product/__fixtures__/translations";

import { GERMAN, readLocale, seedLocaleCatalog, UKRAINIAN } from "./__fixtures__/locale-catalog";
import { refusalOf } from "./__fixtures__/lock-race";
import { cmsLocaleAdminApi } from "./admin";

const DELETED_AT = new Date("2001-01-01T00:00:00.000Z");
const NEWER_ENGLISH_DATE = new Date("2002-01-01T00:00:00.000Z");
const INVISIBLE_TRANSLATIONS = [
  { name: "draft", isProductActive: true, isTranslationActive: false },
  { name: "hidden product", isProductActive: false, isTranslationActive: true },
];

describe("cmsLocaleAdminApi — product translations", () => {
  let snapshot: MarketingPagesState;
  let baselineShownCount: number;
  const rows: { table: string; id: string }[] = [];
  const seed = async (overrides: Parameters<typeof seedTranslationProduct>[0] = {}) => {
    const product = await seedTranslationProduct(overrides);

    rows.push({ table: "product", id: product.id });

    return product;
  };

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });
  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    baselineShownCount = await cleanupRaw.product.count({
      where: { isActive: true, deletedAt: null },
    });
  });
  afterEach(async () => {
    await cleanup(...rows.splice(0));
  });
  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  it("counts the live translations of shown products, including English-newer rows", async () => {
    const current = await seed();
    const older = await seed({ wordsUpdatedAt: NEWER_ENGLISH_DATE });

    await seedProductTranslation(current.id);
    await seedProductTranslation(older.id);
    await seedProductTranslation(current.id, { locale: GERMAN.code });

    const locales = getLocalesResponseSchema.parse(await cmsLocaleAdminApi.getLocales());
    const shown = (await cmsPagesPublicApi.getStorefrontProgramsPage(UKRAINIAN.code)).productsList;
    const ownIds = new Set([current.id, older.id]);
    const translated = shown.filter(
      ({ id, title }) => ownIds.has(id) && title === TRANSLATION_WORDS.title,
    );

    expect(translated.map(({ id }) => id).sort()).toEqual([...ownIds].sort());
    expect(locales.find(({ code }) => code === UKRAINIAN.code)?.translatedProductCount).toBe(
      translated.length,
    );
    expect(locales.find(({ code }) => code === GERMAN.code)).toMatchObject({
      isEnabled: false,
      translatedProductCount: 1,
    });
  });

  it("counts no draft, no hidden product and no deleted product", async () => {
    const draft = await seed();
    const hidden = await seed({ isActive: false });
    const deleted = await seed({ deletedAt: DELETED_AT });

    await seedProductTranslation(draft.id, { isActive: false });
    await seedProductTranslation(hidden.id);
    await seedProductTranslation(deleted.id);

    const locales = await cmsLocaleAdminApi.getLocales();
    const shown = (await cmsPagesPublicApi.getStorefrontProgramsPage(UKRAINIAN.code)).productsList;

    expect(locales.find(({ code }) => code === UKRAINIAN.code)).toMatchObject({
      translatedProductCount: 0,
      shownProductCount: baselineShownCount + 1,
    });
    expect(shown.find(({ id }) => id === draft.id)?.title).toBe(draft.title);
    expect(shown.some(({ id }) => id === hidden.id || id === deleted.id)).toBe(false);
  });

  it("reports the shown products on every language and zero translations without a row", async () => {
    await seed();
    await seed({ isActive: false });
    await seed({ deletedAt: DELETED_AT });

    const locales = await cmsLocaleAdminApi.getLocales();

    expect(locales.map(({ shownProductCount }) => shownProductCount)).toEqual(
      locales.map(() => baselineShownCount + 1),
    );
    expect(locales.map(({ translatedProductCount }) => translatedProductCount)).toEqual(
      locales.map(() => 0),
    );
  });

  it("refuses while a shown product is translated, naming both counts", async () => {
    const product = await seed();
    const translation = await seedProductTranslation(product.id);

    await seedSectionsWithOverrides(FULL_SECTION_DATA);
    await seedSectionsWithOverrides({ [ABOUT_HERO_ROW.section]: UK_ABOUT_HERO }, UKRAINIAN.code);

    const sections = await readRows(UKRAINIAN.code);

    expect(await refusalOf(cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code))).toEqual({
      name: ConflictError.name,
      statusCode: 409,
      message: `Locale ${UKRAINIAN.code} has 1 translated section(s) and 1 translated product(s); clear them or disable the locale instead`,
      details: { code: UKRAINIAN.code, translatedSectionCount: 1, translatedProductCount: 1 },
    });
    expect(await readLocale(UKRAINIAN.code)).not.toBeNull();
    expect(await readRows(UKRAINIAN.code)).toEqual(sections);
    expect(
      await cleanupRaw.productTranslation.findUnique({ where: { id: translation.id } }),
    ).toEqual(translation);
  });

  it.each(INVISIBLE_TRANSLATIONS)(
    "refuses while a $name translation exists even though the reader does not serve it",
    async ({ isProductActive, isTranslationActive }) => {
      const product = await seed({ isActive: isProductActive });
      const translation = await seedProductTranslation(product.id, {
        isActive: isTranslationActive,
      });
      const locales = await cmsLocaleAdminApi.getLocales();

      expect(locales.find(({ code }) => code === UKRAINIAN.code)?.translatedProductCount).toBe(0);
      expect(await refusalOf(cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code))).toMatchObject({
        name: ConflictError.name,
        statusCode: 409,
        details: { code: UKRAINIAN.code, translatedSectionCount: 0, translatedProductCount: 1 },
      });
      expect(await readLocale(UKRAINIAN.code)).not.toBeNull();
      expect(
        await cleanupRaw.productTranslation.findUnique({ where: { id: translation.id } }),
      ).toEqual(translation);
    },
  );

  it("deletes a language whose only product translation belongs to a deleted product", async () => {
    const product = await seed({ deletedAt: DELETED_AT });
    const translation = await seedProductTranslation(product.id);
    const german = await seedProductTranslation(product.id, { locale: GERMAN.code });

    await seedSectionsWithOverrides(FULL_SECTION_DATA);
    await cleanupRaw.marketingPageSection.create({
      data: { ...ABOUT_HERO_ROW, locale: UKRAINIAN.code, data: {} },
    });

    const englishRows = await readRows(DEFAULT_LOCALE_CODE);

    await cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code);

    expect(await readLocale(UKRAINIAN.code)).toBeNull();
    expect(
      await cleanupRaw.productTranslation.findUnique({ where: { id: translation.id } }),
    ).toBeNull();
    expect(await cleanupRaw.productTranslation.findUnique({ where: { id: german.id } })).toEqual(
      german,
    );
    expect(await cleanupRaw.product.findUnique({ where: { id: product.id } })).toEqual(product);
    expect(await readRows(UKRAINIAN.code)).toEqual([]);
    expect(await readRows(DEFAULT_LOCALE_CODE)).toEqual(englishRows);
  });
});
