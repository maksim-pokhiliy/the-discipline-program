import { type Prisma } from "@prisma/client";

import { PAGE_SECTIONS_MAP, type PageSlug } from "@repo/contracts/cms/pages";

export const EMPTY_SECTION_DATA: Prisma.InputJsonObject = {};

export const getPageSectionsOrder = (pageSlug: PageSlug): string[] => {
  const sections = PAGE_SECTIONS_MAP[pageSlug];

  return Object.values(sections);
};
