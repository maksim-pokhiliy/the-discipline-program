import { PAGE_SECTIONS_MAP, type PageSlug } from "@repo/contracts/cms/pages";

export const pageSectionCount = (slug: PageSlug): number =>
  Object.keys(PAGE_SECTIONS_MAP[slug]).length;
