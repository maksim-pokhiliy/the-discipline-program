import { PAGE_SECTIONS_MAP, type PageSlug } from "@repo/contracts/pages";

export const getPageSectionsOrder = (pageSlug: PageSlug): string[] => {
  const sections = PAGE_SECTIONS_MAP[pageSlug];

  return Object.values(sections);
};
