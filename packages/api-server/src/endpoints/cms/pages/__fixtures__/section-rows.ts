import { type MarketingPageSection } from "@prisma/client";

import { type LocaleCode } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, PageSlug } from "@repo/contracts/cms/pages";

import { cleanupRaw } from "../../../../test/helpers";

export const ABOUT_SECTIONS = Object.values(PAGE_SECTIONS_MAP.about);

export const ABOUT_HERO_ROW = { pageSlug: PageSlug.ABOUT, section: PAGE_SECTIONS_MAP.about.hero };

export const readRows = (locale: LocaleCode): Promise<MarketingPageSection[]> =>
  cleanupRaw.marketingPageSection.findMany({ where: { locale }, orderBy: { id: "asc" } });
