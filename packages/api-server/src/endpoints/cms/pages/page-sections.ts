import { type Prisma } from "@prisma/client";

import { DEFAULT_LOCALE_CODE, type LocaleCode } from "@repo/contracts/cms/locale";
import { PAGE_SECTIONS_MAP, type PageSlug, SECTION_DEFAULTS } from "@repo/contracts/cms/pages";

export const EMPTY_SECTION_DATA: Prisma.InputJsonObject = {};

const DEFAULT_SECTION_DATA: ReadonlyMap<string, Prisma.InputJsonObject> = new Map(
  Object.entries(SECTION_DEFAULTS),
);

export const getPageSectionsOrder = (pageSlug: PageSlug): string[] => {
  const sections = PAGE_SECTIONS_MAP[pageSlug];

  return Object.values(sections);
};

export const scaffoldSectionData = (
  section: string,
  locale: LocaleCode,
): Prisma.InputJsonObject => {
  if (locale !== DEFAULT_LOCALE_CODE) {
    return EMPTY_SECTION_DATA;
  }

  return DEFAULT_SECTION_DATA.get(section) ?? EMPTY_SECTION_DATA;
};
