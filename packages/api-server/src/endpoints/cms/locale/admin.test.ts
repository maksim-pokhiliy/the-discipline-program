import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE_CODE,
  DEFAULT_LOCALE_NAME,
  getLocalesResponseSchema,
} from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";
import { BadRequestError, ConflictError, NotFoundError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "../pages/__fixtures__/marketing-pages-state";
import { FULL_SECTION_DATA } from "../pages/__fixtures__/section-data";
import { seedSectionsWithOverrides } from "../pages/__fixtures__/seed-with-overrides";

import {
  CATALAN,
  FRENCH,
  GERMAN,
  seedLocaleCatalog,
  UKRAINIAN,
} from "./__fixtures__/locale-catalog";
import { cmsLocaleAdminApi } from "./admin";

const ORDERED_CODES = [DEFAULT_LOCALE_CODE, UKRAINIAN.code, GERMAN.code, CATALAN.code, FRENCH.code];
const LAST_SORT_ORDER = FRENCH.sortOrder;
const POLISH = { code: "pl", name: "Polski" };
const UNKNOWN_CODE = "xx";
const ABOUT_SECTIONS = Object.values(PAGE_SECTIONS_MAP.about);
const TRANSLATED_ABOUT_SECTIONS = ABOUT_SECTIONS.slice(0, 2);

const readLocale = (code: string) => cleanupRaw.marketingLocale.findUnique({ where: { code } });

const seedUkrainianAboutRows = async (translatedSections: readonly string[]): Promise<void> => {
  await cleanupRaw.marketingPageSection.createMany({
    data: ABOUT_SECTIONS.map((section) => ({
      pageSlug: PageSlug.ABOUT,
      section,
      locale: UKRAINIAN.code,
      data: translatedSections.includes(section) ? { title: `Переклад ${section}` } : {},
    })),
  });
};

describe("cmsLocaleAdminApi", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("getLocales", () => {
    it("returns every locale ordered by sortOrder then code", async () => {
      const locales = await cmsLocaleAdminApi.getLocales();

      expect(locales.map((locale) => locale.code)).toEqual(ORDERED_CODES);
      expect(getLocalesResponseSchema.parse(locales)).toEqual(locales);
    });

    it("marks the default locale and only the default locale as default", async () => {
      const locales = await cmsLocaleAdminApi.getLocales();

      expect(locales.filter((locale) => locale.isDefault).map((locale) => locale.code)).toEqual([
        DEFAULT_LOCALE_CODE,
      ]);
    });

    it("returns disabled locales", async () => {
      const locales = await cmsLocaleAdminApi.getLocales();

      expect(locales.find((locale) => locale.code === GERMAN.code)).toMatchObject({
        ...GERMAN,
        isDefault: false,
      });
    });
  });

  describe("createLocale", () => {
    it("creates an enabled locale ordered after the current last one", async () => {
      const expected = { ...POLISH, isEnabled: true, sortOrder: LAST_SORT_ORDER + 1 };

      const created = await cmsLocaleAdminApi.createLocale(POLISH);

      expect(created).toMatchObject({ ...expected, isDefault: false });
      expect(await readLocale(POLISH.code)).toMatchObject(expected);
    });

    it("refuses a code that already exists with ConflictError", async () => {
      await expect(
        cmsLocaleAdminApi.createLocale({ code: UKRAINIAN.code, name: "Ukrainian again" }),
      ).rejects.toThrow(ConflictError);

      expect(await readLocale(UKRAINIAN.code)).toMatchObject(UKRAINIAN);
      expect(await cleanupRaw.marketingLocale.count()).toBe(ORDERED_CODES.length);
    });

    it("refuses the default locale code with ConflictError", async () => {
      await expect(
        cmsLocaleAdminApi.createLocale({ code: DEFAULT_LOCALE_CODE, name: "Another English" }),
      ).rejects.toThrow(ConflictError);

      expect(await readLocale(DEFAULT_LOCALE_CODE)).toMatchObject({ name: DEFAULT_LOCALE_NAME });
      expect(await cleanupRaw.marketingLocale.count()).toBe(ORDERED_CODES.length);
    });
  });

  describe("updateLocale", () => {
    it("updates the name, the enabled flag and the sort order", async () => {
      const changes = { name: "Ukrainian", isEnabled: false, sortOrder: 7 };

      const updated = await cmsLocaleAdminApi.updateLocale(UKRAINIAN.code, changes);

      expect(updated).toMatchObject({ code: UKRAINIAN.code, ...changes });
      expect(await readLocale(UKRAINIAN.code)).toMatchObject(changes);
    });

    it("keeps the fields an update omits", async () => {
      await cmsLocaleAdminApi.updateLocale(UKRAINIAN.code, { sortOrder: 5 });

      expect(await readLocale(UKRAINIAN.code)).toMatchObject({ ...UKRAINIAN, sortOrder: 5 });
    });

    it("refuses to disable the default locale with BadRequestError and leaves it enabled", async () => {
      await expect(
        cmsLocaleAdminApi.updateLocale(DEFAULT_LOCALE_CODE, {
          name: "English, disabled",
          isEnabled: false,
        }),
      ).rejects.toThrow(BadRequestError);

      expect(await readLocale(DEFAULT_LOCALE_CODE)).toMatchObject({
        name: DEFAULT_LOCALE_NAME,
        isEnabled: true,
      });
    });

    it("renames and reorders the default locale", async () => {
      const changes = { name: "English (UK)", sortOrder: 9 };

      const updated = await cmsLocaleAdminApi.updateLocale(DEFAULT_LOCALE_CODE, changes);

      expect(updated).toMatchObject({ ...changes, isEnabled: true, isDefault: true });
      expect(await readLocale(DEFAULT_LOCALE_CODE)).toMatchObject(changes);
    });

    it("refuses an unknown code with NotFoundError", async () => {
      await expect(
        cmsLocaleAdminApi.updateLocale(UNKNOWN_CODE, { name: "Unknown" }),
      ).rejects.toThrow(NotFoundError);

      expect(await readLocale(UNKNOWN_CODE)).toBeNull();
    });
  });

  describe("deleteLocale", () => {
    it("refuses to delete the default locale with BadRequestError and keeps the row", async () => {
      await expect(cmsLocaleAdminApi.deleteLocale(DEFAULT_LOCALE_CODE)).rejects.toThrow(
        BadRequestError,
      );

      expect(await readLocale(DEFAULT_LOCALE_CODE)).not.toBeNull();
    });

    it("refuses a locale with translated sections with ConflictError naming their count", async () => {
      await seedSectionsWithOverrides(FULL_SECTION_DATA);
      await seedUkrainianAboutRows(TRANSLATED_ABOUT_SECTIONS);

      const deletion = cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code);

      await expect(deletion).rejects.toThrow(ConflictError);
      await expect(deletion).rejects.toThrow(
        `has ${TRANSLATED_ABOUT_SECTIONS.length} translated section`,
      );
      expect(await readLocale(UKRAINIAN.code)).not.toBeNull();
      expect(
        await cleanupRaw.marketingPageSection.count({ where: { locale: UKRAINIAN.code } }),
      ).toBe(ABOUT_SECTIONS.length);
    });

    it("deletes a locale whose section rows are all empty scaffolds together with those rows", async () => {
      await seedSectionsWithOverrides(FULL_SECTION_DATA);
      await seedUkrainianAboutRows([]);

      const englishRowCount = await cleanupRaw.marketingPageSection.count({
        where: { locale: DEFAULT_LOCALE_CODE },
      });

      await cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code);

      expect(await readLocale(UKRAINIAN.code)).toBeNull();
      expect(
        await cleanupRaw.marketingPageSection.count({ where: { locale: UKRAINIAN.code } }),
      ).toBe(0);
      expect(
        await cleanupRaw.marketingPageSection.count({ where: { locale: DEFAULT_LOCALE_CODE } }),
      ).toBe(englishRowCount);
    });

    it("deletes a locale that no section row carries", async () => {
      await cmsLocaleAdminApi.deleteLocale(GERMAN.code);

      expect(await readLocale(GERMAN.code)).toBeNull();
      expect(await cleanupRaw.marketingLocale.count()).toBe(ORDERED_CODES.length - 1);
    });

    it("refuses an unknown code with NotFoundError", async () => {
      await expect(cmsLocaleAdminApi.deleteLocale(UNKNOWN_CODE)).rejects.toThrow(NotFoundError);

      expect(await cleanupRaw.marketingLocale.count()).toBe(ORDERED_CODES.length);
    });
  });
});
