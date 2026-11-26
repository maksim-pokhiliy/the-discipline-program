import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_LOCALE_CODE, TranslationState } from "@repo/contracts/cms/locale";
import {
  PAGE_SECTIONS_MAP,
  PageSlug,
  faqContentSchema,
  type SectionWriteData,
} from "@repo/contracts/cms/pages";
import { BadRequestError } from "@repo/errors";

import { cleanupRaw } from "../../../test/helpers";
import { seedLocaleCatalog, UKRAINIAN } from "../locale/__fixtures__/locale-catalog";
import { openTransaction, refusalOf, waitForLockWaiter } from "../locale/__fixtures__/lock-race";
import { cmsLocaleAdminApi } from "../locale/admin";

import { insertSectionRows } from "./__fixtures__/localized-section-rows";
import {
  captureMarketingPagesState,
  clearMarketingPagesState,
  restoreMarketingPagesState,
  type MarketingPagesState,
} from "./__fixtures__/marketing-pages-state";
import { UNPARSABLE_SECTION_DATA } from "./__fixtures__/section-data";
import { sectionFallbackCases } from "./__fixtures__/section-fallback";
import {
  BLANK_HERO,
  CHANGED_SHARED_HERO,
  ENGLISH_FAQ,
  ENGLISH_FEATURES,
  ENGLISH_HERO,
  ENGLISH_UPDATED_AT,
  EXPECTED_UK_FEATURES,
  NEW_ENGLISH_IMAGE,
  NEWER_ENGLISH_UPDATED_AT,
  readTranslationRow,
  seedTranslationRow,
  UK_FAQ,
  UK_FEATURES,
  UK_HERO,
  UK_HERO_TITLE_ONLY,
} from "./__fixtures__/translation-rows";
import { cmsPagesAdminApi } from "./admin";
import { lockPageSection, scaffoldSectionData } from "./page-sections";
import { cmsPagesPublicApi } from "./public";

const ABOUT = PAGE_SECTIONS_MAP.about;
const ABOUT_HERO_ROW = { pageSlug: PageSlug.ABOUT, section: ABOUT.hero };
const FALLBACK_CASES = sectionFallbackCases(ABOUT.hero, UK_HERO, UNPARSABLE_SECTION_DATA);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const saveHero = (data: SectionWriteData["about:hero"]): Promise<void> =>
  cmsPagesAdminApi.updateSection({ ...ABOUT_HERO_ROW, data, locale: UKRAINIAN.code });

const readAdminHero = async (locale = UKRAINIAN.code) => {
  const page = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, locale);

  return page.sections.find(({ section }) => section === ABOUT.hero);
};

const readCounts = async () => {
  const pages = await cmsPagesAdminApi.getPages(UKRAINIAN.code);
  const locales = await cmsLocaleAdminApi.getLocales();

  return {
    page: pages.find(({ slug }) => slug === PageSlug.ABOUT)?.translatedSectionCount,
    language: locales.find(({ code }) => code === UKRAINIAN.code)?.translatedSectionCount,
  };
};

describe("cmsPagesAdminApi — translating a section", () => {
  let snapshot: MarketingPagesState;

  beforeAll(async () => {
    snapshot = await captureMarketingPagesState();
  });

  beforeEach(async () => {
    await clearMarketingPagesState();
    await seedLocaleCatalog();
    await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, ENGLISH_HERO);
  });

  afterAll(async () => {
    await restoreMarketingPagesState(snapshot);
  });

  describe("updateSection in a non-default locale", () => {
    it("stores the English links, images and rows whatever the body says, keeping the words by row id", async () => {
      const home = PAGE_SECTIONS_MAP.home;

      await seedTranslationRow(PageSlug.HOME, home.whyChoose, ENGLISH_FEATURES);
      await saveHero(CHANGED_SHARED_HERO);
      await cmsPagesAdminApi.updateSection({
        pageSlug: PageSlug.HOME,
        section: home.whyChoose,
        locale: UKRAINIAN.code,
        data: UK_FEATURES,
      });

      expect(await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code)).toMatchObject({
        data: UK_HERO,
        isActive: true,
      });
      expect(await readTranslationRow(PageSlug.HOME, home.whyChoose, UKRAINIAN.code)).toMatchObject(
        {
          data: EXPECTED_UK_FEATURES,
          isActive: true,
        },
      );
      expect(
        (await readTranslationRow(PageSlug.HOME, home.whyChoose, UKRAINIAN.code))?.data,
      ).toEqual(EXPECTED_UK_FEATURES);
    });

    it("matches list words by row id, drops rows English lacks and leaves missing rows unwritten as a draft", async () => {
      const row = { pageSlug: PageSlug.FAQ, section: PAGE_SECTIONS_MAP.faq.content };
      const completeData = { ...UK_FAQ, items: [UK_FAQ.items[1], UK_FAQ.items[0]] };
      const partialData = { ...UK_FAQ, items: UK_FAQ.items.slice(0, 1) };

      await seedTranslationRow(row.pageSlug, row.section, ENGLISH_FAQ);
      await cmsPagesAdminApi.updateSection({ ...row, locale: UKRAINIAN.code, data: UK_FAQ });

      const complete = await readTranslationRow(row.pageSlug, row.section, UKRAINIAN.code);

      expect(complete?.data).toEqual(completeData);
      expect(complete?.isActive).toBe(true);

      await cmsPagesAdminApi.updateSection({ ...row, locale: UKRAINIAN.code, data: partialData });

      const partial = await readTranslationRow(row.pageSlug, row.section, UKRAINIAN.code);

      expect(partial?.data).toEqual({
        ...partialData,
        items: [{ id: "first" }, ...partialData.items],
      });
      expect(partial?.isActive).toBe(false);

      const page = await cmsPagesAdminApi.getPageBySlug(row.pageSlug, UKRAINIAN.code);

      expect(page.sections.find(({ section }) => section === row.section)?.translation?.state).toBe(
        TranslationState.DRAFT,
      );
      expect((await cmsPagesPublicApi.getFaqPage(UKRAINIAN.code)).content).toEqual(ENGLISH_FAQ);
    });

    it("stores a section with a word missing as a draft the reader does not serve and no count counts", async () => {
      await saveHero(UK_HERO_TITLE_ONLY);

      expect(await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code)).toMatchObject({
        data: {
          ...UK_HERO_TITLE_ONLY,
          buttonHref: ENGLISH_HERO.buttonHref,
          backgroundImage: ENGLISH_HERO.backgroundImage,
        },
        isActive: false,
      });
      expect((await readAdminHero())?.translation?.state).toBe(TranslationState.DRAFT);
      expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(ENGLISH_HERO);
      expect(await readCounts()).toEqual({ page: 0, language: 0 });
    });

    it("stores a section with every word written live and reactivates its existing draft", async () => {
      await saveHero(UK_HERO_TITLE_ONLY);
      await saveHero(UK_HERO);

      expect(await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code)).toMatchObject({
        data: UK_HERO,
        isActive: true,
      });
      expect((await readAdminHero())?.translation?.state).toBe(TranslationState.TRANSLATED);
      expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(UK_HERO);
      expect(await readCounts()).toEqual({ page: 1, language: 1 });
    });

    it("reopens a draft with its words", async () => {
      await saveHero(UK_HERO_TITLE_ONLY);

      const hero = await readAdminHero();

      expect(hero?.data).toEqual({
        ...UK_HERO_TITLE_ONLY,
        buttonHref: ENGLISH_HERO.buttonHref,
        backgroundImage: ENGLISH_HERO.backgroundImage,
      });
      expect(hero).toMatchObject({
        translation: { state: TranslationState.DRAFT },
      });
    });

    it("sends a translated section back to draft when its English gained a word", async () => {
      await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, { title: ENGLISH_HERO.title });
      await saveHero(UK_HERO_TITLE_ONLY);

      expect((await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code))?.isActive).toBe(
        true,
      );

      await cmsPagesAdminApi.updateSection({ ...ABOUT_HERO_ROW, data: ENGLISH_HERO });
      await saveHero(UK_HERO_TITLE_ONLY);

      expect((await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code))?.isActive).toBe(
        false,
      );
      expect((await readAdminHero())?.translation?.state).toBe(TranslationState.DRAFT);
    });

    it("writes the current English image when an English newer section is saved unchanged", async () => {
      await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, UK_HERO, UKRAINIAN.code);
      await cleanupRaw.marketingPageSection.update({
        where: { pageSlug_section_locale: { ...ABOUT_HERO_ROW, locale: DEFAULT_LOCALE_CODE } },
        data: {
          data: { ...ENGLISH_HERO, backgroundImage: NEW_ENGLISH_IMAGE },
          updatedAt: NEWER_ENGLISH_UPDATED_AT,
        },
      });

      expect(await readAdminHero()).toMatchObject({
        data: { ...UK_HERO, backgroundImage: NEW_ENGLISH_IMAGE },
        translation: { state: TranslationState.ENGLISH_NEWER },
      });
      expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(UK_HERO);

      await saveHero(UK_HERO);

      expect(await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code)).toMatchObject({
        data: { ...UK_HERO, backgroundImage: NEW_ENGLISH_IMAGE },
        isActive: true,
      });
      expect((await readAdminHero())?.translation?.state).toBe(TranslationState.TRANSLATED);
    });

    it("clears a section with {}", async () => {
      await saveHero(UK_HERO);

      expect(await readCounts()).toEqual({ page: 1, language: 1 });

      await saveHero({});

      expect((await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code))?.data).toEqual(
        {},
      );
      expect((await readAdminHero())?.translation?.state).toBe(TranslationState.NOT_TRANSLATED);
      expect(await readCounts()).toEqual({ page: 0, language: 0 });
      expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(ENGLISH_HERO);
      await cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code);
    });

    it("stores {} when a save writes no word", async () => {
      await saveHero(BLANK_HERO);

      expect((await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code))?.data).toEqual(
        {},
      );
      expect((await readAdminHero())?.translation?.state).toBe(TranslationState.NOT_TRANSLATED);
      await cmsLocaleAdminApi.deleteLocale(UKRAINIAN.code);
    });

    it("scaffolds a missing English section inside the non-default write", async () => {
      const row = { pageSlug: PageSlug.SITE, section: PAGE_SECTIONS_MAP.site.footer };

      await cmsPagesAdminApi.updateSection({
        ...row,
        locale: UKRAINIAN.code,
        data: { tagline: "Гасло" },
      });

      expect((await readTranslationRow(row.pageSlug, row.section))?.data).toEqual(
        scaffoldSectionData(row.section, DEFAULT_LOCALE_CODE),
      );
      expect((await readTranslationRow(row.pageSlug, row.section, UKRAINIAN.code))?.isActive).toBe(
        false,
      );
    });

    it("waits for an English write of the same section that holds the lock and composes from it", async () => {
      const englishWrite = await openTransaction(async (tx) => {
        await lockPageSection(tx, PageSlug.ABOUT, ABOUT.hero);
        await tx.marketingPageSection.update({
          where: { pageSlug_section_locale: { ...ABOUT_HERO_ROW, locale: DEFAULT_LOCALE_CODE } },
          data: { data: { ...ENGLISH_HERO, backgroundImage: NEW_ENGLISH_IMAGE } },
        });
      });
      const saving = refusalOf(saveHero(UK_HERO));

      try {
        await waitForLockWaiter("pg_advisory_xact_lock");
      } finally {
        await englishWrite.commit();
      }

      expect(await saving).toBeUndefined();
      expect(await readTranslationRow(PageSlug.ABOUT, ABOUT.hero, UKRAINIAN.code)).toMatchObject({
        data: { ...UK_HERO, backgroundImage: NEW_ENGLISH_IMAGE },
      });
    });
  });

  describe("updateSection in the default locale", () => {
    it("gives every English list row without an id a fresh one and keeps the ids it carries", async () => {
      const row = { pageSlug: PageSlug.FAQ, section: PAGE_SECTIONS_MAP.faq.content };
      const addedRows = [
        { question: "Missing id question", answer: "Missing id answer" },
        { id: "", question: "Empty id question", answer: "Empty id answer" },
      ];
      const data = { ...ENGLISH_FAQ, items: [...ENGLISH_FAQ.items, ...addedRows] };
      const original = structuredClone(data);

      await cmsPagesAdminApi.updateSection({ ...row, data });

      const stored = await readTranslationRow(row.pageSlug, row.section);
      const parsed = faqContentSchema.parse(stored?.data);
      const ids = parsed.items.map(({ id }) => id);

      expect(parsed).toEqual({
        ...data,
        items: [
          ...ENGLISH_FAQ.items,
          ...addedRows.map((item) => ({ ...item, id: expect.stringMatching(UUID) })),
        ],
      });
      expect(new Set(ids).size).toBe(ids.length);
      expect(stored?.isActive).toBe(true);
      expect(data).toEqual(original);
    });

    it("refuses an English list that repeats a row id with a BadRequestError and writes nothing", async () => {
      await clearMarketingPagesState();

      const before = await captureMarketingPagesState();
      const section = PAGE_SECTIONS_MAP.faq.content;
      const data = {
        ...ENGLISH_FAQ,
        items: ENGLISH_FAQ.items.map((item) => ({ ...item, id: "same-id" })),
      };
      const refusal = await refusalOf(
        cmsPagesAdminApi.updateSection({ pageSlug: PageSlug.FAQ, section, data }),
      );

      expect(refusal).toMatchObject({
        name: BadRequestError.name,
        statusCode: 400,
        message: "Two rows of the list share the id same-id",
        details: { section, list: "items", id: "same-id" },
      });
      expect(await captureMarketingPagesState()).toEqual(before);
    });

    it("refuses an empty English write with a BadRequestError and writes nothing", async () => {
      await clearMarketingPagesState();

      const before = await captureMarketingPagesState();
      const refusal = await refusalOf(
        cmsPagesAdminApi.updateSection({ ...ABOUT_HERO_ROW, data: {} }),
      );

      expect(refusal).toMatchObject({
        name: BadRequestError.name,
        statusCode: 400,
        message: "An English section cannot be saved empty",
        details: { section: ABOUT.hero },
      });
      expect(await captureMarketingPagesState()).toEqual(before);
    });

    it("writes an inactive English row back active", async () => {
      await seedTranslationRow(
        PageSlug.ABOUT,
        ABOUT.hero,
        ENGLISH_HERO,
        DEFAULT_LOCALE_CODE,
        false,
      );
      await cmsPagesAdminApi.updateSection({ ...ABOUT_HERO_ROW, data: ENGLISH_HERO });

      expect((await readTranslationRow(PageSlug.ABOUT, ABOUT.hero))?.isActive).toBe(true);
    });

    it("takes the same section lock for an English write", async () => {
      const heldLock = await openTransaction((tx) =>
        lockPageSection(tx, PageSlug.ABOUT, ABOUT.hero),
      );
      const saving = refusalOf(
        cmsPagesAdminApi.updateSection({ ...ABOUT_HERO_ROW, data: ENGLISH_HERO }),
      );

      try {
        await waitForLockWaiter("pg_advisory_xact_lock");
      } finally {
        await heldLock.commit();
      }

      expect(await saving).toBeUndefined();
    });
  });

  describe("getPageBySlug", () => {
    it("keeps a translation's words on their rows after English moves one row and removes another", async () => {
      const row = { pageSlug: PageSlug.FAQ, section: PAGE_SECTIONS_MAP.faq.content };
      const third = { id: "third", question: "Third question", answer: "Third answer" };
      const thirdWords = { id: "third", question: "Третє питання", answer: "Третя відповідь" };
      const english = { ...ENGLISH_FAQ, items: [...ENGLISH_FAQ.items, third] };
      const ukrainian = {
        ...UK_FAQ,
        items: [...UK_FAQ.items.slice(0, ENGLISH_FAQ.items.length).reverse(), thirdWords],
      };
      const changed = { ...ENGLISH_FAQ, items: [third, ...ENGLISH_FAQ.items.slice(0, 1)] };

      await seedTranslationRow(row.pageSlug, row.section, english);
      await seedTranslationRow(row.pageSlug, row.section, ukrainian, UKRAINIAN.code);
      await cmsPagesAdminApi.updateSection({ ...row, data: changed });

      const page = await cmsPagesAdminApi.getPageBySlug(row.pageSlug, UKRAINIAN.code);
      const section = page.sections.find(({ section }) => section === row.section);

      expect(section?.data).toEqual({ ...UK_FAQ, items: [thirdWords, UK_FAQ.items[1]] });
      expect(section?.translation).toMatchObject({
        state: TranslationState.ENGLISH_NEWER,
        english: { data: changed },
      });
      expect((await readTranslationRow(row.pageSlug, row.section, UKRAINIAN.code))?.data).toEqual(
        ukrainian,
      );
    });

    it("reads a stored English row without an id without breaking, gives it no words, and the next English save gives it an id", async () => {
      const row = { pageSlug: PageSlug.FAQ, section: PAGE_SECTIONS_MAP.faq.content };
      const english = {
        ...ENGLISH_FAQ,
        items: ENGLISH_FAQ.items.map(({ question, answer }) => ({ question, answer })),
      };
      const words = {
        ...UK_FAQ,
        items: UK_FAQ.items
          .slice(0, ENGLISH_FAQ.items.length)
          .map(({ question, answer }) => ({ question, answer })),
      };

      await seedTranslationRow(row.pageSlug, row.section, english);
      await seedTranslationRow(row.pageSlug, row.section, words, UKRAINIAN.code);

      const englishPage = await cmsPagesAdminApi.getPageBySlug(row.pageSlug);
      const translatedPage = await cmsPagesAdminApi.getPageBySlug(row.pageSlug, UKRAINIAN.code);

      expect(englishPage.sections.find(({ section }) => section === row.section)).toMatchObject({
        data: english,
        hasUnreadableData: false,
      });
      expect(translatedPage.sections.find(({ section }) => section === row.section)).toMatchObject({
        data: { title: UK_FAQ.title, subtitle: UK_FAQ.subtitle, items: [{}, {}] },
        hasUnreadableData: false,
        translation: { english: { data: english } },
      });

      await cmsPagesAdminApi.updateSection({ ...row, data: english });

      const healed = faqContentSchema.parse(
        (await readTranslationRow(row.pageSlug, row.section))?.data,
      );
      const ids = healed.items.map(({ id }) => id);
      const refreshed = await cmsPagesAdminApi.getPageBySlug(row.pageSlug, UKRAINIAN.code);

      expect(healed).toEqual({
        ...english,
        items: english.items.map((item) => ({ ...item, id: expect.stringMatching(UUID) })),
      });
      expect(new Set(ids).size).toBe(ids.length);
      expect(refreshed.sections.find(({ section }) => section === row.section)?.data).toEqual({
        title: UK_FAQ.title,
        subtitle: UK_FAQ.subtitle,
        items: healed.items.map(({ id }) => ({ id })),
      });
    });

    it("returns each non-default section with its state and its English row", async () => {
      const page = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UKRAINIAN.code);

      expect(page.sections.map(({ section }) => section)).toEqual(Object.values(ABOUT));
      expect(page.sections.every(({ translation }) => translation !== null)).toBe(true);

      const hero = page.sections.find(({ section }) => section === ABOUT.hero);

      expect(hero?.data).toEqual({
        buttonHref: ENGLISH_HERO.buttonHref,
        backgroundImage: ENGLISH_HERO.backgroundImage,
      });
      expect(hero).toMatchObject({
        hasUnreadableData: false,
        translation: {
          state: TranslationState.NOT_TRANSLATED,
          english: { data: ENGLISH_HERO, updatedAt: ENGLISH_UPDATED_AT.toISOString() },
        },
      });
    });

    it.each([DEFAULT_LOCALE_CODE, UKRAINIAN.code])(
      "keeps the %s page readable when a stored row does not parse and marks that row",
      async (locale) => {
        await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, UNPARSABLE_SECTION_DATA, locale);

        expect(await readAdminHero(locale)).toMatchObject({ hasUnreadableData: true });

        if (locale === DEFAULT_LOCALE_CODE) {
          expect((await readAdminHero(locale))?.data).toEqual({});
        } else {
          expect((await readAdminHero(locale))?.translation?.state).toBe(
            TranslationState.NOT_TRANSLATED,
          );
        }
      },
    );

    it("reads an unreadable English reference as empty", async () => {
      await seedTranslationRow(PageSlug.ABOUT, ABOUT.hero, UNPARSABLE_SECTION_DATA);

      expect((await readAdminHero())?.translation?.english.data).toEqual({});
    });

    it("leaves a row of another page's section out of the page", async () => {
      await seedTranslationRow(
        PageSlug.ABOUT,
        PAGE_SECTIONS_MAP.home.hero,
        ENGLISH_HERO,
        UKRAINIAN.code,
      );

      const page = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT, UKRAINIAN.code);

      expect(page.sections.map(({ section }) => section)).toEqual(Object.values(ABOUT));
    });

    it("returns no translation for English", async () => {
      const page = await cmsPagesAdminApi.getPageBySlug(PageSlug.ABOUT);

      expect(page.sections.every(({ translation }) => translation === null)).toBe(true);
    });

    it.each(FALLBACK_CASES)(
      "reads a Ukrainian about hero that is %s as not translated or draft and the reader falls back to English",
      async (label, rows) => {
        await insertSectionRows(PageSlug.ABOUT, UKRAINIAN.code, rows);

        const expected =
          label === "present and inactive"
            ? TranslationState.DRAFT
            : TranslationState.NOT_TRANSLATED;

        expect((await readAdminHero())?.translation?.state).toBe(expected);
        expect((await cmsPagesPublicApi.getAboutPage(UKRAINIAN.code)).hero).toEqual(ENGLISH_HERO);
      },
    );
  });
});
