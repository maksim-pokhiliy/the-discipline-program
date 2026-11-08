import { type MarketingPageSection, type Prisma } from "@prisma/client";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, type PageSlug, type SectionSchemaKey } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";

import { FULL_SECTION_DATA } from "./section-data";

export const ENGLISH_UPDATED_AT = new Date("2026-01-01T00:00:00.000Z");
export const NEWER_ENGLISH_UPDATED_AT = new Date("2026-02-01T00:00:00.000Z");
export const ENGLISH_HERO = FULL_SECTION_DATA[PAGE_SECTIONS_MAP.about.hero];
export const UK_HERO = {
  title: "Про тренера",
  subtitle: "Тренуйся щодня",
  buttonText: "Почати",
  buttonHref: ENGLISH_HERO.buttonHref,
  backgroundImage: ENGLISH_HERO.backgroundImage,
};
export const UK_HERO_TITLE_ONLY = { title: UK_HERO.title };
export const NEW_ENGLISH_IMAGE = "/updated-english-image.jpg";
export const CHANGED_SHARED_HERO = {
  ...UK_HERO,
  buttonHref: "/changed-translation-link",
  backgroundImage: "/changed-translation-image.jpg",
};
export const BLANK_HERO = { ...CHANGED_SHARED_HERO, title: " ", subtitle: "", buttonText: "\t" };
export const ENGLISH_FEATURES = {
  title: "Why train",
  subtitle: "Daily training",
  features: [
    { id: "first", title: "First", description: "First detail", iconName: "Run" },
    { id: "second", title: "Second", description: "Second detail", iconName: "Fitness" },
  ],
};
export const UK_FIRST_FEATURE = {
  id: "first",
  title: "Перший",
  description: "Перша деталь",
  iconName: "ChangedFirst",
};
export const UK_SECOND_FEATURE = {
  id: "second",
  title: "Другий",
  description: "Друга деталь",
  iconName: "ChangedSecond",
};
export const UK_FEATURES = {
  title: "Чому тренуватись",
  subtitle: "Щоденні тренування",
  features: [
    UK_SECOND_FEATURE,
    { id: "extra", title: "Зайвий", description: "Зайва деталь", iconName: "Extra" },
    UK_FIRST_FEATURE,
  ],
};
export const EXPECTED_UK_FEATURES = {
  ...UK_FEATURES,
  features: [
    { ...UK_FIRST_FEATURE, iconName: "Run" },
    { ...UK_SECOND_FEATURE, iconName: "Fitness" },
  ],
};
export const ENGLISH_JOURNEY = {
  title: "Journey",
  subtitle: "Milestones",
  timeline: [{ year: "2019", title: "Start", description: "Started training" }],
};
export const ENGLISH_FAQ = {
  title: "Questions",
  subtitle: "Before training",
  items: [
    { question: "First question", answer: "First answer" },
    { question: "Second question", answer: "Second answer" },
  ],
};
export const UK_FAQ = {
  title: "Питання",
  subtitle: "Перед тренуванням",
  items: [
    { question: "Друге питання", answer: "Друга відповідь" },
    { question: "Перше питання", answer: "Перша відповідь" },
    { question: "Зайве питання", answer: "Зайва відповідь" },
  ],
};

export const seedTranslationRow = async (
  pageSlug: PageSlug,
  section: SectionSchemaKey,
  data: Prisma.InputJsonValue,
  locale: LocaleCode = DEFAULT_LOCALE_CODE,
  isActive = true,
): Promise<void> => {
  await cleanupRaw.marketingPage.createMany({
    data: [{ slug: pageSlug, title: pageSlug }],
    skipDuplicates: true,
  });

  const where = { pageSlug, section, locale };
  const row = { data, isActive, updatedAt: ENGLISH_UPDATED_AT };

  await cleanupRaw.marketingPageSection.upsert({
    where: { pageSlug_section_locale: where },
    create: { ...where, ...row },
    update: row,
  });
};

export const readTranslationRow = (
  pageSlug: PageSlug,
  section: SectionSchemaKey,
  locale: LocaleCode = DEFAULT_LOCALE_CODE,
): Promise<MarketingPageSection | null> =>
  cleanupRaw.marketingPageSection.findUnique({
    where: { pageSlug_section_locale: { pageSlug, section, locale } },
  });
