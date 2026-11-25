import { type z } from "zod";

import { type LocaleCode, TranslationState } from "@repo/contracts/cms/locale";
import {
  type AdminPageDetails,
  adminPageSectionSchema,
  type faqContentSchema,
  PageSlug,
  type SectionWriteData,
} from "@repo/contracts/cms/pages";

import { makeTermsData } from "../../list-editor.fixtures";
import {
  makePage,
  makeLocalizedSectionRow,
  makeSectionRow,
  makeTranslatedRow,
} from "../../pages.fixtures";

const ENGLISH_SEO = { title: "English title", description: "English description" };
const ENGLISH_UPDATED_AT = "2026-11-02T09:00:00.000Z";

export const makeLocaleFaqPage = (
  englishRows: z.infer<typeof faqContentSchema>["items"],
  words: SectionWriteData["faq:content"] = {},
): AdminPageDetails => {
  const english = { title: "English FAQ", subtitle: "English FAQ subtitle", items: englishRows };
  const data = {
    ...words,
    items: englishRows.map(({ id }) => ({ ...words.items?.find((row) => row.id === id), id })),
  };
  const hasWords = [
    words.title,
    words.subtitle,
    ...(words.items ?? []).flatMap(({ question, answer }) => [question, answer]),
  ].some((value) => typeof value === "string" && value.trim() !== "");
  const section = makeTranslatedRow("faq:content", data, {
    state: hasWords ? TranslationState.DRAFT : TranslationState.NOT_TRANSLATED,
    english: { data: english, updatedAt: ENGLISH_UPDATED_AT },
  });

  return { ...makePage(PageSlug.FAQ, [section]), locale: "uk" };
};

export const makeLocaleSeoPage = (
  locale: LocaleCode,
  title = `${locale} title`,
): AdminPageDetails => {
  const data = { title, description: `${locale} description` };
  const section =
    locale === "en"
      ? makeSectionRow("home:seo", data)
      : makeTranslatedRow("home:seo", data, {
          state: TranslationState.TRANSLATED,
          english: { data: ENGLISH_SEO, updatedAt: ENGLISH_UPDATED_AT },
        });

  return { ...makePage(PageSlug.HOME, [section]), locale };
};

export const makeClearedLocaleSeoPage = (locale: LocaleCode): AdminPageDetails => ({
  ...makePage(PageSlug.HOME, [
    makeTranslatedRow(
      "home:seo",
      {},
      {
        state: TranslationState.NOT_TRANSLATED,
        english: { data: ENGLISH_SEO, updatedAt: ENGLISH_UPDATED_AT },
      },
    ),
  ]),
  locale,
});

export const makeEnglishNewerSeoPage = (englishTitle: string): AdminPageDetails => ({
  ...makeLocaleSeoPage("uk"),
  sections: [
    makeTranslatedRow(
      "home:seo",
      { title: "uk title", description: "uk description" },
      {
        state: TranslationState.ENGLISH_NEWER,
        english: {
          data: { ...ENGLISH_SEO, title: englishTitle },
          updatedAt: ENGLISH_UPDATED_AT,
        },
      },
    ),
  ],
});

export const makeLocaleSeoAndHeroPage = (): AdminPageDetails => {
  const page = makeLocaleSeoPage("uk");

  return { ...page, sections: [...page.sections, makeLocalizedSectionRow("home:hero")] };
};

export const makeLocaleTermsPage = (
  locale: LocaleCode,
  title = `${locale} terms`,
): AdminPageDetails => {
  const english = makeTermsData(["First", "Second"]);
  const data = { ...english, title };
  const section =
    locale === "en"
      ? makeSectionRow("offer:terms", data)
      : makeTranslatedRow("offer:terms", data, {
          state: TranslationState.TRANSLATED,
          english: { data: english, updatedAt: ENGLISH_UPDATED_AT },
        });

  return { ...makePage(PageSlug.OFFER, [section]), locale };
};

export const makeContactDraftPage = (
  fieldLabels: NonNullable<SectionWriteData["contact:form"]["fieldLabels"]>,
): AdminPageDetails => ({
  ...makePage(PageSlug.CONTACT, [
    adminPageSectionSchema.parse({
      ...makeLocalizedSectionRow("contact:form", TranslationState.DRAFT),
      data: { fieldLabels },
    }),
  ]),
  locale: "uk",
});
