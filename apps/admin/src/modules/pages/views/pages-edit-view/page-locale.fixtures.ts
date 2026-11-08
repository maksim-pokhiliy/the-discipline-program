import { type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminPageDetails,
  adminPageSectionSchema,
  PageSlug,
  SectionTranslationState,
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

export const makeLocaleSeoPage = (
  locale: LocaleCode,
  title = `${locale} title`,
): AdminPageDetails => {
  const data = { title, description: `${locale} description` };
  const section =
    locale === "en"
      ? makeSectionRow("home:seo", data)
      : makeTranslatedRow("home:seo", data, {
          state: SectionTranslationState.TRANSLATED,
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
        state: SectionTranslationState.NOT_TRANSLATED,
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
        state: SectionTranslationState.ENGLISH_NEWER,
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
          state: SectionTranslationState.TRANSLATED,
          english: { data: english, updatedAt: ENGLISH_UPDATED_AT },
        });

  return { ...makePage(PageSlug.OFFER, [section]), locale };
};

export const makeContactDraftPage = (
  fieldLabels: NonNullable<SectionWriteData["contact:form"]["fieldLabels"]>,
): AdminPageDetails => ({
  ...makePage(PageSlug.CONTACT, [
    adminPageSectionSchema.parse({
      ...makeLocalizedSectionRow("contact:form", SectionTranslationState.DRAFT),
      data: { fieldLabels },
    }),
  ]),
  locale: "uk",
});
