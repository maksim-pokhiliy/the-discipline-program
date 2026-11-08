import { type LocaleCode } from "@repo/contracts/cms/locale";
import {
  type AdminPageDetails,
  PageSlug,
  SectionTranslationState,
} from "@repo/contracts/cms/pages";

import { makeTermsData } from "../../list-editor.fixtures";
import { makePage, makeSectionRow, makeTranslatedRow } from "../../pages.fixtures";

const ENGLISH_SEO = { title: "English title", description: "English description" };

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
          english: { data: ENGLISH_SEO, updatedAt: "2026-11-02T09:00:00.000Z" },
        });

  return { ...makePage(PageSlug.HOME, [section]), locale };
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
          english: { data: english, updatedAt: "2026-11-02T09:00:00.000Z" },
        });

  return { ...makePage(PageSlug.OFFER, [section]), locale };
};
